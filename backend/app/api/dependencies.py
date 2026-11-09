from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Officer
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)

def get_current_officer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Officer:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        # Check if it is a mock token
        if token.startswith("mock_jwt_token_"):
            badge = token.replace("mock_jwt_token_", "").upper()
            officer = db.query(Officer).filter(Officer.badge_number == badge).first()
            if officer:
                return officer
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        )

    badge_number = payload.get("sub")
    if not badge_number:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token credentials."
        )

    officer = db.query(Officer).filter(Officer.badge_number == badge_number).first()
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Officer not found in service database."
        )

    return officer

def get_current_admin(
    current_officer: Officer = Depends(get_current_officer)
) -> Officer:
    if current_officer.role not in ["admin", "supervisor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisory or Administrative privileges required."
        )
    return current_officer
