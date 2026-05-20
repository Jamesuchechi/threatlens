from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/health", tags=["health"])

@router.get("", response_model=dict)
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    db_status = "disconnected"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    redis_status = "disconnected"
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=2)
        if await r.ping():
            redis_status = "connected"
        await r.close()
    except Exception:
        pass

    last_ingestion = None
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=2)
        last_ingestion_val = await r.get("ingestion:last_run")
        if last_ingestion_val:
            last_ingestion = last_ingestion_val.decode("utf-8")
        await r.close()
    except Exception:
        pass

    overall_status = "ok"
    if db_status != "connected" or redis_status != "connected":
        overall_status = "error"

    return {
        "status": overall_status,
        "db": db_status,
        "redis": redis_status,
        "last_ingestion": last_ingestion
    }
