# OpenCode Operating Rules — CWS Pulse Awards

This file is the project-local operating guide for OpenCode/Codex/Claude Code agents working in this repository.

## Required reading order

1. `PROJECT_START.md`
2. `AGENT_HANDOVER.md`
3. `docs/INDEX.md`
4. `schema.sql`
5. `DESIGN_SYSTEM.md`
6. `docs/01-standards/internal-dev-kit/README.md`
7. `docs/reference/TEST_STRATEGY.md`

## Current phase

Phase 0 foundation continuation.

Do not proceed to Phase 1 until Gregory explicitly approves Phase 0.

Phase 0 is limited to:

- PostgreSQL 16 Docker Compose service on host port `5433`.
- Playwright PDF sidecar on localhost `8001`.
- FastAPI backend skeleton and health/readiness endpoints.
- SQLAlchemy async database connectivity.
- Entra JWT validation and admin role enforcement.
- Alembic initial schema and seed data.
- systemd service template.
- tests and coverage.
- repository hygiene and handover documentation.

## Confirmed product decisions

Do not reopen these decisions:

- T1: Hall of Fame uses two public routes in one SPA: `/charter-champions` and `/instant-impact`.
- T2/P1: Golden Ticket is as-and-when, admin discretion. Flow: mark → personalise → trigger.
- T7: CEO closing paragraph is editable/personalised before each Golden Ticket trigger.
- P5: leavers remain visible permanently; no leaver workflow.
- P7: repeat wins are allowed; no platform duplicate constraint.

## DTO development governance

Use the INTERNAL DEV KIT snapshot in `docs/01-standards/internal-dev-kit/`.

Key non-negotiables:

- Backend runs by `systemd`, not Docker.
- Docker Compose is for PostgreSQL and approved utility services only.
- Frontend is static build served by host NGINX.
- PostgreSQL 16 host port is `5433`.
- Entra ID backend authorization is authoritative; frontend checks are convenience only.
- Deployment must use self-hosted runners for internal-only VMs.
- Migrations must be explicit and reviewed; never run schema changes indirectly from request handling.
- `EXIT.md` is mandatory and must be completed before production handover.
- No secrets in code, repo, docs, logs, or handoff packs.

## Forbidden without Gregory approval

Do not:

- deploy to staging or production;
- create or push a GitHub remote;
- change branch protection or CI/CD runner configuration;
- inspect or print `.env` secret values;
- force push or rewrite history;
- run destructive database commands;
- proceed past Phase 0;
- reinterpret confirmed business decisions;
- add non-standard services such as Redis/Celery/n8n unless explicitly approved.

## Expected work style

- Keep changes narrow and phase-aligned.
- Use branch/PR discipline once a remote exists.
- Commit only after tests pass once GitHub remote/commit workflow is approved.
- Prefer small, verifiable increments.
- Run tests for changed areas.
- Update docs when architecture, operations, auth, deployment, or handover assumptions change.

## Required end-of-task handoff

Before ending any meaningful OpenCode task, produce a Hermes Update Pack with:

- branch/status;
- files changed;
- commands run;
- tests run and results;
- implementation summary;
- deployment impact;
- auth/security/data impact;
- docs/handover impact;
- decisions made or confirmed;
- risks/open questions;
- suggested Hermes vault updates.

Do not include secrets.
