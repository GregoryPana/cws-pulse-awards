#!/usr/bin/env bash
# Deploy the backend: bootstrap or refresh /opt/pulse-awards/.env from GitHub
# Environment vars/secrets, refresh the systemd unit if changed, start/refresh
# the Docker support services (Postgres + PDF sidecar), run migrations against
# the newly-installed release, then restart the pulse-awards service.
#
# Must run AFTER scripts/linux/install_release_bundle.sh has repointed
# /opt/pulse-awards/backend at the new release.
#
# Config model (matches the pattern already used by other apps on this VM,
# e.g. cx-b2b-platform's deploy_backend.sh):
#   - BOOTSTRAP (only when .env does not exist yet): populates every key,
#     including the sensitive ones, from whatever CI env vars are present —
#     so a first-time VM setup needs zero manual `.env` editing as long as
#     the GitHub Environment secrets are set.
#   - SYNC (every deploy, bootstrap or not): re-writes only the low-risk,
#     frequently-changed operational keys (SMTP, ADMIN_ROLE, the two asset
#     base URLs) from the current CI env vars, so changing those requires
#     only a GitHub Environment variable update + re-run, never VM access.
#   - Everything else (APP_SECRET_KEY, DB_PASSWORD, DATABASE_URL, Entra IDs)
#     is written once at bootstrap and then left alone by every later
#     deploy — rotating those deliberately requires a VM login, by design.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
SERVER_NAME="${SERVER_NAME:-pulse.cwsey.com}"
URL_PATH_PREFIX="${URL_PATH_PREFIX:-}"
DB_PORT="${DB_PORT:-5433}"
ENV_FILE="$APP_ROOT/.env"
SERVICE_UNIT_SRC="$ROOT_DIR/backend/pulse-awards.service"
SERVICE_UNIT_DEST="/etc/systemd/system/$APP_NAME.service"

upsert_env_value() {
  local key="$1"
  local value="$2"
  python3 - "$ENV_FILE" "$key" "$value" <<'PY'
from pathlib import Path
import sys

env_path, key, value = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
output, updated = [], False
for line in lines:
    if line.startswith(f"{key}="):
        output.append(f"{key}={value}")
        updated = True
    else:
        output.append(line)
if not updated:
    output.append(f"{key}={value}")
env_path.write_text("\n".join(output) + "\n", encoding="utf-8")
PY
}

bootstrap_env_if_missing() {
  if [[ -f "$ENV_FILE" ]]; then
    echo "$ENV_FILE already exists — skipping bootstrap (only the synced keys below are refreshed)."
    return
  fi

  echo "$ENV_FILE does not exist yet — bootstrapping from .env.example and CI-provided values."
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"

  # Sensitive / rarely-changed values — only ever written here, at first bootstrap.
  # Each is only upserted if the CI job actually provided it, so a partial
  # bootstrap (e.g. Entra not yet registered) doesn't clobber existing blanks.
  [[ -n "${APP_SECRET_KEY:-}" ]] && upsert_env_value APP_SECRET_KEY "$APP_SECRET_KEY"
  [[ -n "${DB_PASSWORD:-}" ]] && upsert_env_value DB_PASSWORD "$DB_PASSWORD"
  # Leave DATABASE_URL blank (overriding .env.example's CHANGE_ME placeholder) so
  # the backend's own fallback (app/core/config.py: resolved_database_url) builds
  # it fresh from DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD on every startup —
  # this is what keeps it correct even if DB_PORT changes after bootstrap, since
  # DB_PORT is synced every deploy but a static DATABASE_URL would not be.
  upsert_env_value DATABASE_URL ""
  if [[ -n "${ENTRA_TENANT_ID:-}" ]]; then
    upsert_env_value ENTRA_TENANT_ID "$ENTRA_TENANT_ID"
    upsert_env_value ENTRA_AUTHORITY "https://login.microsoftonline.com/${ENTRA_TENANT_ID}"
    upsert_env_value ENTRA_ISSUER "https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0"
  fi
  if [[ -n "${ENTRA_CLIENT_ID:-}" ]]; then
    upsert_env_value ENTRA_CLIENT_ID "$ENTRA_CLIENT_ID"
    # v2.0 access tokens for this single-tenant app carry the bare client ID as
    # "aud", not the "api://<client-id>" App ID URI used only in the requested
    # scope string — confirmed against a real decoded token on 2026-07-10.
    upsert_env_value ENTRA_AUDIENCE "${ENTRA_CLIENT_ID}"
  fi

  echo "Bootstrap complete. Review $ENV_FILE once by hand before the first restart if anything above was skipped."
}

