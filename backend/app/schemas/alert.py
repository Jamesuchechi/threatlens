from pydantic import BaseModel, HttpUrl
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class AlertThreatInfo(BaseModel):
    id: UUID
    title: str
    severity: str

    class Config:
        from_attributes = True

class AlertListItem(BaseModel):
    id: UUID
    threat: AlertThreatInfo
    triggered_at: datetime
    reason: str

    class Config:
        from_attributes = True

class AlertListResponse(BaseModel):
    alerts: List[AlertListItem]

class AlertPreferencesUpdateRequest(BaseModel):
    email_enabled: bool
    webhook_url: Optional[str] = None
    min_severity: Optional[str] = None
