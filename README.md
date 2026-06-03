# CWS Pulse Awards

Internal staff recognition platform for Cable & Wireless Seychelles.

Current phase: **Phase 0 foundation continuation**. Do not proceed to Phase 1 without Gregory's explicit approval.

## What this platform does

- Displays approved Pulse Awards winners in an internal Digital Hall of Fame.
- Provides restricted admin entry/management for approved winners.
- Supports Golden Ticket recognition output through email/PDF flows in later phases.

## Confirmed routes and decisions

- Public Hall of Fame routes:
  - `/charter-champions`
  - `/instant-impact`
- Golden Ticket flow:
  - as-and-when admin discretion;
  - mark → personalise → trigger;
  - CEO message editable before each trigger.
- Leavers remain visible permanently.
- Repeat wins are allowed.

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy async, Alembic.
- Database: PostgreSQL 16 via Docker Compose on host port `5433`.
- PDF sidecar: Playwright service via Docker Compose on `127.0.0.1:8001`.
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui baseline, starting Phase 1.
- Runtime: backend via systemd, frontend via host NGINX static files.
- Auth: Microsoft Entra ID, backend JWT/JWKS validation, backend role enforcement authoritative.

## Start here

For OpenCode/Codex/Claude Code agents:

1. `OPENCODE.md`
2. `PROJECT_START.md`
3. `AGENT_HANDOVER.md`
4. `docs/INDEX.md`
5. `schema.sql`
6. `docs/reference/TEST_STRATEGY.md`

For humans/developers:

1. `README.md`
2. `docs/INDEX.md`
3. `EXIT.md`
4. `docs/01-standards/internal-dev-kit/README.md`

## Repository structure

- `backend/` — FastAPI app, Alembic migrations, tests, systemd unit.
- `frontend/app/` — single SPA, populated from Phase 1.
- `pdf_service/` — Playwright PDF sidecar.
- `scripts/linux/` — release, deploy, backup, and verification scripts.
- `docs/` — architecture, standards, design references, deployment, operations, and archive.
- `.github/workflows/` — CI/CD workflow definitions when enabled.
- `.opencode/skills/` — project-local coding-agent guidance.

## Local setup summary

Copy `.env.example` to `.env`, set a local `DB_PASSWORD`, then start the infrastructure with Docker Compose.

```bash
docker compose up -d --build
```

Backend setup/testing is under `backend/`.

```bash
cd backend
python -m venv venv
./venv/bin/python -m pip install -r requirements.txt
./venv/bin/python -m alembic upgrade head
cd ..
./scripts/linux/verify.sh
```

## Important gates

- Do not deploy without Gregory approval.
- Do not create/push a remote until Gregory confirms repository target.
- Do not proceed past Phase 0 until Gregory approves Phase 0.
- Do not commit secrets; `.env` is ignored.
- Complete `EXIT.md` before production handover.

## Key references

- `PROJECT_START.md` — Phase 0 startup instructions.
- `AGENT_HANDOVER.md` — authoritative technical specification.
- `OPENCODE.md` — coding-agent operating rules.
- `HANDOFF_CHECKLIST.md` — handoff and review checklist.
- `docs/01-standards/internal-dev-kit/` — DTO development governance and templates.
- `docs/03-design/reference-html/` — visual reference HTML.
