from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.schemas.vehicle import VehicleDetailResponse

class ProcessingStage(BaseModel):
    name: str
    status: str
    time: str

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int

class ANPRDetectResponse(BaseModel):
    detected: bool
    registration_number: Optional[str] = None
    confidence: float
    processing_stages: List[ProcessingStage] = []
    bounding_box: Optional[BoundingBox] = None
    plate_crop_base64: Optional[str] = None
    vehicle: Optional[VehicleDetailResponse] = None
    is_mock: bool = False
