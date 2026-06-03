# Hermes Single-Project Handoff Pack

## 1. Project Identity
- Project name: `CWS Pulse Awards`
- Business purpose: Internal staff recognition platform for Cable & Wireless Seychelles, with a public internal Hall of Fame plus restricted admin entry/configuration workflows.
- Current status: development
- Is this currently used by real users? no
- Owner: Gregory, Digital Transformation Office, Cable & Wireless Seychelles
- Main stakeholders/users:
  - Gregory / DTO
  - Maria Pouponneau / CCCO
  - P&C admin users
  - Internal CWS staff viewing Hall of Fame pages
- Business criticality: medium internal business app

## 2. Project Access
- Current local project root path: `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards`
- Windows path if detectable: `C:\Users\gpanagary\.gemini\antigravity\scratch\pulse-awards`
- WSL/Linux path if detectable: `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards`
- GitHub repo URL: unknown, no remote configured
- Git remote(s): none configured
- Default branch: unknown
- Current branch: `feature/phase-0-foundation`
- Main active development branch: `feature/phase-0-foundation`
- Is working tree clean? no
- Any uncommitted changes? yes
  - Entire repo is still uncommitted
  - Includes Phase 0 backend, Alembic, Docker Compose, docs, tests, placeholders
  - Includes local runtime files such as `.env` and a stray untracked file `session-ses_19be.md`

## 3. Hermes Permissions Recommendation
Recommend what Hermes should be allowed to do for this repo:
- read only: yes
- create branches: yes
- make commits: yes, after review
- open PRs: no, not until remote exists
- run tests: yes
- run local app: yes
- modify deployment config: yes, with review
- deploy staging: no
- deploy production: no

Also state what Hermes must not touch without explicit approval.
- Must not commit `.env` or any local secret-bearing env file
- Must not alter production/staging credentials or Entra settings without explicit approval
- Must not deploy to any VM
- Must not assume frontend implementation details that are not yet built
- Must not remove or rewrite authoritative spec docs without explicit approval

## 4. Architecture Summary
- frontend:
  - Planned React/Vite SPA in `frontend/app/`
  - Not implemented yet
  - Placeholder folder structure only
- backend:
  - FastAPI app in `backend/app/`
  - Currently only Phase 0 endpoints implemented:
    - `GET /api/v1/health`
    - `GET /api/v1/health/ready`
    - `GET /api/v1/auth/admin-check`
- database:
  - PostgreSQL 16 in Docker Compose on host port `5433`
  - Alembic migration creates schema, triggers, indexes, seed data
- auth/access control:
  - Entra ID bearer JWT validation via `python-jose`
  - JWKS discovery with fallback URL derivation from tenant ID
  - Admin role enforced as `CWS-Pulse-Admin`
- APIs:
  - Public/admin API surface is mostly planned in spec, not yet implemented
  - Only health and admin JWT wiring endpoint exist now
- background jobs/schedulers:
  - None implemented
  - APScheduler is mentioned in handover spec but not present in current code
- file storage:
  - Planned local filesystem storage for photos at `PHOTO_STORAGE_PATH`
  - Not implemented yet
- external integrations:
  - Entra ID JWKS discovery
  - SMTP reachability check
  - Playwright PDF sidecar over HTTP
- deployment model:
  - Backend: systemd on host
  - Database: Docker Compose
  - PDF sidecar: Docker Compose
  - Frontend: planned static files via host NGINX
  - CI/CD: not implemented yet

## 5. Tech Stack
- frontend framework: planned React 18 + TypeScript + Vite, not yet implemented
- backend framework: FastAPI
- language/runtime: Python 3.12
- database: PostgreSQL 16
- ORM/query layer: SQLAlchemy 2 async, Alembic
- package manager:
  - Python: `pip` / `requirements.txt`
  - Frontend: unknown, not yet present
- build tool:
  - Backend: none beyond Python runtime
  - Frontend: planned Vite, not yet present
- test framework: `pytest`, `pytest-asyncio`, `pytest-cov`
- lint/typecheck tools: none detected yet
- deployment provider: host VM with systemd + Docker Compose + planned NGINX
- CI/CD: not implemented, `.github/workflows/` only contains `.gitkeep`

## 6. Folder Structure
Important folders and files:

- `backend/`
  - Main FastAPI service
  - Contains app code, Alembic, tests, requirements, systemd unit
- `backend/app/`
  - Python source root
- `backend/app/api/`
  - Route modules
  - Only placeholders except auth-check route exposed through `main.py`
