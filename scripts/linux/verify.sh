#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
PYTHON_BIN="${PYTHON_BIN:-$BACKEND_DIR/venv/bin/python}"
SERVICE_TEMPLATE="$BACKEND_DIR/pulse-awards.service"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
README_FILE="$ROOT_DIR/README.md"
EXIT_FILE="$ROOT_DIR/EXIT.md"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
CI_WORKFLOW_FILE="$ROOT_DIR/.github/workflows/ci.yml"

require_file() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    echo "Missing required file: $file_path"
    exit 1
  fi
}

require_env_key() {
  local file_path="$1"
  local env_key="$2"

  grep -Eq "^${env_key}=" "$file_path" || {
    echo "Missing required environment key in $file_path: $env_key"
    exit 1
  }
}

export PYTHONPATH="$BACKEND_DIR"

require_container_health() {
  local container_name="$1"
  local health_state
  local runtime_state

  runtime_state="$(docker inspect --format '{{.State.Status}}' "$container_name")"
  if [[ "$runtime_state" != "running" ]]; then
    echo "Container $container_name is not running: $runtime_state"
    exit 1
  fi

  health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name")"
  if [[ "$health_state" != "healthy" ]]; then
    echo "Container $container_name is not healthy: $health_state"
    exit 1
  fi
}

verify_service_template() {
  require_file "$SERVICE_TEMPLATE"

  grep -Fq 'WorkingDirectory=/opt/pulse-awards/backend' "$SERVICE_TEMPLATE" || {
    echo "Service template missing expected WorkingDirectory"
    exit 1
  }
  grep -Fq 'EnvironmentFile=/opt/pulse-awards/.env' "$SERVICE_TEMPLATE" || {
    echo "Service template missing expected EnvironmentFile"
    exit 1
  }
  grep -Fq 'ExecStart=/opt/pulse-awards/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port ${BACKEND_PORT} --workers 2' "$SERVICE_TEMPLATE" || {
    echo "Service template missing expected ExecStart"
    exit 1
  }
  grep -Fq 'Restart=on-failure' "$SERVICE_TEMPLATE" || {
    echo "Service template missing expected Restart policy"
    exit 1
  }
}

verify_phase0_artifacts() {
  require_file "$ROOT_DIR/README.md"
  require_file "$ENV_EXAMPLE"
  require_file "$ROOT_DIR/EXIT.md"
  require_file "$ROOT_DIR/docker-compose.yml"
  require_file "$CI_WORKFLOW_FILE"
  require_file "$BACKEND_DIR/alembic.ini"
  require_file "$SERVICE_TEMPLATE"
}

verify_env_example() {
  require_env_key "$ENV_EXAMPLE" "APP_ENV"
  require_env_key "$ENV_EXAMPLE" "APP_VERSION"
  require_env_key "$ENV_EXAMPLE" "APP_SECRET_KEY"
  require_env_key "$ENV_EXAMPLE" "ADMIN_ROLE"
  require_env_key "$ENV_EXAMPLE" "DATABASE_URL"
  require_env_key "$ENV_EXAMPLE" "DB_HOST"
  require_env_key "$ENV_EXAMPLE" "DB_PORT"
  require_env_key "$ENV_EXAMPLE" "DB_NAME"
  require_env_key "$ENV_EXAMPLE" "DB_USER"
  require_env_key "$ENV_EXAMPLE" "DB_PASSWORD"
  require_env_key "$ENV_EXAMPLE" "ENTRA_TENANT_ID"
  require_env_key "$ENV_EXAMPLE" "ENTRA_CLIENT_ID"
  require_env_key "$ENV_EXAMPLE" "ENTRA_AUTHORITY"
  require_env_key "$ENV_EXAMPLE" "ENTRA_ISSUER"
  require_env_key "$ENV_EXAMPLE" "ENTRA_AUDIENCE"
  require_env_key "$ENV_EXAMPLE" "ENTRA_JWKS_URL"
  require_env_key "$ENV_EXAMPLE" "SMTP_HOST"
  require_env_key "$ENV_EXAMPLE" "SMTP_PORT"
  require_env_key "$ENV_EXAMPLE" "SMTP_TIMEOUT_SECONDS"
  require_env_key "$ENV_EXAMPLE" "SMTP_FROM"
  require_env_key "$ENV_EXAMPLE" "PHOTO_STORAGE_PATH"
  require_env_key "$ENV_EXAMPLE" "PDF_SERVICE_URL"
  require_env_key "$ENV_EXAMPLE" "VITE_API_BASE_URL"
  require_env_key "$ENV_EXAMPLE" "VITE_APP_URL"
  require_env_key "$ENV_EXAMPLE" "VITE_ENTRA_CLIENT_ID"
  require_env_key "$ENV_EXAMPLE" "VITE_ENTRA_TENANT_ID"
  require_env_key "$ENV_EXAMPLE" "VITE_ENTRA_AUTHORITY"
  require_env_key "$ENV_EXAMPLE" "VITE_ENTRA_API_SCOPE"
}

