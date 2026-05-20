import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.services.security import decode_access_token
from app.models.user import User

reusable_oauth2 = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    user_id_str = decode_access_token(token.credentials)
    if not user_id_str:
        raise credentials_exception
    
    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalars().first()
    if not user:
        raise credentials_exception
        
    return user
