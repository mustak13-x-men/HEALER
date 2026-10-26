from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models import Appointment, AppointmentStatus, User, UserRole, DoctorProfile, NotificationType
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.core.deps import get_current_user, log_audit
from app.services.notification_service import create_in_app_notification

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _calculate_end_time(start_time_str: str, duration_minutes: int = 30) -> str:
    start_dt = datetime.strptime(start_time_str, "%H:%M")
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    return end_dt.strftime("%H:%M")


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def book_appointment(
    appt_in: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Books an appointment with strict atomic overlap prevention to prevent double-booking.
    """
    if current_user.role != UserRole.PATIENT and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can book doctor appointments. Doctor accounts cannot book appointments for themselves."
        )

    doctor = db.query(DoctorProfile).filter(DoctorProfile.id == appt_in.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    end_time_str = appt_in.end_time or _calculate_end_time(appt_in.start_time, 30)

    # Double Booking Prevention Check with isolation
    existing_booking = db.query(Appointment).filter(
        Appointment.doctor_id == appt_in.doctor_id,
        Appointment.appointment_date == appt_in.appointment_date,
        Appointment.start_time == appt_in.start_time,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).with_for_update().first() if db.bind.name == "postgresql" else db.query(Appointment).filter(
        Appointment.doctor_id == appt_in.doctor_id,
        Appointment.appointment_date == appt_in.appointment_date,
        Appointment.start_time == appt_in.start_time,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested time slot has already been booked by another patient. Please choose a different slot."
        )

    new_appt = Appointment(
        patient_id=current_user.id,
        doctor_id=appt_in.doctor_id,
        appointment_date=appt_in.appointment_date,
        start_time=appt_in.start_time,
        end_time=end_time_str,
        status=AppointmentStatus.CONFIRMED,  # Auto-confirm for instant seamless booking
        reason=appt_in.reason
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    # In-App Notifications
    create_in_app_notification(
        db=db,
        user_id=current_user.id,
        title="Appointment Confirmed",
        message=f"Your appointment with Dr. {doctor.user.full_name} is confirmed for {new_appt.appointment_date} at {new_appt.start_time}.",
        type=NotificationType.APPOINTMENT
    )
    create_in_app_notification(
        db=db,
        user_id=doctor.user_id,
        title="New Patient Booking",
        message=f"Patient {current_user.full_name} booked an appointment for {new_appt.appointment_date} at {new_appt.start_time}.",
        type=NotificationType.APPOINTMENT
    )

    log_audit(db, action="BOOK_APPOINTMENT", resource=f"Appointment:{new_appt.id}", user_id=current_user.id)

    return {
        "id": new_appt.id,
        "patient_id": new_appt.patient_id,
        "doctor_id": new_appt.doctor_id,
        "doctor_name": doctor.user.full_name,
        "specialization": doctor.specialization,
        "appointment_date": new_appt.appointment_date,
        "start_time": new_appt.start_time,
        "end_time": new_appt.end_time,
        "status": new_appt.status.value,
        "reason": new_appt.reason,
        "message": "Appointment successfully booked."
    }


@router.get("", response_model=List[dict])
def list_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    date_filter: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns appointments scoped by user role:
    - Patient: only own appointments
    - Doctor: only appointments assigned to them
    - Admin: all appointments
    """
    query = db.query(Appointment)

    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        if not current_user.doctor_profile:
            return []
        query = query.filter(Appointment.doctor_id == current_user.doctor_profile.id)
    # Admin sees all

    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if date_filter:
        query = query.filter(Appointment.appointment_date == date_filter)

    appointments = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc()).all()

    results = []
    for appt in appointments:
        results.append({
            "id": appt.id,
            "patient_id": appt.patient_id,
            "patient_name": appt.patient.full_name if appt.patient else "Unknown",
            "patient_email": appt.patient.email if appt.patient else "",
            "patient_phone": appt.patient.phone if appt.patient else "",
            "doctor_id": appt.doctor_id,
            "doctor_name": appt.doctor.user.full_name if appt.doctor and appt.doctor.user else "Doctor",
            "doctor_specialization": appt.doctor.specialization if appt.doctor else "General",
            "appointment_date": appt.appointment_date,
            "start_time": appt.start_time,
            "end_time": appt.end_time,
            "status": appt.status.value,
            "reason": appt.reason,
            "notes": appt.notes,
            "created_at": appt.created_at.isoformat()
        })
    return results


@router.get("/{appointment_id}", response_model=dict)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves single appointment details with RBAC authorization."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Authorization verification
    if current_user.role == UserRole.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    if current_user.role == UserRole.DOCTOR:
        if not current_user.doctor_profile or appt.doctor_id != current_user.doctor_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "patient_name": appt.patient.full_name if appt.patient else "Patient",
        "doctor_id": appt.doctor_id,
        "doctor_name": appt.doctor.user.full_name if appt.doctor and appt.doctor.user else "Doctor",
        "appointment_date": appt.appointment_date,
        "start_time": appt.start_time,
        "end_time": appt.end_time,
        "status": appt.status.value,
        "reason": appt.reason,
        "notes": appt.notes,
        "created_at": appt.created_at.isoformat()
    }


@router.patch("/{appointment_id}", response_model=dict)
def update_appointment(
    appointment_id: int,
    update_in: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reschedules or updates the status of an existing appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Authorization
    if current_user.role == UserRole.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this appointment")
    if current_user.role == UserRole.DOCTOR:
        if not current_user.doctor_profile or appt.doctor_id != current_user.doctor_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this appointment")

    # If rescheduling: check slot collision
    if update_in.appointment_date or update_in.start_time:
        new_date = update_in.appointment_date or appt.appointment_date
        new_start = update_in.start_time or appt.start_time
        
        collision = db.query(Appointment).filter(
            Appointment.doctor_id == appt.doctor_id,
            Appointment.appointment_date == new_date,
            Appointment.start_time == new_start,
            Appointment.id != appt.id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
        ).first()

        if collision:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Target slot is already booked")

        appt.appointment_date = new_date
        appt.start_time = new_start
        appt.end_time = update_in.end_time or _calculate_end_time(new_start)

    if update_in.status:
        try:
            appt.status = AppointmentStatus(update_in.status)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {update_in.status}")

    if update_in.notes is not None:
        appt.notes = update_in.notes

    db.commit()
    db.refresh(appt)

    create_in_app_notification(
        db=db,
        user_id=appt.patient_id,
        title="Appointment Status Updated",
        message=f"Your appointment on {appt.appointment_date} is now {appt.status.value}.",
        type=NotificationType.APPOINTMENT
    )

    log_audit(db, action="UPDATE_APPOINTMENT", resource=f"Appointment:{appt.id}", user_id=current_user.id)
    return {"message": "Appointment updated successfully", "status": appt.status.value}


@router.delete("/{appointment_id}", status_code=status.HTTP_200_OK)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancels an appointment."""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    if current_user.role == UserRole.PATIENT and appt.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this appointment")

    appt.status = AppointmentStatus.CANCELLED
    db.commit()

    create_in_app_notification(
        db=db,
        user_id=appt.patient_id,
        title="Appointment Cancelled",
        message=f"Appointment on {appt.appointment_date} at {appt.start_time} has been cancelled.",
        type=NotificationType.APPOINTMENT
    )

    log_audit(db, action="CANCEL_APPOINTMENT", resource=f"Appointment:{appt.id}", user_id=current_user.id)
    return {"message": "Appointment successfully cancelled"}