- `backend/app/core/`
  - Settings, auth, DB, dependencies
- `backend/app/models/`
  - SQLAlchemy ORM models for Phase 0 schema
- `backend/app/schemas/`
  - Placeholder schema modules, not implemented
- `backend/app/services/`
  - Email stub, PDF sidecar client stub, storage placeholder
- `backend/app/templates/emails/`
  - MJML placeholder HTML stubs
- `backend/alembic/`
  - Alembic environment and migration versions
- `backend/alembic/versions/001_initial_schema.py`
  - Full initial schema + seed data
- `backend/tests/`
  - Phase 0 backend test suite
- `frontend/app/`
  - Placeholder SPA structure only
  - No actual frontend app code yet
- `pdf_service/`
  - Separate FastAPI microservice returning placeholder PDFs
  - Has Dockerfile and requirements
- `scripts/linux/`
  - Placeholder only, scripts not yet written
- `docs/`
  - Minimal docs index and test strategy
- `.github/workflows/`
  - Placeholder only
- `docker-compose.yml`
  - Postgres + Playwright sidecar services
- `README.md`
  - Basic repo orientation
- `EXIT.md`
  - Present but mostly empty
- Spec/reference files at repo root:
  - `PROJECT_START.md`
  - `AGENT_HANDOVER.md`
  - `schema.sql`
  - `DESIGN_SYSTEM.md`
  - DTO SOP docs
  - HTML reference designs

## 7. Key Files Hermes Should Read First
1. `AGENT_HANDOVER.md`
   - Why: authoritative build specification
   - Controls: overall architecture, scope, endpoints, phases
2. `PROJECT_START.md`
   - Why: Phase 0 goals and success criteria
   - Controls: what must be complete before moving on
3. `backend/app/main.py`
   - Why: current live FastAPI surface
   - Controls: health, readiness, auth-check endpoints
4. `backend/app/core/config.py`
   - Why: environment/config loading behavior
   - Controls: env precedence, URLs, auth and runtime settings
5. `backend/app/core/auth.py`
   - Why: JWT validation and role enforcement
   - Controls: Entra token handling
6. `backend/app/core/database.py`
   - Why: DB engine/session behavior
   - Controls: runtime database connectivity
7. `backend/alembic/env.py`
   - Why: migration runtime configuration
   - Controls: sync Alembic connection behavior
8. `backend/alembic/versions/001_initial_schema.py`
   - Why: actual DB schema and seed implementation
   - Controls: tables, indexes, triggers, seed data
9. `schema.sql`
   - Why: original schema reference
   - Controls: expected data model
10. `docker-compose.yml`
   - Why: local/runtime infra definition
   - Controls: Postgres and PDF sidecar containers
11. `pdf_service/pdf_service.py`
   - Why: current PDF sidecar behavior
   - Controls: `/health` and `/generate`
12. `backend/pulse-awards.service`
   - Why: target deployment service unit
   - Controls: host runtime command and env path
13. `backend/requirements.txt`
   - Why: backend dependency list
   - Controls: install/runtime package set
14. `backend/tests/`
   - Why: current validated behavior
   - Controls: current confidence boundary
15. `docs/reference/TEST_STRATEGY.md`
   - Why: planned validation approach by phase
   - Controls: intended test gates and next test additions
16. `.env.example`
   - Why: env contract
   - Controls: required configuration names
17. `README.md`
   - Why: concise orientation
   - Controls: high-level structure summary
18. `EXIT.md`
   - Why: handover target doc, currently incomplete
   - Controls: future operational handoff content

## 8. Development Commands
Exact commands known:

