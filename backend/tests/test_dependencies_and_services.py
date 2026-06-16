"""Dependency and service helper tests."""

from typing import Any

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core import dependencies
from app.core.config import Settings
from app.services import email_service, pdf_service


@pytest.mark.asyncio
async def test_require_admin_claims_requires_bearer_token() -> None:
    """Missing credentials should return 401."""

    with pytest.raises(HTTPException) as exc_info:
        await dependencies.require_admin_claims(None)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_admin_claims_returns_claims(monkeypatch) -> None:
    """Validated admin claims should be returned unchanged."""

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token-value")

    async def fake_validate_jwt(token: str) -> dict[str, Any]:
        """Return a valid claim set for the supplied token."""

        assert token == "token-value"
        return {"roles": ["CWS-Pulse-Admin"], "sub": "user-1"}

    def fake_require_role(claims: dict[str, Any]) -> dict[str, Any]:
        """Pass claims through as already authorized."""

        return claims

    monkeypatch.setattr(dependencies, "validate_jwt", fake_validate_jwt)
    monkeypatch.setattr(dependencies, "require_role", fake_require_role)

    claims = await dependencies.require_admin_claims(credentials)

    assert claims["sub"] == "user-1"


@pytest.mark.asyncio
async def test_send_templated_email_uses_smtp_relay(monkeypatch) -> None:
    """Email service should render HTML and send it through the SMTP relay."""

    sent: dict[str, Any] = {}

    class FakeSMTP:
        """SMTP stub that records calls."""

        def __init__(self, host: str, port: int, timeout: float) -> None:
            sent["host"] = host
            sent["port"] = port
            sent["timeout"] = timeout

        def __enter__(self) -> "FakeSMTP":
            return self

        def __exit__(self, exc_type, exc, tb) -> None:
            pass

        def ehlo(self) -> None:
            sent["ehlo_count"] = sent.get("ehlo_count", 0) + 1

        def has_extn(self, extension: str) -> bool:
            sent["extension"] = extension
            return True

        def starttls(self) -> None:
            sent["starttls"] = True

        def send_message(self, message) -> None:
            sent["message"] = message

    monkeypatch.setattr(
        email_service,
        "get_settings",
        lambda: Settings(
            SMTP_HOST="smtp.test.local",
            SMTP_PORT=587,
            SMTP_TIMEOUT_SECONDS=5,
            SMTP_FROM="noreply@test.local",
        ),
    )
    monkeypatch.setattr(email_service.smtplib, "SMTP", FakeSMTP)

    await email_service.send_templated_email(
        "award_charter_champion.html",
        {
            "winner_first_name": "Marie",
            "winner_last_name": "Payet",
            "winner_job_title": "Advisor",
            "winner_department": "CX",
            "award_type_label": "Charter Champion",
            "subcategory": "Collaboration Catalyst",
            "charter_pillar": "Accountability",
            "company_value": "Customer",
            "story": "Excellent support.",
            "nominated_by": "A colleague",
            "award_month": "Jun 2026",
            "hall_of_fame_url": "https://pulse.cwsey.com",
            "photo_url": None,
        },
        ["pc@example.com"],
    )

    assert sent["host"] == "smtp.test.local"
    assert sent["starttls"] is True
    assert sent["message"]["Subject"] == (
        "CWS Pulse Awards — New Charter Champion: Marie Payet"
    )
    assert sent["message"]["From"] == "noreply@test.local"
    assert sent["message"]["To"] == "pc@example.com"


@pytest.mark.asyncio
async def test_send_templated_email_requires_recipient() -> None:
    """Email service should reject attempts without recipients."""

    with pytest.raises(ValueError):
        await email_service.send_templated_email("award_charter_champion.html", {}, [])


@pytest.mark.asyncio
async def test_request_placeholder_pdf_calls_sidecar(monkeypatch) -> None:
    """PDF client should post to the configured sidecar and return its bytes."""

    called: dict[str, Any] = {}

    class FakeResponse:
        """Minimal successful HTTP response stub."""

        content = b"pdf-bytes"

        def raise_for_status(self) -> None:
            """Simulate a successful response."""

    class FakeClient:
        """Minimal async HTTP client stub."""

        async def __aenter__(self) -> "FakeClient":
            """Enter the async context manager."""

            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            """Exit the async context manager."""

        async def post(self, url: str, json: dict[str, Any]) -> FakeResponse:
            """Record the call and return PDF bytes."""

            called["url"] = url
            called["json"] = json
            return FakeResponse()

    monkeypatch.setattr(pdf_service, "get_settings", lambda: Settings(PDF_SERVICE_URL="http://127.0.0.1:8001"))
    monkeypatch.setattr(pdf_service.httpx, "AsyncClient", lambda timeout: FakeClient())

    content = await pdf_service.request_placeholder_pdf()

    assert content == b"pdf-bytes"
    assert called["url"] == "http://127.0.0.1:8001/generate"
    assert called["json"]["filename"] == "placeholder.pdf"
