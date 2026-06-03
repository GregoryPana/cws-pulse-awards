"""JWKS fetch path tests."""

from typing import Any

import pytest
from fastapi import HTTPException

from app.core import auth
from app.core.config import Settings


@pytest.mark.asyncio
async def test_fetch_jwks_rejects_missing_configuration() -> None:
    """Blank JWKS configuration should return 401."""

    with pytest.raises(HTTPException) as exc_info:
        await auth.fetch_jwks(Settings(ENTRA_TENANT_ID="", ENTRA_JWKS_URL=""))

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_fetch_jwks_downloads_and_caches_response(monkeypatch) -> None:
    """JWKS fetch should call HTTP once and then serve cached keys."""

    calls: dict[str, int] = {"count": 0}
    auth._jwks_cache.update({"url": None, "expires_at": 0.0, "keys": []})

    class FakeResponse:
        """Minimal HTTP response stub."""

        def raise_for_status(self) -> None:
            """Simulate successful HTTP status."""

        def json(self) -> dict[str, list[dict[str, str]]]:
            """Return a JWKS payload."""

            return {"keys": [{"kid": "abc", "alg": "RS256"}]}

    class FakeClient:
        """Minimal async client stub."""

        async def __aenter__(self) -> "FakeClient":
            """Enter the async context manager."""

            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            """Exit the async context manager."""

        async def get(self, url: str) -> FakeResponse:
            """Return the fake JWKS response."""

            calls["count"] += 1
            calls["url"] = url
            return FakeResponse()

    monkeypatch.setattr(auth.httpx, "AsyncClient", lambda timeout: FakeClient())
    settings = Settings(ENTRA_TENANT_ID="tenant-123", ENTRA_JWKS_URL="")

    first = await auth.fetch_jwks(settings)
    second = await auth.fetch_jwks(settings)

    assert first == [{"kid": "abc", "alg": "RS256"}]
    assert second == first
    assert calls["count"] == 1
    assert calls["url"] == "https://login.microsoftonline.com/tenant-123/discovery/v2.0/keys"


@pytest.mark.asyncio
async def test_validate_jwt_rejects_missing_signing_key(monkeypatch) -> None:
    """A token whose kid is absent from JWKS should be rejected."""

    async def fake_fetch_jwks(_settings: Settings | None = None) -> list[dict[str, Any]]:
        """Return a JWKS without the required kid."""

        return [{"kid": "other-kid", "alg": "RS256"}]

    monkeypatch.setattr(auth, "fetch_jwks", fake_fetch_jwks)
    monkeypatch.setattr(auth.jwt, "get_unverified_header", lambda token: {"kid": "missing-kid"})
    settings = Settings(ENTRA_AUDIENCE="api://client-id", ENTRA_ISSUER="https://issuer.test")

    with pytest.raises(HTTPException) as exc_info:
        await auth.validate_jwt("header-only-token", settings)

    assert exc_info.value.status_code == 401
