# Phase 0 Operations Runbook

## Support services

Start and inspect the Phase 0 support services:

```bash
docker compose up -d --build
docker compose ps
```

## Backend

Run locally for verification:

```bash
cd backend
./venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Expected checks:

- `curl http://127.0.0.1:8000/api/v1/health`
- `curl http://127.0.0.1:8000/api/v1/health/ready`
- `curl http://127.0.0.1:8001/health`

## Verification scripts

- `scripts/linux/smoke.sh`: lightweight service smoke checks
- `scripts/linux/verify.sh`: migration, seed-data, backend test, and sidecar verification
- `scripts/linux/backup_template.sh`: production backup placeholder
- `scripts/linux/restore_template.sh`: production restore placeholder

## Handover notes

- `EXIT.md` remains the production handover gate.
- Backup/restore automation is still a required pre-production task.
- Entra registration values must be recorded before deployment approval.
