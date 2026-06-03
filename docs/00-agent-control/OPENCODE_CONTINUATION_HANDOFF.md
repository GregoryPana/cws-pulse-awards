# OpenCode Continuation Handoff — CWS Pulse Awards

## Purpose

Use this file to restart OpenCode cleanly after the repository documentation cleanup.

## Current state

- Local path: `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards`
- Branch: `feature/phase-0-foundation`
- Git remote: none configured yet
- Phase: Phase 0 foundation continuation
- Deployment: prohibited until Gregory approves

## Required reading order

1. `OPENCODE.md`
2. `PROJECT_START.md`
3. `AGENT_HANDOVER.md`
4. `docs/INDEX.md`
5. `docs/01-standards/internal-dev-kit/README.md`
6. `schema.sql`
7. `docs/reference/TEST_STRATEGY.md`

## Confirmed decisions

These are closed:

- T1: two Hall of Fame routes: `/charter-champions` and `/instant-impact`.
- T2/P1: Golden Ticket is as-and-when; mark → personalise → trigger.
- T7: CEO paragraph editable/personalised before each Golden Ticket trigger.
- P5: leavers remain visible permanently; no leaver workflow.
- P7: repeat wins allowed; no duplicate constraint.

## Development governance

Apply `docs/01-standards/internal-dev-kit/`:

- backend via systemd, not Docker;
- Docker Compose only for PostgreSQL and approved utility services;
- frontend static via NGINX;
- PostgreSQL 16 on host port 5433;
- Entra backend role enforcement authoritative;
- self-hosted runners for internal VM deploys;
- explicit reviewed migrations;
- complete `EXIT.md` before production handover.

## Suggested next OpenCode task

```text
You are continuing CWS Pulse Awards Phase 0.

Read OPENCODE.md, PROJECT_START.md, AGENT_HANDOVER.md, docs/INDEX.md, schema.sql, and docs/reference/TEST_STRATEGY.md.

Do not deploy, do not create a remote, do not inspect .env secret values, and do not proceed to Phase 1.

Task:
1. Inspect the current Phase 0 implementation against PROJECT_START.md success criteria.
2. Run the backend test suite if dependencies are available.
3. Identify gaps only; do not make broad changes yet.
4. Return a concise gap report grouped by: backend, database/Alembic, Docker/PDF sidecar, auth, tests, docs/handover, repo hygiene.
5. End with the Hermes Update Pack defined in .opencode/skills/hermes-update-pack/SKILL.md.
```

## Stop condition

Stop when Phase 0 has a verified gap report or when any change requires Gregory approval.
