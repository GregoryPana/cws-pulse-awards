#!/usr/bin/env bash
# Wire CWS Pulse Awards into the VM's EXISTING shared NGINX config, then reload.
#
# cwscx-tst01 already runs one NGINX server block (owned by cx-b2b-platform's
# own deploy, which fully re-renders /etc/nginx/sites-available/cwscx-staging
# on every one of ITS deploys). Pulse Awards must never touch that file, and
# does not get its own listen 80/443 server block, domain, or TLS cert -- those
# are already taken. Instead this script manages ONLY a BEGIN/END-marked block
# inside /etc/nginx/snippets/cwscx-staging-extra-routes.conf, a file that:
#   - already exists (seeded once by cx-b2b-platform, e.g. with system-check's
#     own location blocks) and is never re-rendered by cx-b2b-platform again;
#   - is already unconditionally `include`d by the shared server block.
# So appending our own marked block here is enough -- no change to any file
# owned by another app, and no coordination needed with its deploy pipeline.
# See docs/deployment/shared-vm-inventory.md for the full picture.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-http://127.0.0.1:$BACKEND_PORT}"
URL_PATH_PREFIX="${URL_PATH_PREFIX:-/pulse-awards}"
EXTRA_ROUTES_FILE="${EXTRA_ROUTES_FILE:-/etc/nginx/snippets/cwscx-staging-extra-routes.conf}"

TEMPLATE="$ROOT_DIR/deploy/nginx/pulse-awards.conf.template"
BEGIN_MARKER="# BEGIN pulse-awards (managed by scripts/linux/deploy_nginx.sh -- do not edit by hand)"
END_MARKER="# END pulse-awards"

if [[ ! -f "$EXTRA_ROUTES_FILE" ]]; then
  echo "Missing $EXTRA_ROUTES_FILE." >&2
  echo "This file is owned by cx-b2b-platform's own deploy (it seeds it once, on" >&2
  echo "its first deploy, and never re-renders it afterwards). Run that app's" >&2
  echo "deploy at least once on this VM before Pulse Awards' first deploy, or" >&2
  echo "create the file by hand and confirm the shared server block includes it." >&2
  exit 1
fi

echo "== Rendering Pulse Awards location block =="
RENDERED_BLOCK="$(sed \
  -e "s|__URL_PATH_PREFIX__|$URL_PATH_PREFIX|g" \
  -e "s|__APP_ROOT__|$APP_ROOT|g" \
  -e "s|__BACKEND_UPSTREAM__|$BACKEND_UPSTREAM|g" \
  "$TEMPLATE")"

echo "== Updating $EXTRA_ROUTES_FILE (idempotent, marker-scoped) =="
TMP_FILE="$(mktemp)"
EXTRA_ROUTES_FILE="$EXTRA_ROUTES_FILE" BEGIN_MARKER="$BEGIN_MARKER" END_MARKER="$END_MARKER" RENDERED_BLOCK="$RENDERED_BLOCK" \
  python3 - "$TMP_FILE" <<'PY'
import os
import sys
from pathlib import Path

file_path = Path(os.environ["EXTRA_ROUTES_FILE"])
begin_marker = os.environ["BEGIN_MARKER"]
end_marker = os.environ["END_MARKER"]
rendered_block = os.environ["RENDERED_BLOCK"]
tmp_path = Path(sys.argv[1])

existing = file_path.read_text(encoding="utf-8")
new_block = f"{begin_marker}\n{rendered_block.rstrip()}\n{end_marker}\n"

if begin_marker in existing and end_marker in existing:
    before, rest = existing.split(begin_marker, 1)
    _, after = rest.split(end_marker, 1)
    output = before.rstrip("\n") + ("\n\n" if before.strip() else "") + new_block + after.lstrip("\n")
else:
    separator = "" if not existing or existing.endswith("\n") else "\n"
    spacer = "\n" if existing.strip() else ""
    output = existing + separator + spacer + new_block

tmp_path.write_text(output, encoding="utf-8")
PY

mv "$TMP_FILE" "$EXTRA_ROUTES_FILE"

echo "== Testing NGINX config =="
sudo nginx -t

echo "== Reloading NGINX =="
sudo systemctl reload nginx

echo "NGINX location block installed and reloaded."
