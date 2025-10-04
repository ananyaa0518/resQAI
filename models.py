from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()

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
