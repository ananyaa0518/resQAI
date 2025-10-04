from pydantic import BaseModel, Field,EmailStr
from datetime import datetime
from typing import Optional

class ReportCreate(BaseModel):
    text: str = Field(..., min_length=10, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    recaptcha_token: str

class SOSCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    message: Optional[str] = "Emergency SOS Alert"

class ReportResponse(BaseModel):
    id: int
    text: str
    latitude: float
    longitude: float
    disaster_type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
