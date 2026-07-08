#!/usr/bin/env bash
# Deploy the backend: refresh the systemd unit if changed, start/refresh the
# Docker support services (Postgres + PDF sidecar), run migrations against
# the newly-installed release, then restart the pulse-awards service.
#
# Must run AFTER scripts/linux/install_release_bundle.sh has repointed
# /opt/pulse-awards/backend at the new release.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
SERVICE_UNIT_SRC="$ROOT_DIR/backend/pulse-awards.service"
SERVICE_UNIT_DEST="/etc/systemd/system/$APP_NAME.service"

echo "== Ensuring the $APP_NAME service user exists =="
id -u pulse &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin pulse

echo "== Ensuring photo storage directory exists =="
mkdir -p /data/pulse/photos
chown pulse:pulse /data/pulse/photos

echo "== Refreshing systemd unit if changed =="
if ! cmp -s "$SERVICE_UNIT_SRC" "$SERVICE_UNIT_DEST" 2>/dev/null; then
  echo "Unit file changed — installing $SERVICE_UNIT_DEST"
  cp "$SERVICE_UNIT_SRC" "$SERVICE_UNIT_DEST"
  systemctl daemon-reload
  systemctl enable "$APP_NAME"
else
  echo "Unit file unchanged."
fi

echo "== Starting Docker support services (Postgres + PDF sidecar) =="
docker compose -f "$APP_ROOT/docker-compose.yml" --env-file "$APP_ROOT/.env" up -d --build

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
systemctl restart "$APP_NAME"

echo "Waiting for backend health endpoint..."
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT:-8000}/api/v1/health" >/dev/null 2>&1; then
    echo "Backend is healthy."
    exit 0
  fi
  sleep 3
done

echo "Backend did not become healthy in time." >&2
journalctl -u "$APP_NAME" -n 50 --no-pager >&2
exit 1
