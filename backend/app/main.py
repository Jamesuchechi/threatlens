from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health, threats, alerts
from app.scheduler import start_scheduler, shutdown_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()

app = FastAPI(title="ThreatLens API", lifespan=lifespan)

# Add CORS middleware to support frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(threats.router)
app.include_router(alerts.router)
