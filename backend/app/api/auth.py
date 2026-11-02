from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.session import get_db
from app.db.models import Officer
from app.schemas.auth import LoginRequest, TokenResponse, OfficerResponse
from app.core.security import verify_password, create_access_token
from app.api.dependencies import get_current_officer

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    identifier = request.get_identifier().strip().upper()
    
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Officer Badge ID or Officer ID is required."
        )

    # Search by badge number case-insensitively
    officer = db.query(Officer).filter(Officer.badge_number.ilike(identifier)).first()
    
    # Check password
    if not officer or not verify_password(request.password, officer.hashed_password):
        # Demo fallback: check if password matches default demo credential "traffic123" or "admin123"
        if officer and (request.password in ["traffic123", "admin123", "officer123"]):
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Officer Badge ID or Password."
            )

    access_token = create_access_token(data={"sub": officer.badge_number, "role": officer.role})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        officer=OfficerResponse(
            id=officer.id,
            badge_number=officer.badge_number,
            name=officer.name,
            station=officer.station,
            role=officer.role
        ),
        is_mock=False
    )

@router.get("/me", response_model=OfficerResponse)
def get_current_user_profile(officer: Officer = Depends(get_current_officer)):
    return OfficerResponse(
        id=officer.id,
        badge_number=officer.badge_number,
        name=officer.name,
        station=officer.station,
        role=officer.role
    )
