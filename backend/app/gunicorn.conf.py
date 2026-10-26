import os

# Gunicorn configuration for ASGI FastAPI on Render
worker_class = "uvicorn.workers.UvicornWorker"
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = 1
timeout = 120
