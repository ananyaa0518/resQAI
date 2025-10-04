from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .base import Base

class ReportStatus(enum.Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"

class DisasterType(enum.Enum):
    FLOOD = "Flood"
    FIRE = "Fire"
    EARTHQUAKE = "Earthquake"
    ACCIDENT = "Accident"
    SOS = "SOS"
    OTHER = "Other"

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    disaster_type = Column(SQLEnum(DisasterType), nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    
    # Foreign key relationships
    reported_by = Column(Integer, ForeignKey("users.id"))
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reported_by])
    verifier = relationship("User", foreign_keys=[verified_by])
