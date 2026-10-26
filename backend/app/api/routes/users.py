from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, PatientProfile, UserRole
from app.schemas import UserOut, UserProfileUpdate
from app.core.deps import get_current_user, log_audit

router = APIRouter(prefix="/users", tags=["Users"])


@router.patch("/profile", response_model=UserOut)
def update_user_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates the profile details for the current user."""
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone

    if current_user.role == UserRole.PATIENT:
        profile = current_user.patient_profile
        if not profile:
            profile = PatientProfile(user_id=current_user.id)
            db.add(profile)
        
        if profile_in.date_of_birth is not None:
            profile.date_of_birth = profile_in.date_of_birth
        if profile_in.gender is not None:
            profile.gender = profile_in.gender
        if profile_in.blood_group is not None:
            profile.blood_group = profile_in.blood_group
        if profile_in.allergies is not None:
            profile.allergies = profile_in.allergies
        if profile_in.emergency_contact_name is not None:
            profile.emergency_contact_name = profile_in.emergency_contact_name
        if profile_in.emergency_contact_phone is not None:
            profile.emergency_contact_phone = profile_in.emergency_contact_phone
        if profile_in.medical_history is not None:
            profile.medical_history = profile_in.medical_history

    db.commit()
    db.refresh(current_user)
    log_audit(db, action="PROFILE_UPDATE", resource=f"User:{current_user.id}", user_id=current_user.id)
    return current_user
