"""Database helper and model wiring tests."""

from typing import Any

import pytest

from app.core import database
from app.models import (
    ConfigPillar,
    ConfigSetting,
    ConfigSubcategory,
    ConfigValue,
    EmailRecipient,
    Winner,
)


def test_get_engine_uses_settings_database_url(monkeypatch) -> None:
    """Engine creation should use the configured async database URL."""

    captured: dict[str, Any] = {}

    class FakeSettings:
        """Minimal settings stub with a database URL."""

        resolved_database_url = "postgresql+asyncpg://pulse:test@127.0.0.1:5433/pulse_awards"

    def fake_create_async_engine(url: str, pool_pre_ping: bool) -> str:
        """Capture engine creation arguments."""

        captured["url"] = url
        captured["pool_pre_ping"] = pool_pre_ping
        return "engine-object"

    database.get_engine.cache_clear()
    monkeypatch.setattr(database, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(database, "create_async_engine", fake_create_async_engine)

    engine = database.get_engine()

    assert engine == "engine-object"
    assert captured == {
        "url": "postgresql+asyncpg://pulse:test@127.0.0.1:5433/pulse_awards",
        "pool_pre_ping": True,
    }


def test_get_session_factory_uses_cached_engine(monkeypatch) -> None:
    """Session factory should be built from the cached engine."""

    captured: dict[str, Any] = {}

    def fake_async_sessionmaker(engine: object, expire_on_commit: bool) -> str:
        """Capture sessionmaker creation arguments."""

        captured["engine"] = engine
        captured["expire_on_commit"] = expire_on_commit
        return "session-factory"

    database.get_session_factory.cache_clear()
    monkeypatch.setattr(database, "get_engine", lambda: "engine-object")
    monkeypatch.setattr(database, "async_sessionmaker", fake_async_sessionmaker)

    session_factory = database.get_session_factory()

    assert session_factory == "session-factory"
    assert captured == {"engine": "engine-object", "expire_on_commit": False}


@pytest.mark.asyncio
async def test_get_db_session_yields_session(monkeypatch) -> None:
    """Dependency should yield the session produced by the session factory."""

    class FakeSessionContext:
        """Async context manager that yields a fixed session."""

        async def __aenter__(self) -> str:
            """Return the fake session instance."""

            return "session-object"

        async def __aexit__(self, exc_type, exc, tb) -> None:
            """Exit the async context manager."""

    monkeypatch.setattr(database, "get_session_factory", lambda: (lambda: FakeSessionContext()))

    generator = database.get_db_session()
    session = await anext(generator)

    assert session == "session-object"

    with pytest.raises(StopAsyncIteration):
        await anext(generator)


@pytest.mark.asyncio
async def test_check_database_executes_basic_query(monkeypatch) -> None:
    """Database health check should execute SELECT 1."""

    executed: dict[str, str] = {}

    class FakeConnection:
        """Async connection stub for the health query."""

        async def __aenter__(self) -> "FakeConnection":
            """Enter the async context manager."""

            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            """Exit the async context manager."""

        async def execute(self, statement) -> None:
            """Record the executed SQL statement."""

            executed["sql"] = str(statement)

    class FakeEngine:
        """Engine stub exposing an async connect context manager."""

        def connect(self) -> FakeConnection:
            """Return the fake connection context manager."""

            return FakeConnection()

    monkeypatch.setattr(database, "get_engine", lambda: FakeEngine())

    await database.check_database()

    assert executed["sql"] == "SELECT 1"


def test_models_are_importable_and_mapped() -> None:
    """ORM models should expose their expected mapped table names."""

    pillar = ConfigPillar(name="Pillar", sort_order=1, active=True)
    value = ConfigValue(name="Value", sort_order=1, active=True)
    subcategory = ConfigSubcategory(award_type="CHARTER_CHAMPION", name="Sub", sort_order=1, active=True)
    setting = ConfigSetting(key="hall_of_fame_url", value="https://pulse.cwsey.com", description="desc")
    recipient = EmailRecipient(email="pc@example.com", name="P&C", active=True)
    winner = Winner(
        award_type="CHARTER_CHAMPION",
        first_name="Jane",
        last_name="Doe",
        job_title="Engineer",
        department="Technology",
        subcategory="Collaboration Catalyst",
        charter_pillar="Accountability",
        company_value="Team",
        story="Great work",
        award_month="Jun 2026",
        award_year=2026,
        created_by="admin@example.com",
    )

    assert pillar.__tablename__ == "config_pillars"
    assert value.__tablename__ == "config_values"
    assert subcategory.__tablename__ == "config_subcategories"
    assert setting.__tablename__ == "config_settings"
    assert recipient.__tablename__ == "email_recipients"
    assert winner.__tablename__ == "winners"
    assert winner.first_name == "Jane"
