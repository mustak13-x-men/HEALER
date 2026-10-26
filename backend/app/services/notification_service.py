import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Notification, NotificationType, User

logger = logging.getLogger(__name__)


def create_in_app_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM
) -> Notification:
    """Inserts an in-app notification record."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    db.add(notification)
    try:
        db.commit()
        db.refresh(notification)
        logger.info(f"Notification created for user {user_id}: {title}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create notification: {e}")
    return notification


def send_email_notification(
    to_email: str,
    subject: str,
    body: str
) -> bool:
    """Simulated/configured SMTP email notification."""
    logger.info(f"[EMAIL DISPATCH] To: {to_email} | Subject: {subject} | Content: {body}")
    # In production, connect to smtplib.SMTP using settings.SMTP_HOST / settings.SMTP_USER
    return True
