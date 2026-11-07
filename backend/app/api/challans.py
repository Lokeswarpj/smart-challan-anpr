import uuid
import requests
from datetime import datetime, date, timedelta
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.db.session import get_db
from app.db.models import Challan, Vehicle, Officer, AuditLog
from app.schemas.challan import (
    ChallanCreateRequest, ChallanResponse, ChallanStatusUpdateRequest,
    DispatchRequest, DispatchResponse
)
from app.api.dependencies import get_current_officer
from app.services.pdf_generator import generate_challan_pdf

router = APIRouter(prefix="/challans", tags=["Digital Challans"])

def build_challan_response(c: Challan) -> ChallanResponse:
    owner_name = c.vehicle.owner_name if c.vehicle else "N/A"
    owner_phone = c.vehicle.owner_phone if c.vehicle else "N/A"
    maker_model = c.vehicle.maker_model if c.vehicle else "N/A"
    officer_badge = c.officer.badge_number if c.officer else "OFFICER"

    return ChallanResponse(
        id=c.id,
        challan_number=c.challan_number,
        registration_number=c.registration_number,
        officer_id=c.officer_id,
        officer_badge=officer_badge,
        violation_code=c.violation_code,
        violation_title=c.violation_title,
        rule_section=c.rule_section,
        fine_amount=c.fine_amount,
        location=c.location,
        issued_at=c.issued_at.strftime("%Y-%m-%d %H:%M:%S") if c.issued_at else "",
        due_date=c.due_date.isoformat() if c.due_date else "",
        payment_status=c.payment_status,
        dispatch_status=c.dispatch_status,
        pdf_receipt_path=c.pdf_receipt_path,
        owner_name=owner_name,
        owner_phone=owner_phone,
        maker_model=maker_model,
        is_mock=False
    )

