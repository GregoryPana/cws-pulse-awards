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
  npm run build
)

echo "== Building PDF sidecar image =="
docker compose -f "$ROOT_DIR/docker-compose.yml" build playwright

echo "Release bundle build complete."
echo "  Backend venv:   $BACKEND_DIR/venv"
echo "  Frontend dist:  $FRONTEND_DIR/dist"
