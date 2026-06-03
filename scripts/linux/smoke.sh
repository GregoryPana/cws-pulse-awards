#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Checking docker compose configuration"
docker compose -f "$ROOT_DIR/docker-compose.yml" config >/dev/null

echo "Checking compose service status"
docker compose -f "$ROOT_DIR/docker-compose.yml" ps

echo "Checking PDF sidecar health"
curl -fsS "http://127.0.0.1:8001/health"

echo "Checking backend health"
curl -fsS "http://127.0.0.1:8000/api/v1/health"

echo "Checking backend readiness"
ready_code="$(curl -sS -o /tmp/pulse-awards-ready.json -w '%{http_code}' "http://127.0.0.1:8000/api/v1/health/ready")"
if [[ "$ready_code" != "200" && "$ready_code" != "503" ]]; then
  echo "Unexpected readiness status: $ready_code"
  cat /tmp/pulse-awards-ready.json
  exit 1
fi
cat /tmp/pulse-awards-ready.json

echo "Smoke checks passed"
