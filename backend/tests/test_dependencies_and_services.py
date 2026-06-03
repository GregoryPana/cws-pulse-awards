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
async def test_send_templated_email_logs_request(caplog) -> None:
    """Email stub should log the requested template and recipients."""

    with caplog.at_level("INFO"):
        await email_service.send_templated_email("golden_ticket.html", {"winner": "A"}, ["pc@example.com"])

    assert "Email stub invoked" in caplog.text


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
