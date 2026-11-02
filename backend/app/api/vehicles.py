from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Vehicle, RCRecord, InsuranceRecord, PUCRecord, TaxRecord, Challan, AuditLog, Officer
from app.schemas.vehicle import (
    VehicleDetailResponse, DocumentsWrapper, RCDocument,
    InsuranceDocument, PUCDocument, RoadTaxDocument, ChallanSummary
)
from app.api.dependencies import get_current_officer

router = APIRouter(prefix="/vehicles", tags=["Vehicle Verification"])

def build_vehicle_response(vehicle: Vehicle) -> VehicleDetailResponse:
    today = date.today()
    overall_status = "compliant"

    # 1. RC Document
    rc_doc = None
    if vehicle.rc_record:
        days_left = (vehicle.rc_record.expiry_date - today).days
        doc_status = "expired" if days_left < 0 else ("warning" if days_left <= 30 else "valid")
        if doc_status == "expired":
            overall_status = "violation"
        elif doc_status == "warning" and overall_status != "violation":
            overall_status = "warning"
        
        rc_doc = RCDocument(
            status=doc_status,
            rc_number=vehicle.rc_record.rc_number,
            chassis_number=vehicle.rc_record.chassis_number,
            engine_number=vehicle.rc_record.engine_number,
            issue_date=vehicle.rc_record.issue_date.isoformat(),
            expiry_date=vehicle.rc_record.expiry_date.isoformat(),
            days_left=days_left
        )

    # 2. Insurance Document
    ins_doc = None
    if vehicle.insurance_record:
        days_left = (vehicle.insurance_record.expiry_date - today).days
        doc_status = "expired" if days_left < 0 else ("warning" if days_left <= 30 else "valid")
        if doc_status == "expired":
            overall_status = "violation"
        elif doc_status == "warning" and overall_status != "violation":
            overall_status = "warning"

        ins_doc = InsuranceDocument(
            status=doc_status,
            policy_number=vehicle.insurance_record.policy_number,
            insurer_name=vehicle.insurance_record.insurer_name,
            policy_type=vehicle.insurance_record.policy_type,
            issue_date=vehicle.insurance_record.issue_date.isoformat(),
            expiry_date=vehicle.insurance_record.expiry_date.isoformat(),
            days_left=days_left
        )

    # 3. PUC Document
    puc_doc = None
    if vehicle.puc_record:
        days_left = (vehicle.puc_record.expiry_date - today).days
        doc_status = "expired" if days_left < 0 else ("warning" if days_left <= 30 else "valid")
        if doc_status == "expired":
            overall_status = "violation"
        elif doc_status == "warning" and overall_status != "violation":
            overall_status = "warning"

        puc_doc = PUCDocument(
            status=doc_status,
            certificate_number=vehicle.puc_record.certificate_number,
            emission_norm=vehicle.puc_record.emission_norm,
            tested_value=vehicle.puc_record.tested_value,
            issue_date=vehicle.puc_record.issue_date.isoformat(),
            expiry_date=vehicle.puc_record.expiry_date.isoformat(),
            days_left=days_left
        )

    # 4. Road Tax Document
    tax_doc = None
    if vehicle.tax_record:
        days_left = (vehicle.tax_record.valid_until - today).days
        doc_status = "pending" if days_left < 0 else "paid"
        if doc_status == "pending":
            overall_status = "violation"

        tax_doc = RoadTaxDocument(
            status=doc_status,
            tax_type=vehicle.tax_record.tax_type,
            amount_paid=vehicle.tax_record.amount_paid,
            payment_date=vehicle.tax_record.payment_date.isoformat(),
            valid_until=vehicle.tax_record.valid_until.isoformat(),
            days_left=days_left
        )

    # Previous Challans
    prev_challans = []
    for c in vehicle.challans:
        prev_challans.append(ChallanSummary(
            id=c.id,
            challan_number=c.challan_number,
            violation_code=c.violation_code,
            violation_title=c.violation_title,
            rule_section=c.rule_section,
            fine_amount=c.fine_amount,
            location=c.location,
            issued_at=c.issued_at.strftime("%Y-%m-%d %H:%M:%S") if c.issued_at else "",
            due_date=c.due_date.isoformat() if c.due_date else "",
            payment_status=c.payment_status
        ))

    return VehicleDetailResponse(
        registration_number=vehicle.registration_number,
        owner_name=vehicle.owner_name,
        owner_phone=vehicle.owner_phone,
        owner_email=vehicle.owner_email,
        vehicle_class=vehicle.vehicle_class,
        maker_model=vehicle.maker_model,
        fuel_type=vehicle.fuel_type,
        color=vehicle.color,
        registration_date=vehicle.registration_date.isoformat(),
        registered_rto=vehicle.registered_rto,
        status=overall_status,
        documents=DocumentsWrapper(
            rc=rc_doc,
            insurance=ins_doc,
            puc=puc_doc,
            road_tax=tax_doc
        ),
        previous_challans=prev_challans,
        is_mock=False
    )

@router.get("/{registration_number}", response_model=VehicleDetailResponse)
def get_vehicle_by_plate(
    registration_number: str,
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    clean_plate = registration_number.replace(" ", "").replace("-", "").upper()
    vehicle = db.query(Vehicle).filter(Vehicle.registration_number == clean_plate).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No vehicle record found for registration plate '{clean_plate}'."
        )

    # Record Audit Log
    try:
        audit = AuditLog(
            officer_id=officer.id,
            officer_badge=officer.badge_number,
            action="lookup_manual",
            registration_queried=clean_plate,
            timestamp=datetime.utcnow(),
            details=f"Manual vehicle verification query for {clean_plate}."
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    return build_vehicle_response(vehicle)

@router.get("", response_model=List[VehicleDetailResponse])
def list_vehicles(
    query: Optional[str] = Query(None, description="Search term for registration, owner, or model"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    officer: Officer = Depends(get_current_officer)
):
    q = db.query(Vehicle)
    if query:
        term = f"%{query.strip().upper()}%"
        q = q.filter(
            (Vehicle.registration_number.ilike(term)) |
            (Vehicle.owner_name.ilike(term)) |
            (Vehicle.maker_model.ilike(term))
        )
    
    vehicles = q.offset(offset).limit(limit).all()
    return [build_vehicle_response(v) for v in vehicles]
