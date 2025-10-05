from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timedelta
from typing import List
import httpx

from database import get_db, init_db
from models.report import Report, ReportStatus, DisasterType
from schemas import ReportCreate, ReportResponse, SOSCreate
from ml_model import get_disaster_type
from config import get_settings

# Initialize FastAPI app
app = FastAPI(title="Disaster Report API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Get settings
settings = get_settings()

# reCAPTCHA secret (get from Google)
RECAPTCHA_SECRET = settings.recaptcha_secret

async def verify_recaptcha(token: str) -> bool:
    """Verify reCAPTCHA token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": RECAPTCHA_SECRET, "response": token}
        )
        result = response.json()
        return result.get("success", False)

def check_rate_limit(db: Session, ip: str) -> bool:
    """Check if IP has exceeded rate limit (3 reports per hour)"""
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_reports = db.query(Report).filter(
        Report.ip_address == ip,
        Report.created_at >= one_hour_ago
    ).count()
    return recent_reports < 3

@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()

# ============ PUBLIC ENDPOINTS ============

@app.post("/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_report(
    request: Request,
    report: ReportCreate,
    db: Session = Depends(get_db)
):
    """Submit a disaster report"""
    
    # Verify reCAPTCHA
    if not await verify_recaptcha(report.recaptcha_token):
        raise HTTPException(status_code=400, detail="reCAPTCHA verification failed")
    
    # Check rate limit
    ip = request.client.host
    if not check_rate_limit(db, ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 3 reports per hour.")
    
    # Classify disaster type using ML
    disaster_type_str = get_disaster_type(report.text)
    disaster_type = DisasterType[disaster_type_str.upper()]
    
    # Create report
    db_report = Report(
        text=report.text,
        latitude=report.latitude,
        longitude=report.longitude,
        disaster_type=disaster_type,
        status=ReportStatus.PENDING,  # Start as pending, not verified
        ip_address=ip
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@app.post("/sos", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_sos(
    request: Request,
    sos: SOSCreate,
    db: Session = Depends(get_db)
):
    """Submit an SOS alert (women's safety)"""
    
    # Create SOS report (auto-verified for urgency)
    db_report = Report(
        text=sos.message,
        latitude=sos.latitude,
        longitude=sos.longitude,
        disaster_type=DisasterType.SOS,
        status=ReportStatus.VERIFIED,  # Auto-verify SOS
        ip_address=request.client.host,
        verified_at=datetime.utcnow()
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@app.get("/reports", response_model=List[ReportResponse])
async def get_all_reports(db: Session = Depends(get_db)):
    """Get all reports for map display and admin panel"""
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return reports

@app.patch("/reports/{report_id}/status")
async def update_report_status(
    report_id: int,
    status_data: dict,
    db: Session = Depends(get_db)
):
    """Update report status (admin only)"""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    new_status = status_data.get("status")
    if new_status not in ["Pending", "Verified", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    report.status = ReportStatus(new_status)
    if new_status == "Verified":
        report.verified_at = datetime.utcnow()
    
    db.commit()
    db.refresh(report)
    
    return {"message": f"Report {report_id} status updated to {new_status}", "report": report}


# ============ UTILITY ENDPOINTS ============

@app.get("/")
async def root():
    return {"message": "Disaster Report API", "version": "1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)