import logging
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models import Medication, MedicationSchedule, ReminderEvent, ReminderStatus, NotificationType
from app.services.notification_service import create_in_app_notification

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def process_medication_reminders():
    """
    Background worker job that runs periodically to:
    1. Scan active medications and their schedules.
    2. Check if a reminder is due now (current YYYY-MM-DD and HH:MM).
    3. Generate ReminderEvent and in-app Notification with strict deduplication.
    4. Mark old unacknowledged reminders (>4 hours old) as MISSED.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now()
        today_date_str = now.strftime("%Y-%m-%d")
        current_time_str = now.strftime("%H:%M")
        current_weekday = str(now.weekday())  # 0=Monday, 6=Sunday

        # 1. Fetch all active medications
        active_medications = db.query(Medication).filter(
            Medication.is_active == True,
            Medication.start_date <= today_date_str
        ).all()

        for med in active_medications:
            # Check if medication end_date has passed
            if med.end_date and med.end_date < today_date_str:
                continue

            for schedule in med.schedules:
                allowed_days = [d.strip() for d in schedule.days_of_week.split(",")]
                if current_weekday not in allowed_days:
                    continue

                # Check if reminder_time matches current time (within 1-minute window)
                if schedule.reminder_time == current_time_str:
                    # Deduplication check
                    existing_event = db.query(ReminderEvent).filter(
                        ReminderEvent.medication_id == med.id,
                        ReminderEvent.scheduled_date == today_date_str,
                        ReminderEvent.scheduled_time == schedule.reminder_time
                    ).first()

                    if not existing_event:
                        new_event = ReminderEvent(
                            medication_id=med.id,
                            patient_id=med.patient_id,
                            scheduled_date=today_date_str,
                            scheduled_time=schedule.reminder_time,
                            status=ReminderStatus.SCHEDULED,
                            notes=med.instructions
                        )
                        db.add(new_event)
                        try:
                            db.commit()
                            # Dispatch Notification
                            create_in_app_notification(
                                db=db,
                                user_id=med.patient_id,
                                title=f"Medication Reminder: {med.name}",
                                message=f"It is time to take your {med.dosage} dose of {med.name}. Instructions: {med.instructions or 'Follow prescribed instructions.'}",
                                type=NotificationType.REMINDER
                            )
                            logger.info(f"Triggered reminder for Medication {med.name} (Patient {med.patient_id})")
                        except Exception as insert_err:
                            db.rollback()
                            logger.debug(f"Duplicate reminder averted: {insert_err}")

        # 2. Mark overdue reminders as MISSED if scheduled > 3 hours ago and still 'scheduled'
        past_threshold_time = (now - timedelta(hours=3)).strftime("%H:%M")
        overdue_events = db.query(ReminderEvent).filter(
            ReminderEvent.scheduled_date == today_date_str,
            ReminderEvent.scheduled_time < past_threshold_time,
            ReminderEvent.status == ReminderStatus.SCHEDULED
        ).all()

        for ev in overdue_events:
            ev.status = ReminderStatus.MISSED
            ev.notes = (ev.notes or "") + " [Auto-flagged as missed: no confirmation received]"
        
        if overdue_events:
            db.commit()
            logger.info(f"Flagged {len(overdue_events)} overdue reminders as MISSED.")

    except Exception as e:
        logger.error(f"Error in process_medication_reminders: {e}")
    finally:
        db.close()


def start_scheduler():
    """Starts the background scheduler if not already running."""
    if not scheduler.running:
        scheduler.add_job(
            process_medication_reminders,
            "interval",
            seconds=60,
            id="medication_reminder_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Background medication scheduler started successfully.")


def stop_scheduler():
    """Stops the background scheduler cleanly."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background medication scheduler stopped.")
