# HEALER - AI-Based Healthcare Management System

[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React_18_+_Vite-61dafb.svg?logo=react)](https://react.dev)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Database: PostgreSQL_&_SQLite](https://img.shields.io/badge/Database-PostgreSQL_%2F_SQLite-4169e1.svg?logo=postgresql)](https://www.postgresql.org)
[![Testing: Pytest](https://img.shields.io/badge/Testing-Pytest_100%25_Pass-brightgreen.svg?logo=pytest)](https://docs.pytest.org)
[![Deployment: Vercel_&_Render](https://img.shields.io/badge/Deployment-Vercel_%26_Render-black.svg?logo=vercel)](https://vercel.com)

A centralized, responsive, role-based healthcare web application engineered to streamline patient consultations, eliminate appointment double-booking, automate recurring medication reminders, and provide verified health education through an ethical, RAG-grounded AI medical assistant.

---

## 📑 Table of Contents

- [Key System Capabilities](#-key-system-capabilities)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [AI Health Assistant & Medical RAG Guardrails](#-ai-health-assistant--medical-rag-guardrails)
- [Appointment Booking & Concurrency Protection](#-appointment-booking--concurrency-protection)
- [Medication Reminder & Scheduler Engine](#-medication-reminder--scheduler-engine)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [API Documentation & Modules](#-api-documentation--modules)
- [Demo Credentials](#-demo-credentials)
- [Local Development Setup](#-local-development-setup)
- [Automated Testing Suite](#-automated-testing-suite)
- [Production Deployment Guide](#-production-deployment-guide)

---

## 🌟 Key System Capabilities

1. **Role-Based Portals**: Tailored interfaces and strict backend endpoint authorization for **Patients**, **Doctors**, and **Administrators**.
2. **Conflict-Free Appointment Booking**: Real-time slot generator (30-minute intervals) coupled with atomic database uniqueness locks to reject concurrent overlapping attempts (returns `409 Conflict`).
3. **Automated Medication Scheduler**: Background worker (APScheduler) monitoring patient regimens, dispatching in-app alerts, tracking acknowledgment timestamps, and flagging unacknowledged doses as missed without false intake claims.
4. **Certified AI Health Education Assistant**: Powered by a medical RAG (Retrieval-Augmented Generation) knowledge base citing WHO, CDC, NIH, and AHA clinical literature. Equipped with acute emergency red-flag triggers and strict non-diagnostic guardrails.
5. **Operational Audit Trail**: Structured event logging recording user logins, appointments, profile updates, and doctor onboarding.
6. **Production-Ready Multi-Cloud Setup**: Zero-config local development on SQLite, scalable PostgreSQL production drivers, Vercel SPA routing configurations, and Render/Docker deployment manifests.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Browser Client: Desktop / Mobile])
    Vite[React 18 + Vite SPA on Vercel]
    FastAPI[FastAPI REST API on Render / Docker]
    DB[(PostgreSQL / SQLite Database)]
    Scheduler[APScheduler Background Worker]
    RAG[Medical Knowledge Retrieval & Guardrails]
    LLM[Gemini 1.5 Flash / Safe Clinical Fallback]

    User <-->|HTTPS / REST API| Vite
    Vite <-->|JWT Bearer Authentication| FastAPI
    FastAPI <-->|SQLAlchemy ORM + Transactions| DB
    FastAPI <-->|Context Queries| RAG
    RAG <-->|Enriched Grounded Prompt| LLM
    Scheduler -->|Periodic In-App & Email Generation| DB
    Scheduler -.->|Live Reminder Notifications| User
```

---

## 🛡️ Role-Based Access Control (RBAC)

The application enforces security at both the frontend routing level (`<ProtectedRoute allowedRoles={['...']} />`) and the backend dependency level (`require_role([...])`):

| Role | Access Permissions & Responsibilities | Dashboard Path |
| :--- | :--- | :--- |
| **Patient** | Register account, view physician directory, book/reschedule/cancel appointments, manage prescription dosages, receive scheduled medication reminders, consult AI medical guide. | `/dashboard/patient` |
| **Doctor** | View assigned daily consultation queue, inspect patient visit notes, set working days and hours, mark encounters as confirmed, completed, or cancelled. | `/dashboard/doctor` |
| **Administrator** | Hospital KPIs & Recharts analytics, user account activation/deactivation, onboarding and verifying licensed physicians, inspection of full appointment ledger and security audit logs. | `/dashboard/admin` |

---

## 🤖 AI Health Assistant & Medical RAG Guardrails

### Ethical Healthcare Architecture
1. **Acute Red-Flag Emergency Triage**: Detects urgent symptoms (e.g., chest pain, stroke signs, severe dyspnea, anaphylaxis) and immediately presents a high-priority banner instructing the patient to dial `911` or proceed to the nearest emergency room.
2. **Medical RAG Grounding**: Queries verified literature regarding hypertension (AHA), Type 2 diabetes (ADA), asthma (GINA), viral infections (CDC), headache classifications (IHS), and preventive screenings (USPSTF).
3. **Authentic Source Citations**: Each generated response returns citation tags referencing evidence-based medical sources.
4. **Mandatory Disclaimer**: Every answer explicitly notes that the assistant provides health education and does not formulate clinical diagnoses or alter prescription dosages.
5. **Dual-Mode Engine**: Automatically uses the configured `GEMINI_API_KEY` (Gemini 1.5 Flash) or `OPENAI_API_KEY`; seamlessly falls back to the embedded clinical knowledge base if external providers are unavailable.

---

## 📅 Appointment Booking & Concurrency Protection

To prevent concurrent double-booking under high user load:
1. Every doctor has custom weekly shifts and 30-minute interval slots.
2. The availability endpoint (`GET /api/doctors/{id}/availability?date=YYYY-MM-DD`) dynamically parses existing reservations (`PENDING`, `CONFIRMED`) and returns only unreserved time slots.
3. During checkout (`POST /api/appointments`), an isolated database transaction with row-level locking (`SELECT ... FOR UPDATE` in PostgreSQL or serialized checks in SQLite) verifies slot availability.
4. If a concurrent request attempts to reserve the identical slot, the transaction rolls back and returns an HTTP `409 Conflict`, prompting the frontend to refresh open slots.

---

## ⏰ Medication Reminder & Scheduler Engine

- **Regimen Tracking**: Stores medication name, dosage, frequency, dietary instructions, and start/end dates.
- **Background Worker**: `APScheduler` checks every 60 seconds for due medication times matching the current day of the week.
- **Strict Deduplication**: Enforces a database uniqueness constraint on `(medication_id, scheduled_date, scheduled_time)` to avert duplicate reminders upon server restarts.
- **Acknowledgment Tracking**: Patients can click "Acknowledge" to log acknowledgment timestamps. Reminders unacknowledged after 3 hours are auto-flagged as `MISSED` without falsely asserting whether the medication was ingested.

---

## 💻 Technology Stack

### Frontend
- **Framework**: React.js 18 + Vite
- **Styling**: Tailwind CSS + Custom Healthcare Theme
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with JWT Bearer Interceptors
- **Icons**: Lucide React
- **Analytics Charts**: Recharts

### Backend
- **Framework**: Python 3.11+ / FastAPI
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic v2 & Pydantic Settings
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing
- **Task Scheduler**: APScheduler (Advanced Python Scheduler)
- **Database**: PostgreSQL (Production) / SQLite (Zero-config local dev & automated testing)
- **Testing**: Pytest + HTTPX TestClient

---

## 📂 Project Directory Structure

```text
├── .gitignore
├── docker-compose.yml
├── README.md
├── backend/
│   ├── .env.example
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── Procfile
│   ├── render.yaml
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry & lifespans
│   │   ├── api/
│   │   │   ├── api.py                  # Master API router
│   │   │   └── routes/                 # Auth, users, doctors, appointments, meds, reminders, chat, admin
│   │   ├── core/                       # Settings, bcrypt security, RBAC dependencies
│   │   ├── database/                   # Session maker, init_db demo seeder
│   │   ├── models/                     # SQLAlchemy relational models
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── services/                   # AI service, RAG engine, notification dispatcher
│   │   └── tasks/                      # APScheduler background worker
│   ├── migrations/                     # Alembic migration revisions
│   └── tests/                          # Pytest automated test suite
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── tailwind.config.js
    ├── vercel.json                     # SPA routing fallback for Vercel
    ├── vite.config.js
    └── src/
        ├── App.jsx                     # Route declarations
        ├── main.jsx
        ├── components/common/          # Navbar, Footer, Sidebar, Header, ProtectedRoute
        ├── context/                    # AuthContext, NotificationContext
        ├── layouts/                    # PublicLayout, DashboardLayout
        ├── pages/                      # 15 Complete Application Pages
        └── services/                   # Axios API client
```

---

## 🔑 Demo Credentials

The database seeder automatically initializes the following verified accounts on startup:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@healer.health` | `Patient@123456` | Prescriptions (Lisinopril, Omega-3), Upcoming Appointment, Medical Records |
| **Doctor** | `dr.sarah@healer.health` | `Doctor@123456` | Cardiology Specialist, Mon-Fri 09:00-17:00 Schedule, Patient Consultation Queue |
| **Doctor** | `dr.chen@healer.health` | `Doctor@123456` | Neurology Specialist, Ratings, Bio, Clinic Location |
| **Admin** | `admin@healer.health` | `Admin@123456` | Full administrative control, system metrics, user activation manager |

*(Quick-fill buttons for these accounts are also provided directly on the `/login` page).*

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup
```bash
cd backend

# Create & activate a virtual environment (optional but recommended)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- Swagger UI Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`

### 2. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Automated Testing Suite

The backend includes a comprehensive Pytest test suite validating:
- Authentication & password hashing
- Role authorization & route protection
- Slot generation & atomic double-booking rejection (`409 Conflict`)
- Medication schedule generation & acknowledgment
- Emergency red-flag detection & RAG citation synthesis

Run the test suite from the backend directory:
```bash
cd backend
python -m pytest tests -v
```

---

## 🌐 Production Deployment Guide

### Option A: Docker Compose (Unified Stack)
```bash
# Build and run the entire stack (PostgreSQL, FastAPI Backend, Nginx Frontend)
docker-compose up --build -d
```
Access the application at `http://localhost:3000`.

### Option B: Cloud Hosting (Vercel + Render + Managed PostgreSQL)

#### 1. Database (Neon / Supabase / Render Postgres)
- Create a new PostgreSQL instance.
- Copy your connection string: `postgresql://user:password@host:5432/dbname`.

#### 2. Backend on Render
- Connect your GitHub repository to Render.
- Create a **Web Service** with:
  - **Root Directory**: `backend`
  - **Environment**: `Python 3`
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - **Health Check Path**: `/health`
- Set Environment Variables:
  - `ENVIRONMENT=production`
  - `DATABASE_URL=<your-postgres-connection-string>`
  - `SECRET_KEY=<generate-a-secure-random-32-char-key>`
  - `BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app"]`
  - `AI_PROVIDER=gemini`
  - `GEMINI_API_KEY=<your-gemini-key>`

#### 3. Frontend on Vercel
- Import your repository into Vercel.
- Set **Root Directory** to `frontend`.
- Set Environment Variable:
  - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
- Deploy! Single Page Application client-side routing is handled via `frontend/vercel.json`.

---

## 📄 License
HEALER Healthcare Management System is distributed under the MIT License.
