# CWS Pulse Awards — Agent Phase 0 Startup

**From:** Gregory, DTO Lead
**To:** AI Coding Agent (OpenCode Codex)
**Status:** All decisions resolved. Phase 0 continuation-ready.
**Phase Duration:** ~3-5 days of focused work
**Current governance snapshot:** `docs/01-standards/internal-dev-kit/`

---

## What You Are Building

CWS Pulse Awards is an internal staff recognition platform. You are building the **backend service, database schema, and deployment infrastructure** for Phase 0 only.

**Phase 0 scope: Foundation layer only.** Do not proceed past Phase 0 without Gregory reviewing the running service.

---

## Your Reading Order

1. **Read this file first** — orientation and constraints
2. **AGENT_HANDOVER.md** — your complete technical specification (read in full, refer back constantly)
3. **schema.sql** — database schema (read to understand data model)
4. **DESIGN_SYSTEM.md** — design tokens and component patterns (reference during frontend work)
5. **SOP documents** — DTO standards (reference as needed per the handover document)
6. **HTML design files** — visual specifications (reference during frontend build)

Do not skip steps. Do not assume defaults.

---

## Phase 0 Scope

Your job is to build and get running:

### A. Docker Compose
- PostgreSQL 16 listening on host port 5433
- Playwright sidecar listening on localhost:8001
- Both services healthy and responding to health checks

**Deliverable:** `docker-compose up -d` starts both services. Both health checks pass.

### B. FastAPI Backend (runs via systemd, not in Docker)
- Skeleton app structure per `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md` section 3
- Directory structure: `app/api/`, `app/core/`, `app/models/`, `app/schemas/`, `app/services/`
- Database connectivity via SQLAlchemy async to PostgreSQL on localhost:5433
- Entra ID JWT validation (python-jose)
- Health endpoints:
  - `GET /api/v1/health` → returns 200 + `{"status": "ok"}`
  - `GET /api/v1/health/ready` → checks DB and SMTP reachability, returns 200 or 503
- Email service stub (logs to console, does not send)
- PDF service stub (returns placeholder PDF from Playwright sidecar)
- Seed data loaded: 8 pillars, 5 values, 6 subcategories, config settings defaults

**Deliverable:** Backend service starts via `uvicorn`, responds to both health endpoints with 200. Seed data queryable.

### C. Database Schema
- Complete schema per `schema.sql`
- All tables created
- Alembic migration setup (initial migration with full schema)
- Seed data inserted
- Triggers and indexes created

**Deliverable:** `alembic upgrade head` initialises the database. `psql` queries confirm seed data present.

### D. systemd Unit File
- Service file: `backend/pulse-awards.service`
- Runs FastAPI app on 127.0.0.1:8000
- Reads environment from `/opt/pulse-awards/.env`
- Restarts on failure

**Deliverable:** `systemctl start pulse-awards` starts the service successfully.

### E. Environment Setup
- `.env.example` filled in with placeholders
- Local development `.env` created (safe defaults for running locally)
- `.gitignore` created (per DTO standard)
- `README.md` created (basic orientation)

**Deliverable:** Developer can clone, copy `.env.example` to `.env`, run the app locally.

### F. Repository Structure
- Follows `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md` exactly
- `backend/`, `frontend/`, `scripts/linux/`, `docs/`, `.github/workflows/` all present
- Python code is type-hinted (type hints, docstrings)
- All DTO-standard folders in place (even if some are empty placeholders)

**Deliverable:** `git init`, add all files, repo structure is immediately recognisable as a DTO standard app.

---

## What Phase 0 Is NOT

- No frontend code (starts Phase 1)
- No NGINX setup (starts Phase 1)
- No award entry API endpoints (starts Phase 2)
- No email sending (starts Phase 3)
- No Golden Ticket flow (starts Phase 4)
- No admin configuration UI (starts Phase 5)

Phase 0 is **infrastructure and data model only**. The goal is a running PostgreSQL database and a responsive FastAPI health endpoint.

---

## Constraints and Rules

### Code Quality
- All Python code: type hints on all functions and parameters
- All functions have docstrings
- Use async/await for all I/O (database, HTTP calls)
- No magic strings — configuration via environment variables
- Follow PEP 8 (isort + black formatting recommended)

### Architecture Rules (SOP-compliant)
- Backend runs via **systemd**, not Docker (Docker is for DB + Playwright only)
- Database password from environment variable (not hardcoded)
- Entra ID JWT validation uses JWKS discovery (handle blank ENTRA_JWKS_URL gracefully)
- All config values from `config_settings` table or environment variables — zero hardcoding
- Email service accepts template name + context dict — no hardcoded email content

