import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.database.init_db import init_db
from app.tasks.scheduler import start_scheduler, stop_scheduler
from app.api.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("healthcare_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing Healthcare Management System backend...")
    init_db()
    start_scheduler()
    yield
    # Shutdown tasks
    logger.info("Shutting down Healthcare Management System backend...")
    stop_scheduler()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Centralized REST API for AI-Based Healthcare Management System",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
origins = settings.BACKEND_CORS_ORIGINS
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routes
app.include_router(api_router, prefix="/api")


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    """System health check endpoint for monitoring, Docker, and Render."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


@app.get("/", status_code=status.HTTP_200_OK, tags=["Root"])
def root():
    """Welcome endpoint with API navigation links."""
    return {
        "message": "Welcome to AI-Based Healthcare Management API",
        "documentation": "/docs",
        "health": "/health",
        "version": settings.VERSION
    }
