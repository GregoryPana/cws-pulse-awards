"""Health and readiness endpoint tests."""

from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok() -> None:
    """The liveness endpoint should always return 200."""

    client = TestClient(app)

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ready_endpoint_returns_200_when_dependencies_are_up(monkeypatch) -> None:
    """Readiness should return 200 when database and SMTP checks pass."""

    async def fake_check_database() -> None:
        """Pretend the database is reachable."""

    async def fake_check_smtp() -> None:
        """Pretend SMTP is reachable."""

    monkeypatch.setattr("app.api.public.check_database", fake_check_database)
    monkeypatch.setattr("app.api.public.check_smtp", fake_check_smtp)

    client = TestClient(app)
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "db": "ok", "smtp": "ok"}


def test_ready_endpoint_returns_503_when_database_is_down(monkeypatch) -> None:
    """Readiness should return 503 when the database check fails."""

    async def fake_check_database() -> None:
        """Pretend the database is unavailable."""

        raise RuntimeError("db down")

    async def fake_check_smtp() -> None:
        """Pretend SMTP is reachable."""

    monkeypatch.setattr("app.api.public.check_database", fake_check_database)
    monkeypatch.setattr("app.api.public.check_smtp", fake_check_smtp)

    client = TestClient(app)
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "db": "error", "smtp": "ok"}
