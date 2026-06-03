"""Authentication route tests."""

from typing import Any

from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.core.dependencies import require_admin_claims
from app.main import app


def test_admin_check_returns_401_when_unauthenticated() -> None:
    """The admin check route should return 401 for missing credentials."""

    async def fake_require_admin_claims() -> dict[str, Any]:
        """Raise the same error the real dependency would raise for missing auth."""

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    client = TestClient(app)

    response = client.get("/api/v1/auth/admin-check")

    app.dependency_overrides.clear()
    assert response.status_code == 401


def test_admin_check_returns_403_when_role_is_missing() -> None:
    """The admin check route should return 403 for non-admin tokens."""

    async def fake_require_admin_claims() -> dict[str, Any]:
        """Raise the same error the real dependency would raise for missing roles."""

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Required role missing")

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    client = TestClient(app)

    response = client.get("/api/v1/auth/admin-check")

    app.dependency_overrides.clear()
    assert response.status_code == 403


def test_admin_check_returns_200_for_admin() -> None:
    """The admin check route should return the validated claim set for admins."""

    async def fake_require_admin_claims() -> dict[str, Any]:
        """Return a valid admin claim set."""

        return {"sub": "admin-user", "roles": ["CWS-Pulse-Admin"]}

    app.dependency_overrides[require_admin_claims] = fake_require_admin_claims
    client = TestClient(app)

    response = client.get("/api/v1/auth/admin-check")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["claims"]["sub"] == "admin-user"
