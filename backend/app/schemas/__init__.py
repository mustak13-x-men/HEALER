from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str = "patient"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    # Optional patient profile fields
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PatientProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None


class DoctorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    specialization: str
    license_number: str
    experience_years: int
    consultation_fee: float
    bio: Optional[str] = None
    clinic_address: Optional[str] = None
    rating: float
    total_reviews: int


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    patient_profile: Optional[PatientProfileOut] = None
    doctor_profile: Optional[DoctorProfileOut] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[str] = None


# --- Doctor Schemas ---
class DoctorAvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int
    is_available: bool


class DoctorAvailabilityUpdate(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    slot_duration_minutes: int = 30
    is_available: bool = True


class DoctorCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    specialization: str
    license_number: str
    experience_years: int = 5
    consultation_fee: float = 60.0
    bio: Optional[str] = None
    clinic_address: Optional[str] = None


# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: str  # YYYY-MM-DD
    start_time: str        # HH:MM
    end_time: Optional[str] = None
    reason: str


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    reason: str
    notes: Optional[str] = None
    created_at: datetime
    patient: Optional[UserOut] = None
    doctor: Optional[DoctorProfileOut] = None


class AvailableSlotOut(BaseModel):
    time: str
    available: bool


# --- Medication & Reminder Schemas ---
class MedicationScheduleCreate(BaseModel):
    reminder_time: str  # "08:00"
    days_of_week: str = "0,1,2,3,4,5,6"


class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    schedules: List[MedicationScheduleCreate] = []


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class MedicationScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reminder_time: str
    days_of_week: str


class MedicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    prescribing_doctor: Optional[str] = None
    is_active: bool
    created_at: datetime
    schedules: List[MedicationScheduleOut] = []


class ReminderEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    medication_id: int
    patient_id: int
    scheduled_date: str
    scheduled_time: str
    status: str
    acknowledged_at: Optional[datetime] = None
    notes: Optional[str] = None
    medication: Optional[MedicationOut] = None


class ReminderAcknowledge(BaseModel):
    status: str = "acknowledged"  # "acknowledged" or "missed" or "snoozed"
    notes: Optional[str] = None


# --- Notification Schemas ---
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime


# --- Chatbot Schemas ---
class ChatMessageCreate(BaseModel):
    message: str
    conversation_id: Optional[int] = None


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    conversation_id: int
    sender: str
    content: str
    sources: Optional[str] = None
    created_at: datetime


class ChatConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []


class ChatResponse(BaseModel):
    conversation_id: int
    reply: str
    sources: List[str] = []
    is_emergency: bool = False
    disclaimer: str


# --- Admin Schemas ---
class AdminDashboardMetrics(BaseModel):
    total_users: int
    total_patients: int
    total_doctors: int
    total_appointments: int
    pending_appointments: int
    completed_appointments: int
    cancelled_appointments: int
    active_medications: int
    recent_activity: List[Any] = []

