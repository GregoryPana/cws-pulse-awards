#!/usr/bin/env bash
# Pre-flight port collision check for CWS Pulse Awards.
#
# This VM hosts multiple applications. Before a first-ever install of Pulse
# Awards, its three ports (backend, Postgres, PDF sidecar) must be free.
# On every later re-deploy, those same ports are expected to already be bound
# — by Pulse Awards' own systemd service and Docker containers — so this
# script distinguishes "bound by us" (fine) from "bound by something else"
# (fail loudly, rather than silently fighting another app for the port).
set -euo pipefail

APP_NAME="${APP_NAME:-pulse-awards}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
DB_PORT="${DB_PORT:-5433}"
PDF_PORT="${PDF_PORT:-8001}"

fail() {
  echo "PORT CHECK FAILED: $1" >&2
  echo "Another process is already using this port. Either stop it, or" >&2
  echo "override the conflicting port for $APP_NAME via the GitHub Environment" >&2
  echo "variables (BACKEND_PORT / DB_PORT / PDF_PORT) and the matching values" >&2
  echo "in .env, backend/pulse-awards.service, and the NGINX site config." >&2
  exit 1
}

port_owner_pid() {
  local port="$1"
  ss -tlnp "sport = :${port}" 2>/dev/null | awk 'NR>1 {print $NF}' | grep -oE 'pid=[0-9]+' | head -n1 | cut -d= -f2
}

check_backend_port() {
  local pid
  pid="$(port_owner_pid "$BACKEND_PORT")"

  if [[ -z "$pid" ]]; then
    echo "Backend port $BACKEND_PORT is free."
    return 0
  fi

  if systemctl is-active --quiet "$APP_NAME"; then
    echo "Backend port $BACKEND_PORT is held by the existing $APP_NAME service (PID $pid) — OK, this is a re-deploy."
    return 0
  fi

  fail "Backend port $BACKEND_PORT is held by PID $pid, which is not the $APP_NAME systemd service."
}

check_docker_port() {
  local port="$1"
  local expected_container="$2"
  local pid
  pid="$(port_owner_pid "$port")"

  if [[ -z "$pid" ]]; then
    echo "Port $port is free."
    return 0
  fi

  # Docker-mapped ports are held by docker-proxy / dockerd, not the container's
  # own PID — confirm ownership via the container name instead.
  if docker inspect --format '{{.State.Running}}' "$expected_container" 2>/dev/null | grep -q true; then
    echo "Port $port is held by the existing $expected_container container — OK, this is a re-deploy."
    return 0
  fi

  fail "Port $port is in use (PID $pid) but not by the expected $expected_container container."
}

echo "Checking ports for $APP_NAME (backend=$BACKEND_PORT, db=$DB_PORT, pdf=$PDF_PORT)"
check_backend_port
check_docker_port "$DB_PORT" "pulse_db"
check_docker_port "$PDF_PORT" "pulse_playwright"
echo "Port check passed."
