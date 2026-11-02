from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class LoginRequest(BaseModel):
    officer_id: Optional[str] = None
    badge_number: Optional[str] = None
    password: str

    def get_identifier(self) -> str:
        return self.officer_id or self.badge_number or ""

class OfficerResponse(BaseModel):
    id: int
    badge_number: str
    name: str
    station: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: OfficerResponse
    is_mock: bool = False
