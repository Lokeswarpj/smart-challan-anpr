from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class RCDocument(BaseModel):
    status: str  # valid, expired
    rc_number: str
    chassis_number: str
    engine_number: str
    issue_date: str
    expiry_date: str
    days_left: int

class InsuranceDocument(BaseModel):
    status: str  # valid, expired
    policy_number: str
    insurer_name: str
    policy_type: str
    issue_date: str
    expiry_date: str
    days_left: int

class PUCDocument(BaseModel):
    status: str  # valid, expired
    certificate_number: str
    emission_norm: str
    tested_value: str
    issue_date: str
    expiry_date: str
    days_left: int

class RoadTaxDocument(BaseModel):
    status: str  # paid, pending
    tax_type: str
    amount_paid: float
    payment_date: str
    valid_until: str
    days_left: int

class DocumentsWrapper(BaseModel):
    rc: Optional[RCDocument] = None
    insurance: Optional[InsuranceDocument] = None
    puc: Optional[PUCDocument] = None
    road_tax: Optional[RoadTaxDocument] = None

class ChallanSummary(BaseModel):
    id: str
    challan_number: str
    violation_code: str
    violation_title: str
    rule_section: str
    fine_amount: float
    location: str
    issued_at: str
    due_date: str
    payment_status: str

class VehicleDetailResponse(BaseModel):
    registration_number: str
    owner_name: str
    owner_phone: str
    owner_email: str
    vehicle_class: str
    maker_model: str
    fuel_type: str
    color: str
    registration_date: str
    registered_rto: str
    status: str = "compliant"  # compliant, warning, violation
    documents: DocumentsWrapper
    previous_challans: List[ChallanSummary] = []
    is_mock: bool = False
