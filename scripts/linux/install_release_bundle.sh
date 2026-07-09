#!/usr/bin/env bash
# Install a built release bundle onto this VM as a new, independent release
# directory, then flip the `backend` / `frontend-dist` symlinks to it once
# everything is in place. This keeps the previous release on disk (untouched)
# so a bad deploy can be rolled back by re-pointing the symlinks instead of
# rebuilding.
#
# Deliberately keeps /opt/pulse-awards/backend as a symlink (not a directory
# swap) so the already-committed systemd unit — which hardcodes
# ExecStart=/opt/pulse-awards/backend/venv/bin/uvicorn — needs no changes.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
RELEASES_TO_KEEP="${RELEASES_TO_KEEP:-5}"
RELEASE_SHA="${GITHUB_SHA:-$(git -C "$ROOT_DIR" rev-parse HEAD)}"
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_SHA"

echo "== Installing release $RELEASE_SHA to $RELEASE_DIR =="
mkdir -p "$RELEASE_DIR"

echo "Copying backend (including venv) and frontend build..."
rsync -a --delete \
  --exclude ".env" \
  "$ROOT_DIR/backend/" "$RELEASE_DIR/backend/"
rsync -a --delete "$ROOT_DIR/frontend/app/dist/" "$RELEASE_DIR/frontend-dist/"
cp "$ROOT_DIR/docker-compose.yml" "$RELEASE_DIR/docker-compose.yml"
cp -r "$ROOT_DIR/pdf_service" "$RELEASE_DIR/pdf_service"

echo "Linking shared, non-versioned config into the release..."
ln -sfn "$APP_ROOT/.env" "$RELEASE_DIR/backend/.env"

echo "Flipping backend/, frontend-dist/, pdf_service/ and docker-compose.yml to the new release..."
ln -sfn "$RELEASE_DIR/backend" "$APP_ROOT/backend.new"
mv -Tf "$APP_ROOT/backend.new" "$APP_ROOT/backend"
ln -sfn "$RELEASE_DIR/frontend-dist" "$APP_ROOT/frontend-dist.new"
mv -Tf "$APP_ROOT/frontend-dist.new" "$APP_ROOT/frontend-dist"
# docker-compose.yml's playwright service uses a relative build context
# (./pdf_service), resolved against $APP_ROOT (where the compose symlink
# lives), not the release directory — so pdf_service needs the same
# symlink-flip treatment or `docker compose build` fails with
# "unable to prepare context: path .../pdf_service not found".
ln -sfn "$RELEASE_DIR/pdf_service" "$APP_ROOT/pdf_service.new"
mv -Tf "$APP_ROOT/pdf_service.new" "$APP_ROOT/pdf_service"
ln -sfn "$RELEASE_DIR/docker-compose.yml" "$APP_ROOT/docker-compose.yml.new"
mv -Tf "$APP_ROOT/docker-compose.yml.new" "$APP_ROOT/docker-compose.yml"

echo "Pruning old releases (keeping last $RELEASES_TO_KEEP)..."
mkdir -p "$APP_ROOT/releases"
cd "$APP_ROOT/releases"
# shellcheck disable=SC2012
ls -1t | tail -n "+$((RELEASES_TO_KEEP + 1))" | xargs -r -I{} rm -rf -- "{}"

echo "Install complete. Active release: $RELEASE_SHA"
