#!/usr/bin/env bash
# Build the release bundle for CWS Pulse Awards inside the CI workspace.
#
# Produces a fresh backend virtualenv and a production frontend build,
# entirely within the checked-out workspace. Nothing outside the workspace
# is touched here — install_release_bundle.sh does the actual VM install.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/app"
PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "== Building backend virtualenv =="
rm -rf "$BACKEND_DIR/venv"
"$PYTHON_BIN" -m venv "$BACKEND_DIR/venv"
"$BACKEND_DIR/venv/bin/pip" install --upgrade pip
"$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"

echo "== Building frontend (production) =="
(
  cd "$FRONTEND_DIR"
  npm ci

  # Derive the frontend's build-time URLs from the same SERVER_NAME/URL_PATH_PREFIX
  # the backend uses (deploy_backend.sh), so the two never drift apart. On a shared
  # VM like cwscx-tst01, URL_PATH_PREFIX is non-empty (e.g. /pulse-awards) because
  # this app is mounted under a path rather than owning its own domain — see
  # docs/deployment/shared-vm-inventory.md. Local/CI-only builds leave these unset
  # and get the existing "/" root-relative defaults.
  export VITE_BASE_PATH="${VITE_BASE_PATH:-${URL_PATH_PREFIX:+${URL_PATH_PREFIX}/}}"
  export VITE_API_BASE_URL="${VITE_API_BASE_URL:-${SERVER_NAME:+https://${SERVER_NAME}${URL_PATH_PREFIX}/api/v1}}"
  export VITE_APP_URL="${VITE_APP_URL:-${SERVER_NAME:+https://${SERVER_NAME}${URL_PATH_PREFIX}}}"
  export VITE_ENTRA_CLIENT_ID="${VITE_ENTRA_CLIENT_ID:-${ENTRA_CLIENT_ID:-}}"
  export VITE_ENTRA_TENANT_ID="${VITE_ENTRA_TENANT_ID:-${ENTRA_TENANT_ID:-}}"
  export VITE_ENTRA_AUTHORITY="${VITE_ENTRA_AUTHORITY:-${ENTRA_TENANT_ID:+https://login.microsoftonline.com/${ENTRA_TENANT_ID}}}"
  export VITE_ENTRA_API_SCOPE="${VITE_ENTRA_API_SCOPE:-${ENTRA_CLIENT_ID:+api://${ENTRA_CLIENT_ID}/access_as_user}}"
  export VITE_DEV_AUTH_ENABLED="false"

  npm run build
)

echo "== Building PDF sidecar image =="
docker compose -f "$ROOT_DIR/docker-compose.yml" build playwright

echo "Release bundle build complete."
echo "  Backend venv:   $BACKEND_DIR/venv"
echo "  Frontend dist:  $FRONTEND_DIR/dist"
