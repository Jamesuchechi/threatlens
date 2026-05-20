from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserRegisterResponse, UserLogin, TokenResponse
from app.services.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        name=user_in.name,
        industry=user_in.industry,
        tech_stack=user_in.tech_stack,
        alert_email_enabled=True,
    )
    db.add(new_user)
    await db.flush() # Populate the id
    
    # Create token
    token, _ = create_access_token(user_id=new_user.id)
    
    return UserRegisterResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        token=token
    )

@router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalars().first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    
    token, expires_at = create_access_token(user_id=user.id)
    
    return TokenResponse(
        token=token,
        expires_at=expires_at
    )

from app.dependencies import get_current_user
from app.schemas.user import UserResponse, UserUpdate

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_update.name is not None:
        current_user.name = user_update.name
    if user_update.industry is not None:
        current_user.industry = user_update.industry
    if user_update.tech_stack is not None:
        current_user.tech_stack = user_update.tech_stack
    if user_update.alert_email_enabled is not None:
        current_user.alert_email_enabled = user_update.alert_email_enabled
    if user_update.alert_webhook_url is not None:
        current_user.alert_webhook_url = user_update.alert_webhook_url
        
    await db.commit()
    await db.refresh(current_user)
    return current_user


