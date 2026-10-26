from typing import List, Optional
from datetime import datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import DoctorProfile, DoctorAvailability, Appointment, AppointmentStatus, User, UserRole
from app.schemas import DoctorProfileOut, DoctorAvailabilityOut, DoctorAvailabilityUpdate, AvailableSlotOut
from app.core.deps import get_current_user, require_role

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", response_model=List[dict])
def list_doctors(
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lists doctors with optional search by doctor name or specialization."""
    query = db.query(DoctorProfile).join(User, DoctorProfile.user_id == User.id)
    
    if search:
        search_fmt = f"%{search}%"
        query = query.filter((User.full_name.ilike(search_fmt)) | (DoctorProfile.specialization.ilike(search_fmt)))
    
    if specialization:
        query = query.filter(DoctorProfile.specialization.ilike(f"%{specialization}%"))

    doctors = query.all()
    results = []
    for doc in doctors:
        results.append({
            "id": doc.id,
            "user_id": doc.user_id,
            "full_name": doc.user.full_name,
            "email": doc.user.email,
            "phone": doc.user.phone,
            "specialization": doc.specialization,
            "license_number": doc.license_number,
            "experience_years": doc.experience_years,
            "consultation_fee": doc.consultation_fee,
            "bio": doc.bio,
            "clinic_address": doc.clinic_address,
            "rating": doc.rating,
            "total_reviews": doc.total_reviews,
        })
    return results


@router.get("/{doctor_id}", response_model=dict)
def get_doctor_details(doctor_id: int, db: Session = Depends(get_db)):
    """Retrieves detailed doctor profile and weekly schedules."""
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    
    availabilities = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.is_available == True
    ).all()

    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "full_name": doc.user.full_name,
        "email": doc.user.email,
        "phone": doc.user.phone,
        "specialization": doc.specialization,
        "license_number": doc.license_number,
        "experience_years": doc.experience_years,
        "consultation_fee": doc.consultation_fee,
        "bio": doc.bio,
        "clinic_address": doc.clinic_address,
        "rating": doc.rating,
        "total_reviews": doc.total_reviews,
        "availabilities": [
            {
                "day_of_week": a.day_of_week,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "slot_duration_minutes": a.slot_duration_minutes
            } for a in availabilities
        ]
    }


@router.get("/{doctor_id}/availability", response_model=List[AvailableSlotOut])
def get_doctor_slots_for_date(
    doctor_id: int,
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """
    Computes time slots for the given date.
    Checks doctor's weekly shift and flags booked appointments to prevent double-booking.
    """
    doc = db.query(DoctorProfile).filter(DoctorProfile.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Expected YYYY-MM-DD")

    weekday = target_date.weekday()  # 0=Monday, 6=Sunday

    # Find schedule for this day of week
    schedule = db.query(DoctorAvailability).filter(
        DoctorAvailability.doctor_id == doctor_id,
        DoctorAvailability.day_of_week == weekday,
        DoctorAvailability.is_available == True
    ).first()

    # Default hours (09:00 to 17:00, 30 min intervals) if not explicitly set
    start_str = schedule.start_time if schedule else "09:00"
    end_str = schedule.end_time if schedule else "17:00"
    duration = schedule.slot_duration_minutes if schedule else 30

    # Find already booked slots on that date
    booked_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == date,
        Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
    ).all()
    booked_times = {appt.start_time for appt in booked_appointments}

    # Generate slots
    slots: List[AvailableSlotOut] = []
    current_time = datetime.strptime(start_str, "%H:%M")
    end_time = datetime.strptime(end_str, "%H:%M")

    while current_time + timedelta(minutes=duration) <= end_time:
        slot_str = current_time.strftime("%H:%M")
        is_free = slot_str not in booked_times
        slots.append(AvailableSlotOut(time=slot_str, available=is_free))
        current_time += timedelta(minutes=duration)

    return slots


@router.post("/availability", status_code=status.HTTP_200_OK)
def update_my_availability(
    availabilities: List[DoctorAvailabilityUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    """Allows authenticated doctors to update their weekly working hours."""
    doc = current_user.doctor_profile
    if not doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Doctor profile missing")

    # Clear existing and update
    db.query(DoctorAvailability).filter(DoctorAvailability.doctor_id == doc.id).delete()
    for item in availabilities:
        new_avail = DoctorAvailability(
            doctor_id=doc.id,
            day_of_week=item.day_of_week,
            start_time=item.start_time,
            end_time=item.end_time,
            slot_duration_minutes=item.slot_duration_minutes,
            is_available=item.is_available
        )
        db.add(new_avail)
    
    db.commit()
    return {"message": "Availability schedule updated successfully"}
