# Agent Operating Guide — CWS Pulse Awards

This repository is the CWS Pulse Awards internal recognition platform. It contains a FastAPI backend, a React/TypeScript admin/public frontend, PostgreSQL 16 schema/migrations, email templates, and handoff/standards documentation.

## Mandatory reading order

1. `OPENCODE.md` — project-local agent rules and confirmed product decisions.
2. `PROJECT_START.md` — original scope, phase boundaries, and non-goals.
3. `AGENT_HANDOVER.md` — current handover state and review notes.
4. `DESIGN_SYSTEM.md` — public UI and email visual conventions.
5. `docs/INDEX.md` and `docs/reference/TEST_STRATEGY.md` — documentation map and test strategy.
6. `schema.sql` and `backend/alembic/versions/` — database contract.

## Current architecture

- Backend: FastAPI under `backend/app/`.
- Frontend: React/TypeScript/Vite under `frontend/app/`.
- Database: PostgreSQL 16; local Docker Compose uses host port `5433`.
- Auth: Entra ID claims enforced in the backend; frontend checks are convenience only.
- Emails: Jinja2 HTML templates under `backend/app/templates/emails/`, rendered by `backend/app/services/email_renderer.py` and sent by `backend/app/services/email_service.py`.
- Golden Ticket flow: existing winner record → mark/personalise → preview → send.

## CodeGraph usage

CodeGraph is already initialized for this repo. Before broad source discovery, use the repo-local graph:

```bash
codegraph status
codegraph query email
codegraph query golden
codegraph files
```

The index directory `.codegraph/` is local-only and must not be committed. For Windows-side indexing use `.codegraph-win/` rather than sharing the WSL SQLite index.

## Email template routing

- `CHARTER_CHAMPION` routes to `award_charter_champion.html` and represents peer-to-peer recognition.
- `INSTANT_IMPACT` routes to `award_instant_impact.html` and represents manager-to-staff recognition.
- Golden Ticket uses `golden_ticket.html` regardless of the original award type, with the original award label included in the rendered context.

When editing email templates, keep them table-based and inline-CSS friendly for email clients. Do not introduce external fonts, scripts, or web-only CSS dependencies.

## Golden Ticket admin behavior

A past saved winner can be selected from the admin Winner Directory and prepared for Golden Ticket. The backend intentionally does not restrict Golden Ticket marking by award month/year/status; selection is an admin-discretion process.

## Verification commands

Run changed-area tests at minimum:

```bash
cd backend
pytest tests/test_email_renderer.py tests/test_admin_winners_api.py tests/test_admin_golden_ticket_api.py
```

Frontend verification:

```bash
cd frontend/app
npm run typecheck
npm run build
```

Before handing off, also run `git status --short` and summarize only verified outputs.

## Safety rules

- Do not read or print `.env` secrets.
- Do not deploy, push, force-push, or alter CI/CD without Gregory's explicit approval.
- Do not run destructive database commands.
- Keep changes narrow and covered by tests.
- Update docs when behavior, template routing, or agent workflow changes.

## Design skills and UI guidance

Before substantial frontend/UI work, read `docs/AGENT_DESIGN_SKILLS.md` and the project `DESIGN.md` / `DESIGN_SYSTEM.md` if present. Hermes decides the specific design-skill bundle for each task; do not load every design skill by default. For implemented UI, run available build/lint/type checks and provide browser/responsive/console verification before claiming completion.



## Project flow mapping

Before substantial redesign, migration, architecture change, cross-cutting implementation, audit, handover, or deployment planning, read `docs/agent-skills/project-flow-mapping/SKILL.md`. Use it to map the applicable user, administrator, system, data, state, integration, failure/recovery, operational, delivery, and manual flows from repository evidence. Do not require a full remap for a small, bounded change when a current flow map already covers the affected area; update only the impacted slice. Start read-only and do not convert discovered gaps into implementation scope without owner approval.
