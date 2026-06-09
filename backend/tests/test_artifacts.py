"""Repository artifact content checks for Phase 0 readiness."""

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


def test_readme_includes_phase0_gate_and_local_run_steps() -> None:
    """README should explain the current phase and local verification path."""

    content = (ROOT_DIR / "README.md").read_text(encoding="utf-8")

    assert "Current phase: **Phase 0 foundation continuation**" in content
    assert "docker compose up -d --build" in content
    assert "./scripts/linux/verify.sh" in content


def test_exit_records_non_production_phase0_status() -> None:
    """EXIT should clearly state that the repo is not yet production-ready."""

    content = (ROOT_DIR / "EXIT.md").read_text(encoding="utf-8")

    assert "Current status: **Phase 0 baseline verified locally / not production-ready**." in content
    assert "Phase 0 baseline verified locally; not handed over; not approved for production." in content


def test_compose_and_env_example_stay_wired_together() -> None:
    """Compose and the example env file should agree on Phase 0 local wiring."""

    compose_content = (ROOT_DIR / "docker-compose.yml").read_text(encoding="utf-8")
    env_content = (ROOT_DIR / ".env.example").read_text(encoding="utf-8")

    assert 'POSTGRES_PASSWORD: ${DB_PASSWORD}' in compose_content
    assert 'DB_PORT=5433' in env_content
    assert '127.0.0.1:5433:5432' in compose_content
    assert 'PDF_SERVICE_URL=http://127.0.0.1:8001' in env_content
    assert '127.0.0.1:8001:8001' in compose_content


def test_ci_workflow_covers_phase0_backend_baseline() -> None:
    """CI should exercise the documented Phase 0 backend verification path."""

    content = (ROOT_DIR / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")

    assert "python -m pip install -r backend/requirements.txt -r pdf_service/requirements.txt" in content
    assert "docker compose up -d --build" in content
    assert "python -m alembic upgrade head" in content
    assert "python -m pytest backend/tests" in content
