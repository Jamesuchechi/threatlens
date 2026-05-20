from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.threat import Threat
from app.schemas.threat import ThreatListResponse, ThreatResponse, ThreatStatsResponse, ThreatStatsTrend

router = APIRouter(prefix="/threats", tags=["threats"])

@router.get("", response_model=ThreatListResponse)
async def list_threats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    days: int = Query(7, ge=1),
    exploited: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Threat)
    
    # Filter by days (published_at)
    time_limit = datetime.now(timezone.utc) - timedelta(days=days)
    query = query.where(Threat.published_at >= time_limit)
    
    # Filter by severity
    if severity and severity.lower() != "all":
        query = query.where(Threat.severity == severity.lower())
        
    # Filter by source
    if source and source.lower() != "all":
        query = query.where(Threat.source == source.lower())
        
    # Filter by industry
    if industry:
        query = query.where(Threat.ai_industries.any(industry.lower()))
        
    # Filter by exploited status
    if exploited is not None:
        query = query.where(Threat.is_actively_exploited == exploited)
        
    # Search
    if search:
        query = query.where(
            or_(
                Threat.title.ilike(f"%{search}%"),
                Threat.description.ilike(f"%{search}%"),
                Threat.source_id.ilike(f"%{search}%")
            )
        )
        
    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply ordering and pagination
    query = query.order_by(Threat.ai_risk_score.desc().nullslast(), Threat.published_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)
    
    result = await db.execute(query)
    threats = result.scalars().all()
    
    return ThreatListResponse(
        total=total,
        page=page,
        limit=limit,
        threats=threats
    )

@router.get("/stats", response_model=ThreatStatsResponse)
async def get_threat_stats(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    
    # Total count last 7 days
    total_query = select(func.count(Threat.id)).where(Threat.published_at >= seven_days_ago)
    total_res = await db.execute(total_query)
    total_last_7_days = total_res.scalar() or 0
    
    # Critical count
    critical_query = select(func.count(Threat.id)).where(
        and_(
            Threat.published_at >= seven_days_ago,
            Threat.severity == "critical"
        )
    )
    critical_res = await db.execute(critical_query)
    critical_count = critical_res.scalar() or 0
    
    # Actively exploited count
    exploited_query = select(func.count(Threat.id)).where(
        and_(
            Threat.published_at >= seven_days_ago,
            Threat.is_actively_exploited == True
        )
    )
    exploited_res = await db.execute(exploited_query)
    actively_exploited_count = exploited_res.scalar() or 0
    
    # Average risk score
    avg_query = select(func.avg(Threat.ai_risk_score)).where(Threat.published_at >= seven_days_ago)
    avg_res = await db.execute(avg_query)
    avg_score_raw = avg_res.scalar()
    avg_risk_score = round(float(avg_score_raw), 1) if avg_score_raw is not None else 0.0
    
    # 7-day trend
    trend = []
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_start = datetime.combine(day_date, datetime.min.time(), tzinfo=timezone.utc)
        day_end = datetime.combine(day_date, datetime.max.time(), tzinfo=timezone.utc)
        
        day_count_query = select(func.count(Threat.id)).where(
            and_(
                Threat.published_at >= day_start,
                Threat.published_at <= day_end
            )
        )
        day_count_res = await db.execute(day_count_query)
        day_count = day_count_res.scalar() or 0
        
        trend.append(
            ThreatStatsTrend(
                date=day_date.isoformat(),
                count=day_count
            )
        )
        
    return ThreatStatsResponse(
        total_last_7_days=total_last_7_days,
        critical_count=critical_count,
        actively_exploited_count=actively_exploited_count,
        avg_risk_score=avg_risk_score,
        trend=trend
    )

@router.get("/{id}", response_model=ThreatResponse)
async def get_threat(id: str, db: AsyncSession = Depends(get_db)):
    try:
        import uuid
        threat_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid threat UUID format"
        )
        
    result = await db.execute(select(Threat).where(Threat.id == threat_uuid))
    threat = result.scalars().first()
    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Threat not found"
        )
    return threat
