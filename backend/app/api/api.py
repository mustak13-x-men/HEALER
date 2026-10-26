from fastapi import APIRouter
from app.api.routes import auth, users, doctors, appointments, medications, reminders, chat, notifications, admin

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(doctors.router)
api_router.include_router(appointments.router)
api_router.include_router(medications.router)
api_router.include_router(reminders.router)
api_router.include_router(chat.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.router)
