"""Admin Golden Ticket API endpoint tests."""

from typing import Any

import pytest
from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.core.database import get_db_session
from app.core.dependencies import require_admin_claims
from app.main import app
from app.schemas.email import EmailPreviewResponse


def test_email_preview_requires_admin_auth() -> None:
    """Email preview should return 401 when no bearer token is provided."""

    async def fake_require_admin_claims() -> dict[str, Any]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token"
        )

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners/1/golden-ticket/email-preview")
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_email_preview_returns_403_for_non_admin() -> None:
    """Email preview should return 403 when the token lacks the admin role."""

    async def fake_require_admin_claims() -> dict[str, Any]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Required role missing"
        )

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners/1/golden-ticket/email-preview")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_email_preview_returns_404_for_nonexistent_winner() -> None:
    """Email preview should return 404 when the winner does not exist."""

    class FakeResult:
        """Stub result returning None for scalar_one_or_none."""

        def scalars(self) -> "FakeResult":
            return self

        def all(self) -> list[Any]:
            return []

        def scalar_one_or_none(self) -> None:
            return None

    class FakeSession:
        """Stub session returning no winners or config settings."""

        async def execute(self, statement) -> FakeResult:
            return FakeResult()

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    async def fake_require_admin_claims() -> dict[str, Any]:
        return {"sub": "admin@test.com", "roles": ["CWS-Pulse-Admin"]}

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners/999/golden-ticket/email-preview")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_email_preview_returns_html_and_subject() -> None:
    """Email preview should return rendered HTML and subject for a valid winner."""

    class FakeWinner:
        """Stub winner with all required fields."""

        id = 1
        first_name = "Tania"
        last_name = "Labonte"
        job_title = "Customer Service Manager"
        department = "Customer Operations"
        award_type = "CHARTER_CHAMPION"
        subcategory = "Collaboration Catalyst"
        charter_pillar = "Proactive Problem Solving, Urgency & Ownership"
        company_value = "Accountability"
        story = "Tania did great work."
        nominated_by = "Maria Pouponneau"
        photo_url = None
        award_month = "Sep 2026"
        award_year = 2026
        golden_ticket = True
        golden_ticket_occasion = "Q3 2026"
        golden_ticket_ceo_message = "Thank you for your dedication."
        is_top_five = False
        top_five_rank = None
        top_five_year = None
        status = "PUBLISHED"

    class FakeSetting:
        """Stub config setting row."""

        def __init__(self, key: str, value: str) -> None:
            self.key = key
            self.value = value

    class FakeWinnerResult:
        """Stub result returning the fake winner."""

        def scalars(self) -> "FakeWinnerResult":
            return self

        def all(self) -> list[Any]:
            return []

        def scalar_one_or_none(self) -> FakeWinner:
            return FakeWinner()

    class FakeSettingsResult:
        """Stub result returning config settings."""

        def scalars(self) -> "FakeSettingsResult":
            return self

        def all(self) -> list[FakeSetting]:
            return [
                FakeSetting("ceo_name", "Naadir Hassan"),
                FakeSetting("ceo_title", "Chief Executive Officer"),
                FakeSetting("ccco_name", "Maria Pouponneau"),
                FakeSetting("ccco_title", "Chief Customer Centric Officer"),
                FakeSetting("chief_pc_name", ""),
                FakeSetting("chief_pc_title", "Chief People & Culture Officer"),
                FakeSetting("hall_of_fame_url", "https://pulse.cwsey.com"),
            ]

        def scalar_one_or_none(self) -> None:
            return None

    class FakeSession:
        """Stub session returning winner for first query, settings for second."""

        call_count = 0

        async def execute(self, statement) -> FakeWinnerResult | FakeSettingsResult:
            self.call_count += 1
            if self.call_count == 1:
                return FakeWinnerResult()
            return FakeSettingsResult()

    async def override_get_db():
        yield FakeSession()  # type: ignore[return-value]

    async def fake_require_admin_claims() -> dict[str, Any]:
        return {"sub": "admin@test.com", "roles": ["CWS-Pulse-Admin"]}

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    app.dependency_overrides[get_db_session] = override_get_db
    client = TestClient(app)

    try:
        response = client.get("/api/v1/admin/winners/1/golden-ticket/email-preview")
        assert response.status_code == 200
        data = response.json()
        assert "html" in data
        assert "subject" in data
        assert "Tania" in data["html"]
        assert "Labonte" in data["html"]
        assert "Q3 2026" in data["subject"]
    finally:
        app.dependency_overrides.clear()
