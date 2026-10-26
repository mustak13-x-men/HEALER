from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import User, PatientProfile, UserRole
from app.schemas import UserCreate, UserLogin, UserOut, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user, log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new patient account with profile details."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    # Restrict self-registration role to patient (doctor/admin accounts created via admin portal)
    assigned_role = UserRole.PATIENT

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=assigned_role,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create associated patient profile
    patient_profile = PatientProfile(
        user_id=new_user.id,
        date_of_birth=user_in.date_of_birth,
        gender=user_in.gender,
        blood_group=user_in.blood_group,
        allergies=user_in.allergies,
        emergency_contact_name=user_in.emergency_contact_name,
        emergency_contact_phone=user_in.emergency_contact_phone
    )
    db.add(patient_profile)
    db.commit()
    db.refresh(new_user)

    log_audit(db, action="USER_REGISTER", resource=f"User:{new_user.id}", user_id=new_user.id)

    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role.value, "user_id": new_user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@router.post("/login", response_model=Token)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticates a user and returns a signed JWT token."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact administrator."
        )

    log_audit(db, action="USER_LOGIN", resource=f"User:{user.id}", user_id=user.id)

    access_token = create_access_token(data={"sub": user.email, "role": user.role.value, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves the profile of the currently logged-in user."""
    return current_user
