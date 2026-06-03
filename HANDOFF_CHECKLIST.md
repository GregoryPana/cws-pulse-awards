# Handoff Checklist — Gregory to Coding Agent

Use this checklist to ensure OpenCode/Codex has everything needed before continuing Phase 0.

---

## Current handoff status

- [x] Pulse Awards product decisions confirmed.
- [x] INTERNAL DEV KIT copied into repo under `docs/01-standards/internal-dev-kit/`.
- [x] Design reference HTML moved to clean paths under `docs/03-design/reference-html/`.
- [x] OpenCode project-local rules added in `OPENCODE.md`.
- [x] Project-local OpenCode skills added under `.opencode/skills/`.
- [x] `EXIT.md` expanded into a real handover control document.
- [ ] GitHub remote still to be created/confirmed.
- [ ] Phase 0 still to be verified by Gregory.

---

## Files to provide/read

### Agent instructions

- [x] `OPENCODE.md` — project-local coding-agent operating rules
- [x] `PROJECT_START.md` — orientation, Phase 0 scope, success criteria, phase boundary
- [x] `docs/00-agent-control/OPENCODE_CONTINUATION_HANDOFF.md` — restart prompt and current context

### Technical specifications

- [x] `AGENT_HANDOVER.md` — complete spec, all confirmed decisions, all endpoints
- [x] `schema.sql` — database schema with seed data
- [x] `docker-compose.yml` — PostgreSQL + Playwright configuration
- [x] `DESIGN_SYSTEM.md` — fonts, colours, design tokens
- [x] `.env.example` — environment variable reference with explanations
- [x] `docs/reference/TEST_STRATEGY.md` — phase-based test and validation strategy

### Design references

- [x] `docs/03-design/reference-html/cws-wall-of-fame-peer.html` — Charter Champions page visual spec
- [x] `docs/03-design/reference-html/cws-wall-of-fame-manager.html` — Instant Impact page visual spec
- [x] `docs/03-design/reference-html/cws-golden-ticket-email.html` — Golden Ticket email spec
- [x] `docs/03-design/reference-html/cws-award-personalised-letter.html` — Golden Ticket PDF letter spec

### DTO standards / INTERNAL DEV KIT

- [x] `docs/01-standards/internal-dev-kit/01_PLATFORM_STANDARD.md`
- [x] `docs/01-standards/internal-dev-kit/02_CICD_AND_REPO_STANDARD.md`
- [x] `docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md`
- [x] `docs/01-standards/internal-dev-kit/04_DOCKER_COMPOSE_STANDARD.md`
- [x] `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md`
- [x] `docs/01-standards/internal-dev-kit/06_ENTRA_ID_INTEGRATION_GUIDE.md`
- [x] `docs/01-standards/internal-dev-kit/07_DEVELOPER_ONBOARDING_GUIDE.md`
- [x] `docs/01-standards/internal-dev-kit/08_OPERATIONS_AND_HANDOVER_CHECKLISTS.md`
- [x] `docs/01-standards/internal-dev-kit/EXIT_TEMPLATE.md`
- [x] `docs/01-standards/internal-dev-kit/templates/`

---

## Confirmed decisions — do not reopen

- [x] T1: Hall of Fame has two separate routes: `/charter-champions` and `/instant-impact`.
- [x] T2/P1: Golden Ticket is as-and-when admin discretion: mark → personalise → trigger.
- [x] T7: CEO closing paragraph is editable/personalised before each Golden Ticket trigger.
- [x] P5: leavers remain visible permanently; no leaver workflow.
- [x] P7: multiple wins per person per year are allowed; no duplicate constraint.

---

## Suggested prompt to OpenCode

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

---

## End-of-Phase-0 Gregory review

When the agent says Phase 0 is complete, Gregory verifies:

```bash
docker-compose up -d
curl -fsS http://127.0.0.1:8000/api/v1/health
curl -fsS http://127.0.0.1:8000/api/v1/health/ready
psql -h 127.0.0.1 -p 5433 -U pulse -d pulse_awards -c "SELECT COUNT(*) FROM config_pillars;"
cd backend && pytest --cov=app --cov-report=term-missing
```

If all pass, Phase 0 can be approved and Phase 1 can be authorised separately.
