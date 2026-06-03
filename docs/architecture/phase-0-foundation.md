# Phase 0 Foundation Architecture

## Scope

Phase 0 provides only the deployable foundation for CWS Pulse Awards:

- PostgreSQL 16 via Docker Compose on `127.0.0.1:5433`
- Playwright PDF sidecar via Docker Compose on `127.0.0.1:8001`
- FastAPI backend running on the host via `uvicorn`/`systemd`
- Alembic initial schema and seed data
- Entra JWT validation and admin role enforcement

## Runtime layout

- `docker-compose.yml`
  - `db`: PostgreSQL 16, persistent named volume, localhost binding only
  - `playwright`: approved utility sidecar for PDF rendering, localhost binding only
- `backend/app/main.py`
  - FastAPI app entry point that wires API routers
- `backend/app/api/public.py`
  - `/api/v1/health`
  - `/api/v1/health/ready`
- `backend/app/api/auth.py`
  - `/api/v1/auth/admin-check`

## Configuration model

- Environment variables are authoritative.
- `DATABASE_URL` may be supplied directly.
- If `DATABASE_URL` is blank, the backend builds it from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- No database password fallback is hardcoded in source.

## Verification baseline

Phase 0 verification is expected to prove:

- Docker Compose validates and both services are healthy
- `alembic upgrade head` succeeds
- seed counts are present in PostgreSQL
- backend health and readiness endpoints respond on `127.0.0.1:8000`
- auth route returns `401`, `403`, and `200` in the expected cases
- PDF sidecar renders a PDF response
