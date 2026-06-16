"""Admin winner MVP API endpoint tests."""

from typing import Any

import pytest
from fastapi.testclient import TestClient

import app.api.admin_winners as admin_winners_api
from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.main import app


class FakeWinner:
    """Winner-like object with public and admin response fields."""

    id = 7
    award_type = "CHARTER_CHAMPION"
    first_name = "Marie"
    last_name = "Payet"
    job_title = "Customer Service Advisor"
    department = "Customer Operations"
    subcategory = "Collaboration Catalyst"
    charter_pillar = "Professionalism & Respect"
    company_value = "Customer"
    story = "Marie helped a customer resolve a complex billing issue with care."
    nominated_by = "A colleague"
    photo_url = None
    award_month = "Jun 2026"
    award_year = 2026
    golden_ticket = False
    golden_ticket_occasion = None
    is_top_five = False
    top_five_rank = None
    top_five_year = None
    status = "PUBLISHED"
    created_by = "admin@test.com"
    updated_by = "admin@test.com"


class FakeSetting:
    """Config setting row stub."""

    def __init__(self, key: str, value: str) -> None:
        self.key = key
        self.value = value


class FakeRecipient:
    """Email recipient row stub."""

    def __init__(self, email: str) -> None:
        self.email = email


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


def admin_claims() -> dict[str, Any]:
    """Return claims for an authorised admin."""

    return {"preferred_username": "admin@test.com", "roles": ["CWS-Pulse-Admin"]}


async def override_admin_claims() -> dict[str, Any]:
    """FastAPI dependency override for admin claims."""

    return admin_claims()


def winner_payload() -> dict[str, Any]:
    """Return a valid winner create payload."""

    return {
        "award_type": "CHARTER_CHAMPION",
        "first_name": "Marie",
        "last_name": "Payet",
        "job_title": "Customer Service Advisor",
        "department": "Customer Operations",
        "subcategory": "Collaboration Catalyst",
        "charter_pillar": "Professionalism & Respect",
        "company_value": "Customer",
        "story": "Marie helped a customer resolve a complex billing issue with care.",
        "nominated_by": "A colleague",
        "award_month": "Jun 2026",
        "award_year": 2026,
    }


def test_create_winner_requires_admin_auth() -> None:
    """Create endpoint should reject unauthenticated users."""

    client = TestClient(app)

    response = client.post("/api/v1/admin/winners", json=winner_payload())

    assert response.status_code == 401


def test_create_winner_persists_record_and_returns_admin_shape() -> None:
    """Create endpoint should add, commit, refresh, and return the saved winner."""

    class FakeSession:
        added_winner: Any | None = None
        committed = False
        refreshed = False

        def add(self, winner: Any) -> None:
            self.added_winner = winner

        async def commit(self) -> None:
            self.committed = True

        async def refresh(self, winner: Any) -> None:
            self.refreshed = True
            winner.id = 42
            winner.golden_ticket = False
            winner.golden_ticket_occasion = None
            winner.is_top_five = False
            winner.top_five_rank = None
            winner.top_five_year = None

    session = FakeSession()

    async def override_get_db():
        yield session  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.post("/api/v1/admin/winners", json=winner_payload())
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == 42
        assert data["first_name"] == "Marie"
        assert data["created_by"] == "admin@test.com"
        assert session.added_winner is not None
        assert session.committed is True
        assert session.refreshed is True
    finally:
        app.dependency_overrides.clear()


def test_list_admin_winners_returns_saved_records() -> None:
    """List endpoint should return admin winner records."""

    class FakeSession:
        async def execute(self, statement) -> FakeScalarResult:
            return FakeScalarResult([FakeWinner()])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["winners"][0]["last_name"] == "Payet"
    finally:
        app.dependency_overrides.clear()


def test_award_email_preview_renders_saved_winner() -> None:
    """Award email preview should render from the saved winner and settings."""

    class FakeSession:
        call_count = 0

        async def execute(self, statement) -> FakeScalarResult:
            self.call_count += 1
            if self.call_count == 1:
                return FakeScalarResult(FakeWinner())
            return FakeScalarResult([FakeSetting("hall_of_fame_url", "https://pulse.cwsey.com")])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners/7/email-preview")
        assert response.status_code == 200
        data = response.json()
        assert "CWS Pulse Awards" in data["subject"]
        assert "Marie" in data["html"]
        assert "Collaboration Catalyst" in data["html"]
    finally:
        app.dependency_overrides.clear()


def test_award_email_send_uses_active_recipients(monkeypatch: pytest.MonkeyPatch) -> None:
    """Award email send should call the email service with active recipients."""

    sent: dict[str, Any] = {}

    async def fake_send_templated_email(
        template_name: str,
        context: dict[str, Any],
        recipients: list[str],
    ) -> None:
        sent["template_name"] = template_name
        sent["context"] = context
        sent["recipients"] = recipients

    monkeypatch.setattr(
        admin_winners_api,
        "send_templated_email",
        fake_send_templated_email,
    )

    class FakeSession:
        call_count = 0

        async def execute(self, statement) -> FakeScalarResult:
            self.call_count += 1
            if self.call_count == 1:
                return FakeScalarResult(FakeWinner())
            if self.call_count == 2:
                return FakeScalarResult([FakeRecipient("pc-team@test.com")])
            return FakeScalarResult([FakeSetting("hall_of_fame_url", "https://pulse.cwsey.com")])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.post("/api/v1/admin/winners/7/email-send")
        assert response.status_code == 200
        data = response.json()
        assert data["email_sent"] is True
        assert data["recipients"] == ["pc-team@test.com"]
        assert sent["template_name"] == "award_charter_champion.html"
        assert sent["context"]["winner_first_name"] == "Marie"
        assert sent["recipients"] == ["pc-team@test.com"]
    finally:
        app.dependency_overrides.clear()


def test_award_email_send_returns_400_without_recipients() -> None:
    """Award email send should fail clearly when no active recipients exist."""

    class FakeSession:
        call_count = 0

        async def execute(self, statement) -> FakeScalarResult:
            self.call_count += 1
            if self.call_count == 1:
                return FakeScalarResult(FakeWinner())
            return FakeScalarResult([])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.post("/api/v1/admin/winners/7/email-send")
        assert response.status_code == 400
        assert "No active email recipients" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_award_email_send_returns_500_on_service_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Award email send should surface email service failures."""

    async def fake_send_templated_email(
        template_name: str,
        context: dict[str, Any],
        recipients: list[str],
    ) -> None:
        del template_name, context, recipients
        raise RuntimeError("smtp down")

    monkeypatch.setattr(
        admin_winners_api,
        "send_templated_email",
        fake_send_templated_email,
    )

    class FakeSession:
        call_count = 0

        async def execute(self, statement) -> FakeScalarResult:
            self.call_count += 1
            if self.call_count == 1:
                return FakeScalarResult(FakeWinner())
            if self.call_count == 2:
                return FakeScalarResult([FakeRecipient("pc-team@test.com")])
            return FakeScalarResult([FakeSetting("hall_of_fame_url", "https://pulse.cwsey.com")])

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    app.dependency_overrides[require_admin_claims] = override_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.post("/api/v1/admin/winners/7/email-send")
        assert response.status_code == 500
        assert response.json()["detail"] == "Award email send failed"
    finally:
        app.dependency_overrides.clear()