- install dependencies:
  - Windows PowerShell from `backend/`:
    - `py -3.12 -m venv .venv`
    - `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
- run locally:
  - Start infra from repo root:
    - `docker compose up -d`
  - Start backend from `backend/`:
    - `.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- run backend:
  - `.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- run frontend: unknown, frontend not implemented
- run database:
  - `docker compose up -d`
- run migrations:
  - From `backend/`:
    - `.\.venv\Scripts\python.exe -m alembic upgrade head`
- seed database:
  - included inside initial Alembic migration
- run tests:
  - From `backend/`:
    - `.\.venv\Scripts\python.exe -m pytest --cov=app --cov-report=term-missing`
- run lint: unknown
- run typecheck: unknown
- build: unknown
- preview production build: unknown
- deploy staging: unknown, not implemented
- deploy production: unknown, not implemented

Notes:
- In this environment, Windows PowerShell/CMD was more reliable than native WSL because WSL lacks `python3-venv` and `pip`.

## 9. Environment Variables
Env files present:
- `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards/.env`
- `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards/.env.example`

Env example files present:
- `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards/.env.example`

Variable names only:

| Variable | Purpose | Local/Staging/Prod | Where configured | Example exists |
|---|---|---|---|---|
| `APP_ENV` | runtime environment label | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `APP_SECRET_KEY` | app secret key | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `APP_VERSION` | app version override | optional | `config.py` | no |
| `DB_PASSWORD` | Postgres container password | local/staging/prod | `.env`, `.env.example`, `docker-compose.yml` | yes |
| `DATABASE_URL` | backend DB connection | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_TENANT_ID` | Entra tenant ID | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_CLIENT_ID` | Entra app client ID | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_AUTHORITY` | Entra authority URL | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_ISSUER` | JWT issuer | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_AUDIENCE` | JWT audience | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `ENTRA_JWKS_URL` | optional JWKS override | optional | `.env`, `.env.example`, `config.py` | yes |
| `ADMIN_ROLE` | required admin role | optional | `config.py` | no |
| `SMTP_HOST` | SMTP reachability target | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `SMTP_PORT` | SMTP port | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `SMTP_TIMEOUT_SECONDS` | readiness timeout | optional | `config.py` | no |
| `SMTP_FROM` | sender address | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `PHOTO_STORAGE_PATH` | local photo storage path | staging/prod, local optional | `.env`, `.env.example`, `config.py` | yes |
| `PDF_SERVICE_URL` | PDF sidecar base URL | local/staging/prod | `.env`, `.env.example`, `config.py` | yes |
| `VITE_API_BASE_URL` | frontend API base URL | frontend build env | `.env`, `.env.example` | yes |
| `VITE_APP_URL` | frontend SPA base URL | frontend build env | `.env`, `.env.example` | yes |
| `VITE_ENTRA_CLIENT_ID` | frontend Entra client ID | frontend build env | `.env`, `.env.example` | yes |
| `VITE_ENTRA_TENANT_ID` | frontend Entra tenant ID | frontend build env | `.env`, `.env.example` | yes |
| `VITE_ENTRA_AUTHORITY` | frontend Entra authority | frontend build env | `.env`, `.env.example` | yes |
| `VITE_ENTRA_API_SCOPE` | frontend API scope | frontend build env | `.env`, `.env.example` | yes |

GitHub Actions secrets referenced by name only:
- None currently referenced in workflow files because workflows are not implemented
- Specs mention likely future names:
  - `STAGING_HOST`
  - `STAGING_PATH`
  - `STAGING_BASE_URL`
  - `STAGING_SSH_KEY`
  - `STAGING_USER`
  - `PRODUCTION_HOST`
  - `PRODUCTION_PATH`
  - `PRODUCTION_BASE_URL`
  - `PRODUCTION_SSH_KEY`
  - `PRODUCTION_USER`

## 10. Database / Data Model
- database type: PostgreSQL 16
- schema/model location:
  - reference SQL: `schema.sql`
  - ORM models: `backend/app/models/`
- migrations location:
  - `backend/alembic/`
  - `backend/alembic/versions/001_initial_schema.py`
- key tables/entities/models:
  - `winners`
  - `config_pillars`
  - `config_values`
  - `config_subcategories`
  - `config_settings`
  - `email_recipients`
- seed data:
  - 8 pillars
  - 5 values
  - 6 subcategories
  - 11 config settings
- local database setup:
  - Docker Compose Postgres on `127.0.0.1:5433`
  - run migration with Alembic
- staging/prod assumptions:
  - Docker Compose still used for Postgres on host VM
  - backend connects to `127.0.0.1:5433`
- backup/rollback assumptions if known:
  - backup process is not implemented
  - Compose file comments mention `pg_dump` procedure should be documented in `EXIT.md`
  - downgrade exists in migration but broader rollback process is undocumented

## 11. Auth and Access Control
- auth method:
  - Bearer JWT
  - Microsoft Entra ID validation through JWKS
- user roles:
  - `CWS-Pulse-Admin`
- admin access:
  - `require_admin_claims` dependency validates token and role
- protected routes:
  - currently only `GET /api/v1/auth/admin-check`
- token/session/JWT handling:
  - settings derive JWKS URL from tenant if blank
  - `validate_jwt()` checks header, signing key, audience, issuer, expiry
  - `require_role()` enforces admin role