verify_readme_and_exit() {
  grep -Fq "Current phase: **Phase 0 foundation continuation**" "$README_FILE" || {
    echo "README.md missing Phase 0 gate statement"
    exit 1
  }
  grep -Fq "docker compose up -d --build" "$README_FILE" || {
    echo "README.md missing docker compose startup guidance"
    exit 1
  }
  grep -Fq "./scripts/linux/verify.sh" "$README_FILE" || {
    echo "README.md missing verification script guidance"
    exit 1
  }

  grep -Fq "Current status: **Phase 0 baseline verified locally / not production-ready**." "$EXIT_FILE" || {
    echo "EXIT.md missing current status banner"
    exit 1
  }
  grep -Fq "Phase 0 baseline verified locally; not handed over; not approved for production." "$EXIT_FILE" || {
    echo "EXIT.md missing explicit non-production handover status"
    exit 1
  }
}

verify_compose_env_wiring() {
  grep -Fq 'POSTGRES_PASSWORD: ${DB_PASSWORD}' "$COMPOSE_FILE" || {
    echo "docker-compose.yml missing DB_PASSWORD wiring"
    exit 1
  }
  grep -Fq 'DB_PORT=5433' "$ENV_EXAMPLE" || {
    echo ".env.example missing expected DB_PORT value"
    exit 1
  }
  grep -Fq '127.0.0.1:${DB_PORT:-5433}:5432' "$COMPOSE_FILE" || {
    echo "docker-compose.yml missing expected PostgreSQL port mapping"
    exit 1
  }
  grep -Fq 'PDF_SERVICE_URL=http://127.0.0.1:8001' "$ENV_EXAMPLE" || {
    echo ".env.example missing expected PDF service URL"
    exit 1
  }
  grep -Fq '127.0.0.1:${PDF_PORT:-8001}:8001' "$COMPOSE_FILE" || {
    echo "docker-compose.yml missing expected PDF sidecar port mapping"
    exit 1
  }
}

verify_ci_baseline() {
  grep -Fq 'python -m pip install -r backend/requirements.txt -r pdf_service/requirements.txt' "$CI_WORKFLOW_FILE" || {
    echo "CI workflow missing dependency installation step"
    exit 1
  }
  grep -Fq 'docker compose up -d --build' "$CI_WORKFLOW_FILE" || {
    echo "CI workflow missing compose startup step"
    exit 1
  }
  grep -Fq 'python -m alembic upgrade head' "$CI_WORKFLOW_FILE" || {
    echo "CI workflow missing Alembic migration step"
    exit 1
  }
  grep -Fq 'python -m pytest backend/tests' "$CI_WORKFLOW_FILE" || {
    echo "CI workflow missing backend test step"
    exit 1
  }
}

echo "Validating docker compose"
echo "Checking required Phase 0 artifacts"
verify_phase0_artifacts

echo "Checking .env.example coverage"
verify_env_example

echo "Checking README and EXIT handover content"
verify_readme_and_exit

echo "Checking compose and env wiring"
verify_compose_env_wiring

echo "Checking CI baseline workflow"
verify_ci_baseline

docker compose -f "$ROOT_DIR/docker-compose.yml" config >/dev/null
docker compose -f "$ROOT_DIR/docker-compose.yml" ps

echo "Checking compose container health"
require_container_health "pulse_db"
require_container_health "pulse_playwright"

echo "Checking systemd service template"
verify_service_template

echo "Applying Alembic migration"
(
  cd "$BACKEND_DIR"
  "$PYTHON_BIN" -m alembic upgrade head
)

echo "Checking seed data counts"
(
  cd "$BACKEND_DIR"
  "$PYTHON_BIN" - <<'PY'
from app.core.config import get_settings
import psycopg

settings = get_settings()
dsn = settings.resolved_database_url.replace("+asyncpg", "")

with psycopg.connect(dsn) as connection:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM config_pillars),
                (SELECT COUNT(*) FROM config_values),
                (SELECT COUNT(*) FROM config_subcategories),
                (SELECT COUNT(*) FROM config_settings)
            """
        )
        pillars, values, subcategories, settings_count = cursor.fetchone()

assert pillars == 8, pillars
assert values == 5, values
assert subcategories == 6, subcategories
assert settings_count >= 1, settings_count
print("Seed data counts verified")
PY
)

echo "Running backend and sidecar tests"
(
  cd "$BACKEND_DIR"
  "$PYTHON_BIN" -m pytest tests
)

echo "Verification checks passed"
