from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Medication, MedicationSchedule, ReminderEvent, ReminderStatus, User, UserRole
from app.schemas import MedicationCreate, MedicationUpdate, MedicationOut
from app.core.deps import get_current_user, log_audit

router = APIRouter(prefix="/medications", tags=["Medications"])


@router.get("", response_model=List[MedicationOut])
def list_my_medications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all medication regimens for the logged-in patient."""
    meds = db.query(Medication).filter(Medication.patient_id == current_user.id).order_by(Medication.created_at.desc()).all()
    return meds


@router.post("", response_model=MedicationOut, status_code=status.HTTP_201_CREATED)
def create_medication(
    med_in: MedicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new medication with reminder schedules."""
    new_med = Medication(
        patient_id=current_user.id,
        name=med_in.name,
        dosage=med_in.dosage,
        frequency=med_in.frequency,
        instructions=med_in.instructions,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        prescribing_doctor=med_in.prescribing_doctor,
        is_active=True
    )
    db.add(new_med)
    db.flush()

    # Add schedules and initialize today's reminder events if appropriate
    today_str = datetime.now().strftime("%Y-%m-%d")
    for sch in med_in.schedules:
        schedule_item = MedicationSchedule(
            medication_id=new_med.id,
            reminder_time=sch.reminder_time,
            days_of_week=sch.days_of_week
        )
        db.add(schedule_item)

        # Pre-seed reminder event for today if not already present
        existing_event = db.query(ReminderEvent).filter(
            ReminderEvent.medication_id == new_med.id,
            ReminderEvent.scheduled_date == today_str,
            ReminderEvent.scheduled_time == sch.reminder_time
        ).first()

        if not existing_event:
            new_event = ReminderEvent(
                medication_id=new_med.id,
                patient_id=current_user.id,
                scheduled_date=today_str,
                scheduled_time=sch.reminder_time,
                status=ReminderStatus.SCHEDULED,
                notes=med_in.instructions
            )
            db.add(new_event)

    db.commit()
    db.refresh(new_med)
    log_audit(db, action="CREATE_MEDICATION", resource=f"Medication:{new_med.id}", user_id=current_user.id)
    return new_med


@router.patch("/{medication_id}", response_model=MedicationOut)
def update_medication(
    medication_id: int,
    med_update: MedicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates medication instructions, active status or end date."""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    
    if med.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if med_update.name is not None:
        med.name = med_update.name
    if med_update.dosage is not None:
        med.dosage = med_update.dosage
    if med_update.frequency is not None:
        med.frequency = med_update.frequency
    if med_update.instructions is not None:
        med.instructions = med_update.instructions
    if med_update.end_date is not None:
        med.end_date = med_update.end_date
    if med_update.is_active is not None:
        med.is_active = med_update.is_active

    db.commit()
    db.refresh(med)
    log_audit(db, action="UPDATE_MEDICATION", resource=f"Medication:{med.id}", user_id=current_user.id)
    return med


@router.delete("/{medication_id}", status_code=status.HTTP_200_OK)
def delete_medication(
    medication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a medication and its related schedules."""
    med = db.query(Medication).filter(Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
    
    if med.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    db.delete(med)
    db.commit()
    log_audit(db, action="DELETE_MEDICATION", resource=f"Medication:{medication_id}", user_id=current_user.id)
    return {"message": "Medication deleted successfully"}
