#!/usr/bin/env bash
# Final end-to-end verification after a full deploy: backend health/readiness
# directly, then the same checks again through NGINX (matching what a real
# user's browser would hit), plus the public Wall of Fame routes.
#
# Usage: ./scripts/linux/verify_release.sh <staging|production>
set -euo pipefail

ENVIRONMENT_NAME="${1:?Usage: verify_release.sh <staging|production>}"
APP_NAME="${APP_NAME:-pulse-awards}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
SERVER_NAME="${SERVER_NAME:-pulse.cwsey.com}"
# Non-empty on a shared VM like cwscx-tst01, where this app is mounted under a
# path (e.g. /pulse-awards) rather than owning its own domain.
URL_PATH_PREFIX="${URL_PATH_PREFIX:-}"

echo "== Verifying $APP_NAME ($ENVIRONMENT_NAME) =="

echo "-- Backend health (direct, localhost) --"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/v1/health" | tee /tmp/pulse-awards-verify-health.json
grep -Fq '"status":"ok"' /tmp/pulse-awards-verify-health.json

echo "-- Backend readiness (direct, localhost) --"
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/v1/health/ready" | tee /tmp/pulse-awards-verify-ready.json
grep -Fq '"db"' /tmp/pulse-awards-verify-ready.json

# The VM's certificate is self-signed (internal network only) — curl -k is
# expected and safe here, not a security shortcut for a public endpoint.
echo "-- Public API through NGINX (self-signed cert, -k expected) --"
curl -kfsS "https://${SERVER_NAME}${URL_PATH_PREFIX}/api/v1/health" >/dev/null

echo "-- Public Wall of Fame routes through NGINX --"
for route in "/charter-champions" "/instant-impact" "/admin/entry"; do
  code="$(curl -k -sS -o /dev/null -w '%{http_code}' "https://${SERVER_NAME}${URL_PATH_PREFIX}${route}")"
  if [[ "$code" != "200" ]]; then
    echo "Route $route returned HTTP $code, expected 200" >&2
    exit 1
  fi
  echo "  $route -> 200 OK"
done

echo "-- systemd service status --"
systemctl is-active --quiet "$APP_NAME" || { echo "$APP_NAME service is not active" >&2; exit 1; }
echo "  $APP_NAME is active"

echo "Verification passed for $ENVIRONMENT_NAME."