- CORS/CSRF if relevant:
  - no explicit CORS configuration yet
  - no CSRF layer, which is acceptable for bearer-token APIs but needs consideration when frontend is built
- known auth risks:
  - positive live-role path is only covered by tests, not verified against a real Entra tenant locally
  - no broader admin route coverage yet because most admin endpoints are not implemented
  - no rate limiting or abuse throttling

## 12. API Surface
Current implemented API:
- `GET /api/v1/health`
- `GET /api/v1/health/ready`
- `GET /api/v1/auth/admin-check`

Route files:
- actual app entry: `backend/app/main.py`
- planned route modules:
  - `backend/app/api/public.py`
  - `backend/app/api/admin_winners.py`
  - `backend/app/api/admin_golden_ticket.py`
  - `backend/app/api/admin_config.py`
  - `backend/app/api/auth.py`
- these route files are placeholders today

OpenAPI/Swagger availability:
- FastAPI default docs should be available unless disabled
- likely `/docs` and `/openapi.json`

Validation method:
- FastAPI + Pydantic models where implemented
- current sidecar uses `GenerateRequest` Pydantic model
- backend schema modules are mostly placeholders

Error handling pattern:
- FastAPI default JSON responses
- `HTTPException` for auth failures
- readiness endpoint maps dependency failures to `503`

Request/response conventions:
- JSON responses for API endpoints
- health returns simple status/version object
- readiness returns dependency status object
- PDF sidecar returns `application/pdf`

## 13. CI/CD and Deployment
- GitHub Actions workflows:
  - none implemented
  - `.github/workflows/` contains only `.gitkeep`
- deployment provider:
  - host VM
- staging environment:
  - described in specs, not configured in repo
- production environment:
  - described in specs, not configured in repo
- branch-to-environment mapping:
  - intended via manual workflows, not implemented
- deployment triggers:
  - none implemented
- required secrets by name only:
  - none in repo workflows
  - future names are documented in specs
- rollback method if known:
  - not implemented
  - Alembic downgrade exists, but no release rollback scripts exist yet

## 14. Current State of Build
What is complete:
- DTO repo structure scaffold
- root docs placeholders
- Docker Compose for Postgres and PDF sidecar
- backend core settings/auth/database modules
- health/readiness endpoints
- admin JWT wiring check endpoint
- Alembic setup and initial migration
- seed data load
- systemd service template
- placeholder PDF sidecar service
- backend automated tests
- test strategy doc
- local runtime verification succeeded on Windows host
- coverage is strong: `96%`

What is partially complete:
- backend architecture skeleton exists, but most business endpoints are not implemented
- auth implementation exists, but only one protected endpoint uses it
- email/PDF are stubs, not production implementations
- docs exist, but are minimal
- frontend structure exists, but not the app

What is not started:
- frontend implementation
- public winner endpoints
- admin CRUD endpoints
- photo upload/storage behavior
- recipient management
- Golden Ticket workflows
- GitHub Actions workflows
- deploy scripts under `scripts/linux/`
- NGINX config templates in repo
- operational docs / runbooks / backup docs

Known bugs:
- none observed in currently implemented Phase 0 runtime path

Known TODOs:
- finish Phase 0 handoff docs
- add deploy scripts
- add missing API surfaces
- implement real Playwright PDF generation
- implement real email send path
- implement frontend

Unfinished features:
- almost all Phase 1+ functionality
- most Phase 0 beyond infrastructure skeleton is still intentionally unbuilt

Risky shortcuts:
- PDF sidecar returns a placeholder PDF, not rendered Playwright output
- email service only logs payloads
- migration is a large raw SQL blob in one revision, which works but is harder to maintain
- frontend is represented only by placeholders

Current blockers:
- no repo remote configured
- no CI/CD files
- no frontend
- no Linux VM systemd verification yet
- `EXIT.md` is far from complete

## 15. Documentation / EXIT.md Readiness
- README exists? yes
- EXIT.md exists? yes
- docs folder exists? yes
- deployment docs exist? partially, placeholders only
- API docs exist? partially, via spec docs and FastAPI defaults, not dedicated repo docs
- troubleshooting docs exist? no

If EXIT.md exists, assess whether it is complete.
- `EXIT.md` is not complete
- It is only a placeholder with a brief status note

If missing, propose what it must contain.
`EXIT.md` must still contain at minimum:
- architecture overview and diagram
- all environment variables
- database schema summary
- API route reference
- systemd operations
- deployment steps
- Entra registration record
- operational runbooks
- known issues/tech debt
- backup/restore procedure
- NGINX config location and reload steps

