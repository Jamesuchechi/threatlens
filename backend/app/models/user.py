import uuid
from sqlalchemy import Column, String, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    tech_stack = Column(ARRAY(String), server_default="{}")
    alert_email_enabled = Column(Boolean, default=True)
    alert_webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    last_login = Column(DateTime(timezone=True), nullable=True)

    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")

