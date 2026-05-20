from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    industry: str = Field(..., min_length=1)
    tech_stack: List[str] = Field(default_factory=list)

class UserRegisterResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    token: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    expires_at: datetime

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    industry: str
    tech_stack: List[str]
    alert_email_enabled: bool
    alert_webhook_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True
