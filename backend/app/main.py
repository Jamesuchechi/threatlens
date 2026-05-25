import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, threats, alerts
from app.scheduler import start_scheduler, shutdown_scheduler
from app.services.worker import start_ai_worker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    ai_worker_task = asyncio.create_task(start_ai_worker())
    yield
    # Shutdown
    shutdown_scheduler()
    ai_worker_task.cancel()
    try:
        await ai_worker_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="ThreatLens API", lifespan=lifespan)

from app.config import settings

# Configure CORS origins
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

# Strip trailing slashes to avoid Starlette validation issues
origins = [origin.rstrip("/") for origin in origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(threats.router)
app.include_router(alerts.router)
