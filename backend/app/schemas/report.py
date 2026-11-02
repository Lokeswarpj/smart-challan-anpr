from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ActivityMetric(BaseModel):
    label: str
    value: Any
    change: Optional[str] = None
    subtext: Optional[str] = None

class DashboardSummaryResponse(BaseModel):
    total_scanned: int
    total_verified: int
    active_violations: int
    total_fines_collected: float
    compliance_rate: float
    violations_by_type: List[Dict[str, Any]]
    hourly_activity: List[Dict[str, Any]]
    recent_activity_log: List[Dict[str, Any]]
