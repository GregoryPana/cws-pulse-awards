"""Database engine and async session management."""

from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""



@lru_cache
def get_engine() -> AsyncEngine:
    """Create and cache the async SQLAlchemy engine."""

    settings = get_settings()
    return create_async_engine(settings.resolved_database_url, pool_pre_ping=True)


@lru_cache
def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Create and cache the async SQLAlchemy session factory."""

    return async_sessionmaker(get_engine(), expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session for FastAPI dependencies."""

    async with get_session_factory()() as session:
        yield session


async def check_database() -> None:
    """Raise if the database cannot execute a basic query."""

    async with get_engine().connect() as connection:
        await connection.execute(text("SELECT 1"))
