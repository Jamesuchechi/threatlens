import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    threat_id = Column(UUID(as_uuid=True), ForeignKey("threats.id", ondelete="CASCADE"), nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=text("now()"))
    reason = Column(String, nullable=False)
    delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="alerts")
    threat = relationship("Threat", back_populates="alerts")
