import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

settings = get_settings()

# NullPool avoids reusing a pooled asyncpg connection across the different event loops that pytest-asyncio
# creates per test, which otherwise raises "another operation is in progress". Not used in normal operation.
_engine_kwargs = {"echo": False, "future": True}
if os.environ.get("SQLALCHEMY_NULLPOOL") == "1":
    _engine_kwargs["poolclass"] = NullPool

engine = create_async_engine(settings.database_url, **_engine_kwargs)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
