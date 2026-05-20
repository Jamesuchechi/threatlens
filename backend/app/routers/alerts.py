from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alert import AlertListResponse, AlertPreferencesUpdateRequest

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=AlertListResponse)
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(Alert.triggered_at.desc())
        .options(selectinload(Alert.threat))
    )
    alerts = result.scalars().all()
    return AlertListResponse(alerts=alerts)

@router.post("/preferences")
async def update_preferences(
    payload: AlertPreferencesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.alert_email_enabled = payload.email_enabled
    current_user.alert_webhook_url = str(payload.webhook_url) if payload.webhook_url else None
    
    await db.commit()
    return {
        "status": "success",
        "message": "Alert preferences updated successfully",
        "preferences": {
            "email_enabled": current_user.alert_email_enabled,
            "webhook_url": current_user.alert_webhook_url
        }
    }
