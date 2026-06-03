# Phase 0 Deployment Baseline

## Approved runtime model

- Backend: host process managed by `systemd`
- Database: Docker Compose
- PDF sidecar: Docker Compose
- Frontend: deferred to Phase 1 static build/NGINX work

## Local verification sequence

1. Ensure Docker Desktop is running.
2. Start support services:

```bash
docker compose up -d --build
```

3. Install backend dependencies into `backend/venv`.
4. Apply schema:

```bash
cd backend
./venv/bin/python -m alembic upgrade head
```

5. Start the backend:

```bash
./venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

6. Run smoke checks:

```bash
./scripts/linux/smoke.sh
./scripts/linux/verify.sh
```

## CI baseline

`.github/workflows/ci.yml` performs the Phase 0 baseline checks:

- install backend and PDF sidecar dependencies
- `docker compose up -d --build`
- `python -m alembic upgrade head`
- `pytest backend/tests pdf_service/tests`

## Not included yet

- NGINX configuration
- release bundle scripts
- staging or production deployment automation
- backup retention automation
