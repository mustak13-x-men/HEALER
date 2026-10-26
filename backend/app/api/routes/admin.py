from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import (
    User, UserRole, DoctorProfile, DoctorAvailability, PatientProfile, Appointment,
    AppointmentStatus, Medication, AuditLog
)
from app.schemas import AdminDashboardMetrics, DoctorCreate, UserOut
from app.core.deps import require_role, log_audit
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Administrator"])


@router.get("/dashboard", response_model=AdminDashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Provides system-wide metrics and KPIs for the administrator."""
    total_users = db.query(User).count()
    total_patients = db.query(User).filter(User.role == UserRole.PATIENT).count()
    total_doctors = db.query(DoctorProfile).count()
    total_appointments = db.query(Appointment).count()
    pending_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.PENDING).count()
    completed_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.COMPLETED).count()
    cancelled_appointments = db.query(Appointment).filter(Appointment.status == AppointmentStatus.CANCELLED).count()
    active_medications = db.query(Medication).filter(Medication.is_active == True).count()

    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    recent_activity = [
        {
            "id": log.id,
            "action": log.action,
            "resource": log.resource,
            "user_id": log.user_id,
            "created_at": log.created_at.isoformat()
        } for log in recent_logs
    ]

    return AdminDashboardMetrics(
        total_users=total_users,
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_appointments=total_appointments,
        pending_appointments=pending_appointments,
        completed_appointments=completed_appointments,
        cancelled_appointments=cancelled_appointments,
        active_medications=active_medications,
        recent_activity=recent_activity
    )


@router.get("/users", response_model=List[UserOut])
def list_all_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Lists all user accounts with optional role and name filters."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        s = f"%{search}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)))
    
    return query.order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/toggle-status", status_code=status.HTTP_200_OK)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Enables or disables a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate own admin account")

    user.is_active = not user.is_active
    db.commit()
    log_audit(db, action=f"TOGGLE_USER_STATUS:{user.is_active}", resource=f"User:{user.id}", user_id=admin.id)
    return {"message": f"User status toggled to {'active' if user.is_active else 'inactive'}"}


@router.post("/doctors", status_code=status.HTTP_201_CREATED)
def create_doctor_account(
    doc_in: DoctorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Registers and approves a new verified doctor account."""
    existing_user = db.query(User).filter(User.email == doc_in.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    existing_license = db.query(DoctorProfile).filter(DoctorProfile.license_number == doc_in.license_number).first()
    if existing_license:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="License number already in use")

    new_user = User(
        email=doc_in.email,
        hashed_password=get_password_hash(doc_in.password),
        full_name=doc_in.full_name,
        phone=doc_in.phone,
        role=UserRole.DOCTOR,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    doctor_profile = DoctorProfile(
        user_id=new_user.id,
        specialization=doc_in.specialization,
        license_number=doc_in.license_number,
        experience_years=doc_in.experience_years,
        consultation_fee=doc_in.consultation_fee,
        bio=doc_in.bio,
        clinic_address=doc_in.clinic_address,
        rating=5.0,
        total_reviews=1
    )
    db.add(doctor_profile)
    db.flush()

    # Prepopulate standard weekday availability (Mon-Fri 09:00 - 17:00)
    for day in range(5):  # 0 to 4
        avail = DoctorAvailability(
            doctor_id=doctor_profile.id,
            day_of_week=day,
            start_time="09:00",
            end_time="17:00",
            slot_duration_minutes=30,
            is_available=True
        )
        db.add(avail)

    db.commit()
    log_audit(db, action="CREATE_DOCTOR", resource=f"Doctor:{doctor_profile.id}", user_id=admin.id)
    return {"message": "Doctor account created successfully", "doctor_id": doctor_profile.id}


@router.get("/audit-logs", response_model=List[dict])
def list_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN]))
):
    """Lists recent operational and security audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "resource": l.resource,
            "user_id": l.user_id,
            "details": l.details,
            "created_at": l.created_at.isoformat()
        } for l in logs
    ]
