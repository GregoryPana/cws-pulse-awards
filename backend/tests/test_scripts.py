"""Verification script sanity checks."""

from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


def test_verify_script_checks_compose_container_health() -> None:
    """The full verification script should require healthy compose containers."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert 'require_container_health "pulse_db"' in content
    assert 'require_container_health "pulse_playwright"' in content
    assert "docker inspect --format '{{.State.Status}}'" in content
    assert "docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'" in content


def test_verify_script_checks_phase0_artifacts() -> None:
    """The full verification script should require core Phase 0 files."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert "verify_phase0_artifacts()" in content
    assert 'require_file "$ROOT_DIR/README.md"' in content
    assert 'require_file "$ENV_EXAMPLE"' in content
    assert 'require_file "$ROOT_DIR/EXIT.md"' in content
    assert 'require_file "$ROOT_DIR/docker-compose.yml"' in content
    assert 'require_file "$BACKEND_DIR/alembic.ini"' in content
    assert 'require_file "$SERVICE_TEMPLATE"' in content
    assert "Checking required Phase 0 artifacts" in content


def test_verify_script_checks_env_example_coverage() -> None:
    """The full verification script should require documented environment keys."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert 'ENV_EXAMPLE="$ROOT_DIR/.env.example"' in content
    assert "verify_env_example()" in content
    assert 'require_env_key "$ENV_EXAMPLE" "APP_SECRET_KEY"' in content
    assert 'require_env_key "$ENV_EXAMPLE" "ENTRA_JWKS_URL"' in content
    assert 'require_env_key "$ENV_EXAMPLE" "PDF_SERVICE_URL"' in content
    assert 'require_env_key "$ENV_EXAMPLE" "VITE_ENTRA_API_SCOPE"' in content
    assert "Checking .env.example coverage" in content


def test_verify_script_checks_readme_exit_and_compose_wiring() -> None:
    """The full verification script should validate handover docs and core wiring."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert "verify_readme_and_exit()" in content
    assert "verify_compose_env_wiring()" in content
    assert 'README_FILE="$ROOT_DIR/README.md"' in content
    assert 'EXIT_FILE="$ROOT_DIR/EXIT.md"' in content
    assert 'COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"' in content
    assert "Checking README and EXIT handover content" in content
    assert "Checking compose and env wiring" in content


def test_verify_script_checks_ci_baseline() -> None:
    """The full verification script should validate the CI baseline workflow."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert 'CI_WORKFLOW_FILE="$ROOT_DIR/.github/workflows/ci.yml"' in content
    assert 'require_file "$CI_WORKFLOW_FILE"' in content
    assert "verify_ci_baseline()" in content
    assert "Checking CI baseline workflow" in content
    assert "python -m alembic upgrade head" in content
    assert "python -m pytest backend/tests" in content


def test_verify_script_checks_service_template() -> None:
    """The full verification script should validate the systemd template."""

    verify_script = ROOT_DIR / "scripts" / "linux" / "verify.sh"
    content = verify_script.read_text(encoding="utf-8")

    assert 'SERVICE_TEMPLATE="$BACKEND_DIR/pulse-awards.service"' in content
    assert "verify_service_template()" in content
    assert "Checking systemd service template" in content
    assert "WorkingDirectory=/opt/pulse-awards/backend" in content
    assert "EnvironmentFile=/opt/pulse-awards/.env" in content
    assert "Restart=on-failure" in content


def test_smoke_script_checks_compose_container_health() -> None:
    """The smoke script should fail when compose containers are not healthy."""

    smoke_script = ROOT_DIR / "scripts" / "linux" / "smoke.sh"
    content = smoke_script.read_text(encoding="utf-8")

    assert 'require_container_health "pulse_db"' in content
    assert 'require_container_health "pulse_playwright"' in content
    assert "check_response_contains()" in content
    assert 'curl -fsS "http://127.0.0.1:8001/health" -o /tmp/pulse-awards-pdf-health.json' in content
    assert 'curl -fsS "http://127.0.0.1:8000/api/v1/health" -o /tmp/pulse-awards-health.json' in content
    assert "check_response_contains /tmp/pulse-awards-pdf-health.json '\"status\":\"ok\"'" in content
    assert "check_response_contains /tmp/pulse-awards-health.json '\"status\":\"ok\"'" in content
    assert "check_response_contains /tmp/pulse-awards-ready.json '\"status\"'" in content
    assert "check_response_contains /tmp/pulse-awards-ready.json '\"db\"'" in content
    assert "check_response_contains /tmp/pulse-awards-ready.json '\"smtp\"'" in content
