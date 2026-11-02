from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Officer, AuditLog, Vehicle
from app.api.dependencies import get_current_admin
from app.core.security import hash_password

router = APIRouter(prefix="/admin", tags=["Supervisory Administration"])

class OfficerCreateRequest(BaseModel):
    badge_number: str
    name: str
    station: Optional[str] = "Traffic Police Central HQ"
    role: Optional[str] = "officer"
    password: str

class OfficerAdminResponse(BaseModel):
    id: int
    badge_number: str
    name: str
    station: str
    role: str
    is_active: bool
    created_at: str

@router.get("/officers", response_model=List[OfficerAdminResponse])
def list_officers(
    db: Session = Depends(get_db),
    admin: Officer = Depends(get_current_admin)
):
    officers = db.query(Officer).all()
    return [
        OfficerAdminResponse(
            id=o.id,
            badge_number=o.badge_number,
            name=o.name,
            station=o.station,
            role=o.role,
            is_active=o.is_active,
            created_at=o.created_at.strftime("%Y-%m-%d %H:%M:%S") if o.created_at else ""
        )
        for o in officers
    ]

@router.post("/officers", response_model=OfficerAdminResponse, status_code=status.HTTP_201_CREATED)
def create_officer(
    req: OfficerCreateRequest,
    db: Session = Depends(get_db),
    admin: Officer = Depends(get_current_admin)
):
    clean_badge = req.badge_number.strip().upper()
    existing = db.query(Officer).filter(Officer.badge_number == clean_badge).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Officer with badge number '{clean_badge}' already exists."
        )

    officer = Officer(
        badge_number=clean_badge,
        name=req.name.strip(),
        station=req.station.strip() if req.station else "Traffic Police Central HQ",
        role=req.role.strip() if req.role else "officer",
        hashed_password=hash_password(req.password),
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)

    return OfficerAdminResponse(
        id=officer.id,
        badge_number=officer.badge_number,
        name=officer.name,
        station=officer.station,
        role=officer.role,
        is_active=officer.is_active,
        created_at=officer.created_at.strftime("%Y-%m-%d %H:%M:%S")
    )

@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin: Officer = Depends(get_current_admin)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": l.id,
            "officer_badge": l.officer_badge,
            "action": l.action,
            "registration_queried": l.registration_queried,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "",
            "ip_address": l.ip_address,
            "details": l.details
        }
        for l in logs
    ]

@router.delete("/vehicles/{registration_number}")
def delete_vehicle(
    registration_number: str,
    db: Session = Depends(get_db),
    admin: Officer = Depends(get_current_admin)
):
    clean_plate = registration_number.replace(" ", "").replace("-", "").upper()
    veh = db.query(Vehicle).filter(Vehicle.registration_number == clean_plate).first()
    if not veh:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle '{clean_plate}' not found."
        )
    db.delete(veh)
    db.commit()
    return {"success": True, "message": f"Vehicle {clean_plate} record removed."}
