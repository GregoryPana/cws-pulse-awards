#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

check_response_contains() {
  local file_path="$1"
  local expected_text="$2"

  grep -Fq "$expected_text" "$file_path" || {
    echo "Response missing expected content: $expected_text"
    cat "$file_path"
    exit 1
  }
}

require_container_health() {
  local container_name="$1"
  local health_state
  local runtime_state

  runtime_state="$(docker inspect --format '{{.State.Status}}' "$container_name")"
  if [[ "$runtime_state" != "running" ]]; then
    echo "Container $container_name is not running: $runtime_state"
    exit 1
  fi

  health_state="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name")"
  if [[ "$health_state" != "healthy" ]]; then
    echo "Container $container_name is not healthy: $health_state"
    exit 1
  fi
}

echo "Checking docker compose configuration"
docker compose -f "$ROOT_DIR/docker-compose.yml" config >/dev/null

echo "Checking compose service status"
docker compose -f "$ROOT_DIR/docker-compose.yml" ps

echo "Checking compose container health"
require_container_health "pulse_db"
require_container_health "pulse_playwright"

echo "Checking PDF sidecar health"
curl -fsS "http://127.0.0.1:8001/health" -o /tmp/pulse-awards-pdf-health.json
check_response_contains /tmp/pulse-awards-pdf-health.json '"status":"ok"'

echo "Checking backend health"
curl -fsS "http://127.0.0.1:8000/api/v1/health" -o /tmp/pulse-awards-health.json
check_response_contains /tmp/pulse-awards-health.json '"status":"ok"'

echo "Checking backend readiness"
ready_code="$(curl -sS -o /tmp/pulse-awards-ready.json -w '%{http_code}' "http://127.0.0.1:8000/api/v1/health/ready")"
if [[ "$ready_code" != "200" && "$ready_code" != "503" ]]; then
  echo "Unexpected readiness status: $ready_code"
  cat /tmp/pulse-awards-ready.json
  exit 1
fi
check_response_contains /tmp/pulse-awards-ready.json '"status"'
check_response_contains /tmp/pulse-awards-ready.json '"db"'
check_response_contains /tmp/pulse-awards-ready.json '"smtp"'
cat /tmp/pulse-awards-ready.json

echo "Smoke checks passed"
