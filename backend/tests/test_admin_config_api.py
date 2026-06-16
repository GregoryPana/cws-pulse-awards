"""Admin configuration API tests."""

from typing import Any

from fastapi.testclient import TestClient

from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.main import app


class FakeRecipient:
    """Email recipient-like object for response model tests."""

    id = 3
    email = "pc-team@test.com"
    name = "P&C Team"
    active = True
    created_by = "admin@test.com"


class FakeScalarResult:
    """SQLAlchemy result stub for scalar values."""

    def __init__(self, data: Any) -> None:
        self.data = data

    def scalars(self) -> "FakeScalarResult":
        return self

    def all(self) -> list[Any]:
        return self.data if isinstance(self.data, list) else []

    def scalar_one_or_none(self) -> Any | None:
        return self.data if not isinstance(self.data, list) else None


async def override_admin_claims() -> dict[str, Any]:
    """FastAPI dependency override for admin claims."""

    return {"preferred_username": "admin@test.com", "roles": ["CWS-Pulse-Admin"]}


def test_list_recipients_requires_admin_auth() -> None:
    """Recipient list should require admin auth."""

    client = TestClient(app)

    response = client.get("/api/v1/admin/config/recipients")

    assert response.status_code == 401


def test_list_recipients_returns_configured_rows() -> None:
    """Recipient list should return configured rows."""

    class FakeSession:
        async def execute(self, statement) -> FakeScalarResult:
            return FakeScalarResult([FakeRecipient()])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/config/recipients")
        assert response.status_code == 200
        data = response.json()
        assert data[0]["email"] == "pc-team@test.com"
    finally:
        app.dependency_overrides.clear()


def test_create_recipient_persists_row() -> None:
    """Create recipient should add, commit, refresh, and return the row."""

    class FakeSession:
        added: Any | None = None
        committed = False
        refreshed = False

        def add(self, row: Any) -> None:
            self.added = row

        async def commit(self) -> None:
            self.committed = True

        async def rollback(self) -> None:
            pass

        async def refresh(self, row: Any) -> None:
            self.refreshed = True
            row.id = 5

    session = FakeSession()

    async def override_get_db():
        yield session  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.post(
            "/api/v1/admin/config/recipients",
            json={"email": "PC-Team@Test.com", "name": "P&C Team", "active": True},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == 5
        assert data["email"] == "pc-team@test.com"
        assert data["created_by"] == "admin@test.com"
        assert session.added is not None
        assert session.committed is True
        assert session.refreshed is True
    finally:
        app.dependency_overrides.clear()


def test_toggle_recipient_switches_active_state() -> None:
    """Toggle endpoint should flip active and persist."""

    class ToggleRecipient(FakeRecipient):
        active = True

    recipient = ToggleRecipient()

    class FakeSession:
        committed = False
        refreshed = False

        async def execute(self, statement) -> FakeScalarResult:
            return FakeScalarResult(recipient)

        async def commit(self) -> None:
            self.committed = True

        async def refresh(self, row: Any) -> None:
            self.refreshed = True

    session = FakeSession()

    async def override_get_db():
        yield session  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.patch("/api/v1/admin/config/recipients/3/toggle")
        assert response.status_code == 200
        assert response.json()["active"] is False
        assert session.committed is True
        assert session.refreshed is True
    finally:
        app.dependency_overrides.clear()


def test_delete_recipient_removes_row() -> None:
    """Delete endpoint should delete the recipient and commit."""

    class FakeSession:
        deleted: Any | None = None
        committed = False

        async def execute(self, statement) -> FakeScalarResult:
            return FakeScalarResult(FakeRecipient())

        async def delete(self, row: Any) -> None:
            self.deleted = row

        async def commit(self) -> None:
            self.committed = True

    session = FakeSession()

    async def override_get_db():
        yield session  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.delete("/api/v1/admin/config/recipients/3")
        assert response.status_code == 204
        assert session.deleted is not None
        assert session.committed is True
    finally:
        app.dependency_overrides.clear()
