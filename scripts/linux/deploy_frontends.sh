#!/usr/bin/env bash
# Confirm the frontend build landed correctly.
#
# The actual file placement already happened in install_release_bundle.sh
# (which repoints /opt/pulse-awards/frontend-dist at the new release via a
# symlink swap) — NGINX serves those files directly from disk with no
# separate "deploy" action of its own. This script exists as an explicit,
# named CI step so a broken build is caught here rather than surfacing as a
# confusing 404 during scripts/linux/verify_release.sh.
set -euo pipefail

APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
DIST_DIR="$APP_ROOT/frontend-dist"

echo "== Checking frontend build at $DIST_DIR =="

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "Missing $DIST_DIR/index.html — frontend build did not install correctly." >&2
  exit 1
fi

if [[ ! -d "$DIST_DIR/assets" ]]; then
  echo "Missing $DIST_DIR/assets — frontend build looks incomplete." >&2
  exit 1
fi

echo "Frontend build present: $(find "$DIST_DIR" -type f | wc -l) files."
