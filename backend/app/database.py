from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

db_url = settings.DATABASE_URL
connect_args = {}

if "sslmode=" in db_url:
    connect_args["ssl"] = True
    # Strip sslmode from query parameters to prevent asyncpg error
    import urllib.parse as urlparse
    url_parts = list(urlparse.urlparse(db_url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.pop("sslmode", None)
    url_parts[4] = urlparse.urlencode(query)
    db_url = urlparse.urlunparse(url_parts)

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