### Testing
- Write tests for:
  - JWT validation (valid token, invalid token, missing role, expired token)
  - Database connectivity (health check when DB is up, when DB is down)
  - Config loading (env vars override defaults)
- Minimum coverage: 70% of business logic
- Tests run during CI (GitHub Actions hosted runner)

### Git Discipline
- Commit frequently with clear messages
- Branch: `feature/phase-0-foundation`
- All commits to main should include passing tests and phase completion checklist

---

## Success Criteria for Phase 0

Check all boxes before telling Gregory it is complete:

- [ ] PostgreSQL running on localhost:5433 with seed data
- [ ] Playwright sidecar running on localhost:8001
- [ ] FastAPI backend starts via `systemctl start pulse-awards`
- [ ] `GET /api/v1/health` returns 200 + OK
- [ ] `GET /api/v1/health/ready` returns 200 + ready (or 503 if DB/SMTP down)
- [ ] Entra ID JWT validation rejects tokens without `CWS-Pulse-Admin` role (403)
- [ ] Entra ID JWT validation accepts tokens with role (200)
- [ ] Database schema complete with all tables, indexes, triggers
- [ ] Seed data: 8 pillars + 5 values + 6 subcategories + config settings
- [ ] Repository structure matches `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md`
- [ ] All code type-hinted and documented
- [ ] `.env.example` has all required variables with safe placeholders
- [ ] README.md exists and explains the project
- [ ] `docker-compose.yml` creates PostgreSQL (5433) + Playwright (8001)
- [ ] `alembic.ini` and initial migration created
- [ ] systemd unit file template in `backend/pulse-awards.service`
- [ ] Tests pass (70%+ coverage)
- [ ] No secrets in code or repo
- [ ] `.gitignore` created
- [ ] Ready for Phase 1 frontend work

---

## How to Ask for Help

If you get stuck:

1. **Check AGENT_HANDOVER.md first** — it is comprehensive and answers most questions
2. **Check the relevant SOP document** — DTO standards govern deployment patterns
3. **Check the design reference HTML files** — they show exactly what the frontend should look like
4. **If still stuck:** Gregory will review at phase boundaries and can answer clarifications

Do not guess or make assumptions. If something is unclear, ask Gregory to clarify in writing before proceeding.

---

## Gregory's Review Point

When you believe Phase 0 is complete:

1. Push branch to GitHub (`feature/phase-0-foundation`)
2. Create a pull request with Phase 0 completion checklist
3. Gregory reviews and runs the Phase 0 verification:
   - `docker-compose up -d` — services start
   - `curl http://127.0.0.1:8000/api/v1/health` — responds 200
   - `curl http://127.0.0.1:8000/api/v1/health/ready` — responds 200 or 503
   - `systemctl status pulse-awards` — service running
   - Database query confirms seed data present
4. If all pass: Phase 0 is approved, merge to main, Phase 1 begins
5. If issues: Gregory provides feedback, you iterate Phase 0

**Do not proceed to Phase 1 without explicit approval.**

---

## Key Contacts and References

- **Technical authority:** Gregory (DTO Lead) — clarifications, architecture decisions
- **Programme owner:** Maria Pouponneau (CCCO) — business rules, award criteria
- **Authoritative specs:** AGENT_HANDOVER.md (supersedes everything)
- **DTO standards:** SOP documents (mandatory compliance)

---

## Tone and Approach

- **Be thorough:** Phase 0 is the foundation. Get it right before moving forward.
- **Be structured:** Follow the directory structure, naming conventions, and SOP patterns exactly.
- **Be documented:** Your Phase 0 code should be easy for the next developer to understand.
- **Be tested:** Do not skip testing just because it is Phase 0. Tests catch bugs early.
- **Be honest:** If something does not make sense, say so. Do not guess.

---

## Start Now

1. Read AGENT_HANDOVER.md in full
2. Create the repo structure per `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md`
3. Copy schema.sql into `backend/alembic/versions/001_initial_schema.py` as an Alembic migration
4. Create `docker-compose.yml` — copy and understand the provided version
5. Create `backend/app/main.py` — start with the health endpoints
6. Create core modules: `config.py`, `database.py`, `auth.py`, `dependencies.py`
7. Create the systemd unit file template
8. Test locally: Docker, FastAPI, database connectivity, health checks
9. Commit frequently
10. When all Phase 0 checklist items are done, push the PR

Good luck. You have all the information you need. Gregory will review at phase completion.

---

*End of Phase 0 Startup Instructions*