sync_runtime_env_from_ci() {
  echo "Syncing operational config from CI into $ENV_FILE..."
  local key
  for key in SMTP_HOST SMTP_PORT SMTP_FROM SMTP_TIMEOUT_SECONDS ADMIN_ROLE; do
    if [[ -n "${!key:-}" ]]; then
      upsert_env_value "$key" "${!key}"
    fi
  done

  # Ports — always kept in sync so the systemd unit (which expands
  # ${BACKEND_PORT} from this same file) and the app's own DB/PDF client
  # config never drift from what check_ports.sh / docker-compose actually
  # bound on a shared, multi-app VM.
  upsert_env_value BACKEND_PORT "${BACKEND_PORT:-8000}"
  upsert_env_value DB_PORT "${DB_PORT:-5433}"
  upsert_env_value PDF_SERVICE_URL "http://127.0.0.1:${PDF_PORT:-8001}"

  # Derived from SERVER_NAME + URL_PATH_PREFIX — always kept in sync, never
  # requires its own secret. URL_PATH_PREFIX is non-empty on shared VMs like
  # cwscx-tst01 where this app is mounted under a path (e.g. /pulse-awards)
  # rather than owning its own domain — see shared-vm-inventory.md.
  upsert_env_value APP_BASE_URL "https://${SERVER_NAME}${URL_PATH_PREFIX}"
  upsert_env_value PDF_ASSET_BASE_URL "https://${SERVER_NAME}${URL_PATH_PREFIX}"

  # Force-false on every deploy, never sourced from a variable — this must
  # never accidentally be true in staging or production.
  upsert_env_value DEV_AUTH_ENABLED "false"

  # Synced every deploy, not just at first bootstrap: the Entra app registration
  # is typically created AFTER this app's first deploy (chicken-and-egg — you
  # need a live redirect URI to register against), so a bootstrap-only write
  # would silently leave ENTRA_TENANT_ID/ENTRA_CLIENT_ID blank forever once
  # .env already exists. Re-writing the same GitHub secret value every deploy
  # is idempotent and keeps this manageable from GitHub alone, no VM login.
  if [[ -n "${ENTRA_TENANT_ID:-}" ]]; then
    upsert_env_value ENTRA_TENANT_ID "$ENTRA_TENANT_ID"
    upsert_env_value ENTRA_AUTHORITY "https://login.microsoftonline.com/${ENTRA_TENANT_ID}"
    upsert_env_value ENTRA_ISSUER "https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0"
  fi
  if [[ -n "${ENTRA_CLIENT_ID:-}" ]]; then
    upsert_env_value ENTRA_CLIENT_ID "$ENTRA_CLIENT_ID"
    # v2.0 access tokens for this single-tenant app carry the bare client ID as
    # "aud", not the "api://<client-id>" App ID URI used only in the requested
    # scope string — confirmed against a real decoded token on 2026-07-10.
    upsert_env_value ENTRA_AUDIENCE "${ENTRA_CLIENT_ID}"
  fi
}

echo "== Ensuring the $APP_NAME service user exists =="
id -u pulse &>/dev/null || sudo useradd --system --no-create-home --shell /usr/sbin/nologin pulse

echo "== Ensuring photo storage directory exists =="
sudo mkdir -p /data/pulse/photos
sudo chown pulse:pulse /data/pulse/photos

echo "== Preparing $ENV_FILE =="
bootstrap_env_if_missing
sync_runtime_env_from_ci

echo "== Refreshing systemd unit if changed =="
if ! cmp -s "$SERVICE_UNIT_SRC" "$SERVICE_UNIT_DEST" 2>/dev/null; then
  echo "Unit file changed — installing $SERVICE_UNIT_DEST"
  sudo cp "$SERVICE_UNIT_SRC" "$SERVICE_UNIT_DEST"
  sudo systemctl daemon-reload
  sudo systemctl enable "$APP_NAME"
else
  echo "Unit file unchanged."
fi

echo "== Starting Docker support services (Postgres + PDF sidecar) =="
docker compose -f "$APP_ROOT/docker-compose.yml" --env-file "$ENV_FILE" up -d --build

echo "Waiting for support services to report healthy..."
for _ in $(seq 1 30); do
  healthy_count="$(docker compose -f "$APP_ROOT/docker-compose.yml" ps --format json | grep -c '"Health":"healthy"' || true)"
  [[ "$healthy_count" -ge 2 ]] && break
  sleep 5
done
docker compose -f "$APP_ROOT/docker-compose.yml" ps

echo "== Running database migrations against the new release =="
(
  cd "$APP_ROOT/backend"
  ./venv/bin/python -m alembic upgrade head
)

echo "== Restarting $APP_NAME =="
sudo systemctl restart "$APP_NAME"

echo "Waiting for backend health endpoint..."
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT:-8000}/api/v1/health" >/dev/null 2>&1; then
    echo "Backend is healthy."
    exit 0
  fi
  sleep 3
done

echo "Backend did not become healthy in time." >&2
sudo journalctl -u "$APP_NAME" -n 50 --no-pager >&2
exit 1
