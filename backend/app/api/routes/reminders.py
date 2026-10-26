from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import ReminderEvent, ReminderStatus, Medication, User, UserRole
from app.schemas import ReminderEventOut, ReminderAcknowledge
from app.core.deps import get_current_user, log_audit
from app.tasks.scheduler import process_medication_reminders

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("", response_model=List[dict])
def list_reminders(
    date_filter: Optional[str] = Query(None, alias="date"),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists reminder events for the logged-in patient."""
    query = db.query(ReminderEvent).filter(ReminderEvent.patient_id == current_user.id)

    if date_filter:
        query = query.filter(ReminderEvent.scheduled_date == date_filter)
    if status_filter:
        query = query.filter(ReminderEvent.status == status_filter)

    reminders = query.order_by(ReminderEvent.scheduled_date.desc(), ReminderEvent.scheduled_time.desc()).all()

    results = []
    for r in reminders:
        results.append({
            "id": r.id,
            "medication_id": r.medication_id,
            "medication_name": r.medication.name if r.medication else "Unknown",
            "dosage": r.medication.dosage if r.medication else "",
            "instructions": r.medication.instructions if r.medication else "",
            "scheduled_date": r.scheduled_date,
            "scheduled_time": r.scheduled_time,
            "status": r.status.value,
            "acknowledged_at": r.acknowledged_at.isoformat() if r.acknowledged_at else None,
            "notes": r.notes
        })
    return results


@router.patch("/{reminder_id}/acknowledge", response_model=dict)
def acknowledge_reminder(
    reminder_id: int,
    ack_in: ReminderAcknowledge,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a reminder as acknowledged or missed.
    Records timestamp without asserting physical ingestion.
    """
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder event not found")

    if reminder.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        new_status = ReminderStatus(ack_in.status.lower())
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {ack_in.status}")

    reminder.status = new_status
    reminder.acknowledged_at = datetime.now(timezone.utc)
    if ack_in.notes:
        reminder.notes = ack_in.notes

    db.commit()
    db.refresh(reminder)

    log_audit(db, action="ACKNOWLEDGE_REMINDER", resource=f"Reminder:{reminder.id}", user_id=current_user.id)

    return {
        "id": reminder.id,
        "status": reminder.status.value,
        "acknowledged_at": reminder.acknowledged_at.isoformat(),
        "message": f"Reminder marked as {reminder.status.value} successfully."
    }


@router.post("/trigger-check", status_code=status.HTTP_200_OK)
def trigger_reminder_check(current_user: User = Depends(get_current_user)):
    """Triggers an immediate evaluation of medication reminders."""
    process_medication_reminders()
    return {"message": "Medication reminder engine evaluated successfully"}
