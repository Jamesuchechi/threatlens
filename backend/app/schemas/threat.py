from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class ThreatResponse(BaseModel):
    id: UUID
    source: str
    source_id: str
    title: str
    description: str
    published_at: datetime
    updated_at: datetime
    ingested_at: datetime
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
    cwe_ids: List[str] = []
    affected_products: List[str] = []
    patch_available: bool = False
    patch_url: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_recommendations: List[str] = []
    ai_industries: List[str] = []
    ai_risk_score: Optional[float] = None
    ai_processed_at: Optional[datetime] = None
    severity: str
    is_actively_exploited: bool = False

    class Config:
        from_attributes = True

class ThreatListItem(BaseModel):
    id: UUID
    source_id: str
    title: str
    severity: str
    ai_risk_score: Optional[float] = None
    ai_summary: Optional[str] = None
    published_at: datetime
    patch_available: bool = False
    is_actively_exploited: bool = False
    ai_industries: List[str] = []

    class Config:
        from_attributes = True

class ThreatListResponse(BaseModel):
    total: int
    page: int
    limit: int
    threats: List[ThreatListItem]

class ThreatStatsTrend(BaseModel):
    date: str
    count: int

class ThreatStatsResponse(BaseModel):
    total_last_7_days: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    actively_exploited_count: int
    avg_risk_score: float
    trend: List[ThreatStatsTrend]
