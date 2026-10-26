import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.database.session import Base, engine, SessionLocal
from app.models import (
    User, UserRole, DoctorProfile, DoctorAvailability, PatientProfile,
    Appointment, AppointmentStatus, Medication, MedicationSchedule, ReminderEvent, ReminderStatus, Notification, NotificationType
)
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)


def init_db():
    """Initializes tables and seeds demo clinical dataset if empty."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Migrate any legacy @finwise.health to @healer.health
        legacy_users = db.query(User).filter(User.email.like("%@finwise.health")).all()
        for u in legacy_users:
            u.email = u.email.replace("@finwise.health", "@healer.health")
        if legacy_users:
            db.commit()
            logger.info(f"Updated {len(legacy_users)} user emails to @healer.health")

        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@healer.health").first()
        if not admin:
            logger.info("Seeding initial administrator...")
            admin = User(
                email="admin@healer.health",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="Chief Medical Admin",
                phone="+1 (555) 019-2831",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            db.commit()

        # Seed doctors
        doctors_data = [
            {
                "email": "dr.sarah@healer.health",
                "name": "Dr. Sarah Jenkins, MD, FACC",
                "specialization": "Cardiology",
                "license": "MD-CARD-78291",
                "fee": 120.0,
                "experience": 14,
                "rating": 4.9,
                "reviews": 84,
                "clinic": "Metro Heart & Vascular Pavilion, Suite 402",
                "bio": "Board-certified Cardiologist specializing in preventive cardiology, hypertension management, and echocardiography."
            },
            {
                "email": "dr.chen@healer.health",
                "name": "Dr. Michael Chen, MD, PhD",
                "specialization": "Neurology",
                "license": "MD-NEUR-55102",
                "fee": 140.0,
                "experience": 11,
                "rating": 4.8,
                "reviews": 62,
                "clinic": "Advanced Neurological Care Center, Suite 210",
                "bio": "Specialist in migraine disorders, cognitive health, neurodegenerative conditions, and autonomic nerve assessments."
            },
            {
                "email": "dr.priya@healer.health",
                "name": "Dr. Priya Patel, MD, FAAP",
                "specialization": "Pediatrics",
                "license": "MD-PED-33918",
                "fee": 85.0,
                "experience": 8,
                "rating": 5.0,
                "reviews": 110,
                "clinic": "Sunshine Pediatric Clinic, Ground Floor",
                "bio": "Dedicated pediatrician providing comprehensive infant wellness, developmental milestones tracking, and pediatric immunizations."
            },
            {
                "email": "dr.marcus@healer.health",
                "name": "Dr. Marcus Vance, MD",
                "specialization": "Dermatology",
                "license": "MD-DERM-41094",
                "fee": 95.0,
                "experience": 9,
                "rating": 4.7,
                "reviews": 47,
                "clinic": "ClearSkin Dermatology Center, 3rd Floor",
                "bio": "Expert in eczema, psoriasis, acne therapy, dermoscopy, and medical dermatologic screenings."
            },
            {
                "email": "dr.emily@healer.health",
                "name": "Dr. Emily Taylor, MD",
                "specialization": "General Medicine",
                "license": "MD-GEN-99231",
                "fee": 70.0,
                "experience": 12,
                "rating": 4.9,
                "reviews": 135,
                "clinic": "Community Primary Health & Wellness Clinic",
                "bio": "Primary care physician focusing on holistic lifestyle medicine, chronic disease prevention, and routine wellness checkups."
            }
        ]

        for doc_info in doctors_data:
            existing = db.query(User).filter(User.email == doc_info["email"]).first()
            if not existing:
                doc_user = User(
                    email=doc_info["email"],
                    hashed_password=get_password_hash("Doctor@123456"),
                    full_name=doc_info["name"],
                    phone="+1 (555) 443-8900",
                    role=UserRole.DOCTOR,
                    is_active=True
                )
                db.add(doc_user)
                db.flush()

                doc_prof = DoctorProfile(
                    user_id=doc_user.id,
                    specialization=doc_info["specialization"],
                    license_number=doc_info["license"],
                    experience_years=doc_info["experience"],
                    consultation_fee=doc_info["fee"],
                    bio=doc_info["bio"],
                    clinic_address=doc_info["clinic"],
                    rating=doc_info["rating"],
                    total_reviews=doc_info["reviews"]
                )
                db.add(doc_prof)
                db.flush()

                # Add weekly schedules (Mon-Fri 09:00 - 17:00)
                for day in range(5):
                    avail = DoctorAvailability(
                        doctor_id=doc_prof.id,
                        day_of_week=day,
                        start_time="09:00",
                        end_time="17:00",
                        slot_duration_minutes=30,
                        is_available=True
                    )
                    db.add(avail)

        db.commit()

        # Seed demo patient
        patient = db.query(User).filter(User.email == "patient@healer.health").first()
        if not patient:
            logger.info("Seeding demo patient account...")
            patient = User(
                email="patient@healer.health",
                hashed_password=get_password_hash("Patient@123456"),
                full_name="Alex Johnson",
                phone="+1 (555) 782-9901",
                role=UserRole.PATIENT,
                is_active=True
            )
            db.add(patient)
            db.flush()

            patient_prof = PatientProfile(
                user_id=patient.id,
                date_of_birth="1988-06-15",
                gender="Male",
                blood_group="O+",
                allergies="Penicillin",
                emergency_contact_name="Sarah Johnson",
                emergency_contact_phone="+1 (555) 782-9902",
                medical_history="Mild essential hypertension diagnosed 2022. No prior surgeries."
            )
            db.add(patient_prof)

            # Seed medications
            today = datetime.now()
            today_str = today.strftime("%Y-%m-%d")
            tomorrow_str = (today + timedelta(days=1)).strftime("%Y-%m-%d")
            future_str = (today + timedelta(days=60)).strftime("%Y-%m-%d")

            med1 = Medication(
                patient_id=patient.id,
                name="Lisinopril",
                dosage="10 mg",
                frequency="Once daily",
                instructions="Take in the morning with a full glass of water. Monitor blood pressure weekly.",
                start_date=today_str,
                end_date=future_str,
                prescribing_doctor="Dr. Sarah Jenkins, MD",
                is_active=True
            )
            db.add(med1)
            db.flush()

            sch1 = MedicationSchedule(
                medication_id=med1.id,
                reminder_time="08:30",
                days_of_week="0,1,2,3,4,5,6"
            )
            db.add(sch1)

            # Seed today's reminder event
            rem1 = ReminderEvent(
                medication_id=med1.id,
                patient_id=patient.id,
                scheduled_date=today_str,
                scheduled_time="08:30",
                status=ReminderStatus.ACKNOWLEDGED,
                acknowledged_at=datetime.now(timezone.utc),
                notes="Taken with breakfast"
            )
            db.add(rem1)

            med2 = Medication(
                patient_id=patient.id,
                name="Omega-3 Fish Oil",
                dosage="1000 mg",
                frequency="Daily after dinner",
                instructions="Take with evening meal to assist absorption.",
                start_date=today_str,
                end_date=future_str,
                prescribing_doctor="Dr. Emily Taylor, MD",
                is_active=True
            )
            db.add(med2)
            db.flush()

            sch2 = MedicationSchedule(
                medication_id=med2.id,
                reminder_time="20:00",
                days_of_week="0,1,2,3,4,5,6"
            )
            db.add(sch2)

            rem2 = ReminderEvent(
                medication_id=med2.id,
                patient_id=patient.id,
                scheduled_date=today_str,
                scheduled_time="20:00",
                status=ReminderStatus.SCHEDULED,
                notes="Scheduled for tonight"
            )
            db.add(rem2)

            # Seed demo appointment with Dr. Sarah Jenkins
            doc_sarah = db.query(DoctorProfile).first()
            if doc_sarah:
                appt = Appointment(
                    patient_id=patient.id,
                    doctor_id=doc_sarah.id,
                    appointment_date=tomorrow_str,
                    start_time="10:00",
                    end_time="10:30",
                    status=AppointmentStatus.CONFIRMED,
                    reason="Routine cardiovascular followup and blood pressure review."
                )
                db.add(appt)

            # Seed welcome notification
            notif = Notification(
                user_id=patient.id,
                title="Welcome to AI Healthcare Portal",
                message="Your health portal is ready. You can browse doctor schedules, manage medications, and consult our AI health assistant.",
                type=NotificationType.SYSTEM
            )
            db.add(notif)

            db.commit()
            logger.info("Database initialized and demo data successfully seeded.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
