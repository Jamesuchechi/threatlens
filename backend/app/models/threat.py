import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, text, Computed
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base

class Threat(Base):
    __tablename__ = "threats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    source = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    ingested_at = Column(DateTime(timezone=True), server_default=text("now()"))
    cvss_score = Column(Float, nullable=True)
    cvss_vector = Column(String, nullable=True)
    cwe_ids = Column(ARRAY(String), server_default="{}")
    affected_products = Column(ARRAY(String), server_default="{}")
    patch_available = Column(Boolean, default=False)
    patch_url = Column(String, nullable=True)
    
    # AI-generated fields
    ai_summary = Column(String, nullable=True)
    ai_recommendations = Column(ARRAY(String), server_default="{}")
    ai_industries = Column(ARRAY(String), server_default="{}")
    ai_risk_score = Column(Float, nullable=True)
    ai_processed_at = Column(DateTime(timezone=True), nullable=True)

    # Generated column for severity
    severity = Column(
        String,
        Computed(
            "CASE "
            "WHEN ai_risk_score >= 9.0 THEN 'critical' "
            "WHEN ai_risk_score >= 7.0 THEN 'high' "
            "WHEN ai_risk_score >= 4.0 THEN 'medium' "
            "ELSE 'low' "
            "END",
            persisted=True
        )
    )

    is_actively_exploited = Column(Boolean, default=False)

    alerts = relationship("Alert", back_populates="threat", cascade="all, delete-orphan")

