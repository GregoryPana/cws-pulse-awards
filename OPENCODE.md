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

## Required end-of-task handoff (cadence changed 2026-07-06)

Do NOT produce a full Hermes Update Pack after every task — it is credit-expensive. Instead, after any meaningful task, append a compact entry (3-8 lines: timestamp, one-line summary, branch@commit + pushed yes/no, files, verification, impact flags) to `.opencode/hermes-pending-updates.md`, then ask Gregory in ONE line whether to generate the consolidated Hermes Update Pack now. Only when Gregory says yes (or runs /hermes-handoff), read all unflushed entries plus current repo state and produce ONE consolidated pack covering everything since the last flush (then move flushed entries under a `## Flushed <date>` heading). Skip the queue only for deployment, auth/schema, destructive or security events. Use the canonical project name "CWS Pulse Awards". The consolidated pack must include:

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

## Design skills and UI guidance

Before substantial frontend/UI work, read `docs/AGENT_DESIGN_SKILLS.md` and the project `DESIGN.md` / `DESIGN_SYSTEM.md` if present. Hermes decides the specific design-skill bundle for each task; do not load every design skill by default. For implemented UI, run available build/lint/type checks and provide browser/responsive/console verification before claiming completion.



## Project flow mapping

Before substantial redesign, migration, architecture change, cross-cutting implementation, audit, handover, or deployment planning, read `docs/agent-skills/project-flow-mapping/SKILL.md`. Use it to map the applicable user, administrator, system, data, state, integration, failure/recovery, operational, delivery, and manual flows from repository evidence. Do not require a full remap for a small, bounded change when a current flow map already covers the affected area; update only the impacted slice. Start read-only and do not convert discovered gaps into implementation scope without owner approval.
