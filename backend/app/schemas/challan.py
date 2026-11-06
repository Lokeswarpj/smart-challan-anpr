from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class ChallanCreateRequest(BaseModel):
    registration_number: str
    violation_code: Optional[str] = "SEC-177"
    violation_title: Optional[str] = "Traffic Rule Violation"
    rule_section: Optional[str] = "Motor Vehicles Act, 1988"
    fine_amount: float
    location: Optional[str] = "MG Road Junction, Bengaluru"
    violation_type: Optional[str] = None
    notes: Optional[str] = None
    due_days: Optional[int] = 15

class ChallanResponse(BaseModel):
    id: str
    challan_number: str
    registration_number: str
    officer_id: int
    officer_badge: Optional[str] = None
    violation_code: str
    violation_title: str
    rule_section: str
    fine_amount: float
    location: str
    issued_at: str
    due_date: str
    payment_status: str
    dispatch_status: str
    pdf_receipt_path: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    maker_model: Optional[str] = None
    is_mock: bool = False

class ChallanStatusUpdateRequest(BaseModel):
    payment_status: str  # paid, unpaid, disputed

class DispatchRequest(BaseModel):
    channel: str = "both"  # email, sms, both
    phone_number: Optional[str] = None

class DispatchResponse(BaseModel):
    success: bool
    message: str
    dispatch_status: str