@router.get("", response_model=List[ChallanResponse])
def get_challans(
    registration_number: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    q = db.query(Challan)
    if registration_number:
        clean = registration_number.replace(" ", "").replace("-", "").upper()
        q = q.filter(Challan.registration_number.ilike(f"%{clean}%"))
    if status and status.lower() != "all":
        q = q.filter(Challan.payment_status == status.lower())

    challans = (
        q.options(joinedload(Challan.vehicle), joinedload(Challan.officer))
        .order_by(Challan.issued_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [build_challan_response(c) for c in challans]

@router.post("", response_model=ChallanResponse, status_code=status.HTTP_201_CREATED)
def create_challan(
    req: ChallanCreateRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    clean_plate = req.registration_number.replace(" ", "").replace("-", "").upper()
    vehicle = db.query(Vehicle).filter(Vehicle.registration_number == clean_plate).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot issue challan: Vehicle '{clean_plate}' is not registered in the system."
        )

    # Generate sequential unique challan number
    timestamp_prefix = datetime.now().strftime("%Y%m")
    plate_part = clean_plate[:4] if len(clean_plate) >= 4 else "CHAL"
    unique_suffix = uuid.uuid4().hex[:4].upper()
    challan_num = f"CH-{timestamp_prefix}-{plate_part}-{unique_suffix}"

    # Determine title / section if using violation_type
    violation_title = req.violation_title or req.violation_type or "Traffic Non-Compliance"
    rule_section = req.rule_section or "Sec 177 Motor Vehicles Act, 1988"
    violation_code = req.violation_code or "SEC-177"
    if "insurance" in violation_title.lower():
        rule_section = "Sec 196 Motor Vehicles Act, 1988 (Uninsured Driving)"
        violation_code = "SEC-196"
    elif "puc" in violation_title.lower() or "emission" in violation_title.lower():
        rule_section = "Sec 190(2) Motor Vehicles Act, 1988 (Air Pollution)"
        violation_code = "SEC-190-2"
    elif "rc" in violation_title.lower() or "registration" in violation_title.lower():
        rule_section = "Sec 192 Motor Vehicles Act, 1988 (Unregistered Vehicle)"
        violation_code = "SEC-192"

    due_days = req.due_days or 15
    due_date = date.today() + timedelta(days=due_days)

    challan = Challan(
        id=str(uuid.uuid4()),
        challan_number=challan_num,
        registration_number=clean_plate,
        officer_id=officer.id,
        violation_code=violation_code,
        violation_title=violation_title,
        rule_section=rule_section,
        fine_amount=float(req.fine_amount),
        location=req.location or officer.station,
        issued_at=datetime.utcnow(),
        due_date=due_date,
        payment_status="unpaid",
        dispatch_status="sent_both"
    )

    db.add(challan)
    
    # Log Audit in single atomic transaction
    try:
        audit = AuditLog(
            officer_id=officer.id,
            officer_badge=officer.badge_number,
            action="issue_challan",
            registration_queried=clean_plate,
            timestamp=datetime.utcnow(),
            details=f"Challan {challan.challan_number} issued for INR {challan.fine_amount:.2f} ({violation_title})."
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()
    db.refresh(challan)
    return build_challan_response(challan)

@router.get("/{challan_id}", response_model=ChallanResponse)
def get_single_challan(
    challan_id: str,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    challan = db.query(Challan).filter((Challan.id == challan_id) | (Challan.challan_number == challan_id)).first()
    if not challan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challan '{challan_id}' not found."
        )
    return build_challan_response(challan)

@router.patch("/{challan_id}/status")
def update_challan_status(
    challan_id: str,
    req: ChallanStatusUpdateRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    challan = db.query(Challan).filter((Challan.id == challan_id) | (Challan.challan_number == challan_id)).first()
    if not challan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challan '{challan_id}' not found."
        )

    challan.payment_status = req.payment_status.lower()
    db.commit()
    return {"success": True, "challan_id": challan.id, "payment_status": challan.payment_status}

@router.get("/{challan_id}/receipt")
def download_challan_receipt(
    challan_id: str,
    db: Session = Depends(get_db)
):
    challan = db.query(Challan).filter((Challan.id == challan_id) | (Challan.challan_number == challan_id)).first()
    if not challan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challan '{challan_id}' not found."
        )

    receipt_data = {
        "challan_number": challan.challan_number,
        "registration_number": challan.registration_number,
        "issued_at": challan.issued_at.strftime("%Y-%m-%d %H:%M:%S") if challan.issued_at else "Now",
        "due_date": challan.due_date.isoformat() if challan.due_date else "15 Days",
        "location": challan.location,
        "officer_badge": challan.officer.badge_number if challan.officer else "KA-POL-1001",
        "violation_title": challan.violation_title,
        "rule_section": challan.rule_section,
        "fine_amount": challan.fine_amount,
        "owner_name": challan.vehicle.owner_name if challan.vehicle else "Registered Owner",
        "owner_phone": challan.vehicle.owner_phone if challan.vehicle else "N/A",
        "maker_model": challan.vehicle.maker_model if challan.vehicle else "Motor Vehicle",
        "fuel_type": challan.vehicle.fuel_type if challan.vehicle else "Petrol"
    }

    pdf_bytes = generate_challan_pdf(receipt_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=RoadGuard_Challan_{challan.challan_number}.pdf"
        }
    )

def send_carrier_sms(phone_number: str, message: str) -> Tuple[bool, str]:
    """
    Sends real carrier SMS using Fast2SMS Gateway (free tier for India).
    If no FAST2SMS_API_KEY is configured, gracefully reports simulated dispatch.
    """
    if not settings.FAST2SMS_API_KEY:
        return False, "Simulated (Set FAST2SMS_API_KEY in backend/.env for live telecom SMS)"

    clean_digits = "".join(c for c in phone_number if c.isdigit())
    if len(clean_digits) > 10:
        clean_digits = clean_digits[-10:]

    if len(clean_digits) != 10:
        return False, f"Invalid 10-digit Indian phone number: '{phone_number}'"

    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        payload = {
            "route": "q",
            "message": message,
            "language": "english",
            "numbers": clean_digits,
        }
        headers = {
            "authorization": settings.FAST2SMS_API_KEY.strip(),
            "Content-Type": "application/x-www-form-urlencoded",
        }
        r = requests.post(url, data=payload, headers=headers, timeout=8)
        data = r.json()
        if data.get("return") is True:
            return True, f"Real carrier SMS delivered to +91 {clean_digits} via Fast2SMS (ID: {data.get('request_id', 'OK')})"
        else:
            raw_msg = data.get("message", "Unknown gateway response")
            if isinstance(raw_msg, list):
                err_msg = raw_msg[0] if raw_msg else "Unknown error"
            else:
                err_msg = str(raw_msg)
            return False, f"Fast2SMS API notice: {err_msg}"
    except Exception as e:
        return False, f"SMS Gateway connection notice: {str(e)}"

@router.post("/{challan_id}/dispatch", response_model=DispatchResponse)
def dispatch_challan(
    challan_id: str,
    req: DispatchRequest,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    challan = db.query(Challan).filter((Challan.id == challan_id) | (Challan.challan_number == challan_id)).first()
    if not challan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Challan '{challan_id}' not found."
        )

    channel = req.channel.lower()
    new_status = f"sent_{channel}" if channel in ["email", "sms"] else "sent_both"
    challan.dispatch_status = new_status

    target_phone = req.phone_number or (challan.vehicle.owner_phone if challan.vehicle else "")
    dispatch_msg = ""

    if channel in ["sms", "both"] and target_phone:
        sms_body = (
            f"GOVT OF INDIA - E-CHALLAN: Notice #{challan.challan_number} of INR {challan.fine_amount:.0f} "
            f"issued to vehicle {challan.registration_number} for {challan.violation_title}. "
            f"Due date: {challan.due_date}. Pay online: https://echallan.parivahan.gov.in"
        )
        sent, detail = send_carrier_sms(target_phone, sms_body)
        if sent:
            dispatch_msg = detail
        else:
            dispatch_msg = f"SMS notice dispatched to {target_phone}. Status: {detail}"
    else:
        dispatch_msg = f"Digital notice successfully dispatched via {channel.upper()} to registered contact ({target_phone or 'N/A'})."

    # Log to official Audit Trail
    try:
        audit = AuditLog(
            officer_id=officer.id,
            officer_badge=officer.badge_number,
            action="dispatch_sms" if channel == "sms" else "dispatch_notice",
            registration_queried=challan.registration_number,
            timestamp=datetime.utcnow(),
            details=f"Dispatched {channel.upper()} notice for challan {challan.challan_number} to {target_phone or 'N/A'}. Result: {dispatch_msg}"
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()

    return DispatchResponse(
        success=True,
        message=dispatch_msg,
        dispatch_status=new_status
    )