## 16. Production Readiness
- production-ready? no
- safe for internal use? partially
- safe for external/public use? no
- top risks before broader use:
  - no frontend
  - business/admin endpoints not implemented
  - placeholder PDF service
  - email stub only
  - no CI/CD
  - no systemd deployment verification on Linux target
  - incomplete operational documentation
- minimum fixes before production:
  - implement all remaining Phase 0 operational artifacts
  - complete frontend and public/admin APIs
  - replace stubs with real email/PDF behavior
  - create deploy scripts and workflows
  - complete `EXIT.md`
  - verify on target Linux VM with systemd and NGINX

## 17. Security Review
Do not reveal secrets.

Issues found:

1. Local `.env` file present
- file/path: `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards/.env`
- severity: medium
- recommendation: keep ignored, never commit, consider local-only template regeneration if sharing workspace

2. Weak default secret fallback in code
- file/path: `backend/app/core/config.py`
- severity: medium
- recommendation: fail hard outside local/dev if `APP_SECRET_KEY` is unset instead of using a weak default

3. Email stub logs full context payload
- file/path: `backend/app/services/email_service.py`
- severity: medium
- recommendation: avoid logging full winner context in non-dev environments; log template name and recipient count only

4. No explicit rate limiting
- file/path: backend API overall
- severity: medium
- recommendation: add throttling or upstream controls before broad internal rollout

5. No explicit CORS policy yet
- file/path: backend app overall
- severity: low
- recommendation: define explicit allowed origins when frontend is introduced

6. No backup implementation documented in repo
- file/path: repo/docs/EXIT process
- severity: medium
- recommendation: document and script Postgres/photo backup and restore before production

7. No CI/CD policy enforcement in repo
- file/path: `.github/workflows/`
- severity: low
- recommendation: add CI before team scaling to reduce drift and accidental regressions

8. Auth scope only lightly exercised in runtime
- file/path: `backend/app/main.py`, `backend/app/core/auth.py`
- severity: low
- recommendation: add explicit protected admin endpoints and integration tests for 401/403/200 behavior

No obvious committed secrets were surfaced in tracked repo files from the inspected content, but the local `.env` file exists in the workspace and must remain uncommitted.

## 18. Recommended Hermes Mode
- full orchestration with deployment prohibited

Why:
- The repo is in active development and still needs meaningful implementation, review, tests, and docs work
- Hermes can safely read, modify code, add tests, and prepare branches/commits
- Deployment should remain prohibited because no staging/prod pipeline is configured and systemd/NGINX target deployment is not yet verified

## 19. Immediate Next Actions for Hermes
1. Complete `EXIT.md` using current verified Phase 0 state.
2. Add `scripts/linux/` deploy and verification scripts defined in the handover spec.
3. Add backend tests for `/api/v1/auth/admin-check` covering 401/403/200 at the route level.
4. Add integration tests that run migration + seed assertions automatically against local Postgres.
5. Implement NGINX config template under docs per spec.
6. Replace placeholder `pdf_service` with actual Playwright-backed rendering when Phase 4 work begins.
7. Implement the missing public API endpoints for winners/config in Phase 1/2 order.
8. Create initial GitHub Actions CI workflow for backend tests once a remote repo exists.
9. Review and tighten logging so no sensitive winner data is emitted in non-dev environments.
10. Clean local workspace hygiene:
   - keep `.env` ignored
   - decide whether `session-ses_19be.md` belongs in repo or should be removed/ignored

## 20. Concise Memory Summary
- This project is `CWS Pulse Awards`, an internal staff recognition platform for Cable & Wireless Seychelles.
- It lives at `/mnt/c/Users/gpanagary/.gemini/antigravity/scratch/pulse-awards` with Windows path `C:\Users\gpanagary\.gemini\antigravity\scratch\pulse-awards`.
- Repo URL is unknown because no git remote is configured.
- Current status is active development on `feature/phase-0-foundation`; nothing is committed yet.
- Local deployment works on Windows with Docker Desktop plus a Windows Python venv.
- Stack is FastAPI, SQLAlchemy async, Alembic, PostgreSQL 16, and a small FastAPI PDF sidecar.
- Phase 0 infrastructure is mostly working and verified; frontend and most business endpoints are not built.
- Key risks are incomplete docs, no CI/CD, placeholder PDF/email behavior, no Linux systemd verification, and missing later-phase functionality.
- Hermes should help with docs completion, deploy scripts, route/integration tests, and the next implementation phases, but should not deploy anywhere yet.
