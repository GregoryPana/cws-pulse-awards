#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
PYTHON_BIN="${PYTHON_BIN:-$BACKEND_DIR/venv/bin/python}"

export PYTHONPATH="$BACKEND_DIR"

echo "Validating docker compose"
docker compose -f "$ROOT_DIR/docker-compose.yml" config >/dev/null
docker compose -f "$ROOT_DIR/docker-compose.yml" ps

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
