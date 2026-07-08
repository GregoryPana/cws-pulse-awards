#!/usr/bin/env bash
# Render and install the CWS Pulse Awards NGINX site config, then reload.
#
# The self-signed certificate itself is provisioned manually on the VM per
# the DTO NGINX guide (docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md)
# — this script does not create certificates, only wires the config to them.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_NAME="${APP_NAME:-pulse-awards}"
APP_ROOT="${APP_ROOT:-/opt/$APP_NAME}"
SERVER_NAME="${SERVER_NAME:-pulse.cwsey.com}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-http://127.0.0.1:$BACKEND_PORT}"
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/ssl/$APP_NAME/$APP_NAME.crt}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/ssl/$APP_NAME/$APP_NAME.key}"

TEMPLATE="$ROOT_DIR/deploy/nginx/pulse-awards.conf.template"
SITE_AVAILABLE="/etc/nginx/sites-available/$APP_NAME.conf"
SITE_ENABLED="/etc/nginx/sites-enabled/$APP_NAME.conf"

if [[ ! -f "$SSL_CERT_PATH" || ! -f "$SSL_KEY_PATH" ]]; then
  echo "Missing certificate at $SSL_CERT_PATH or key at $SSL_KEY_PATH." >&2
  echo "Provision the self-signed certificate first — see" >&2
  echo "docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md" >&2
  exit 1
fi

echo "== Rendering $SITE_AVAILABLE =="
sed \
  -e "s|__SERVER_NAME__|$SERVER_NAME|g" \
  -e "s|__SSL_CERT__|$SSL_CERT_PATH|g" \
  -e "s|__SSL_KEY__|$SSL_KEY_PATH|g" \
  -e "s|__APP_ROOT__|$APP_ROOT|g" \
  -e "s|__BACKEND_UPSTREAM__|$BACKEND_UPSTREAM|g" \
  "$TEMPLATE" > "$SITE_AVAILABLE"

ln -sfn "$SITE_AVAILABLE" "$SITE_ENABLED"

echo "== Testing NGINX config =="
nginx -t

echo "== Reloading NGINX =="
systemctl reload nginx

echo "NGINX site installed and reloaded."
