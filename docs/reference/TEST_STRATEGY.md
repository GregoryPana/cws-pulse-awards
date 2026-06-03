# CWS Pulse Awards Test Strategy

## Purpose

This project will be validated against planned test criteria before and during implementation, not only after code is written.

The goal is to prove:
- the repository structure matches DTO standards
- the data model matches `schema.sql`
- API behavior matches `AGENT_HANDOVER.md`
- frontend design matches the provided HTML references and `DESIGN_SYSTEM.md`
- deployment behavior matches DTO SOPs

## Test Layers

### 1. Specification Conformance

These checks validate that implementation matches the agreed documents.

Sources of truth:
- `PROJECT_START.md`
- `AGENT_HANDOVER.md`
- `schema.sql`
- `DESIGN_SYSTEM.md`
- DTO SOPs 02, 03, 04, 05, 06

Required outputs:
- endpoint inventory mapped to spec
- table and seed-data inventory mapped to schema
- deployment artifact inventory mapped to SOPs
- page/component checklist mapped to design references

### 2. Unit Tests

These validate isolated behavior with mocks or stubs.

Examples:
- config loading precedence and fallback logic
- JWT validation and role enforcement
- email context generation
- PDF token generation and validation
- month filter parsing and formatting helpers
- frontend hooks and client-side auth guards

### 3. Integration Tests

These validate real cooperation between modules.

Examples:
- FastAPI route to dependency to DB session
- Alembic migration against PostgreSQL
- winner creation with seed-driven config data
- Golden Ticket trigger flow across DB, template rendering, and PDF service
- frontend API client against backend test server

### 4. Contract Tests

These lock request and response shapes to the agreed API.

Examples:
- `/api/v1/health`
- `/api/v1/health/ready`
- public winners endpoints
- admin winners endpoints
- Golden Ticket trigger endpoints
- admin config endpoints

### 5. Visual and UX Validation

These validate that the frontend matches the supplied design intent.

Examples:
- page layout against `docs/03-design/reference-html/cws-wall-of-fame-peer.html`
- page layout against `docs/03-design/reference-html/cws-wall-of-fame-manager.html`
- email HTML output against MJML-integrated placeholders
- PDF output against `docs/03-design/reference-html/cws-award-personalised-letter.html`
- responsive layout checks at mobile, tablet, and desktop widths
- visible state checks for loading, empty, error, and populated screens

### 6. Operational Smoke Tests

These validate deployable behavior on target-like environments.

Examples:
- `docker compose up -d`
- `alembic upgrade head`
- backend starts under `uvicorn`
- systemd unit runs correctly
- NGINX serves SPA and proxies API
- `verify_release.sh` passes

## Phase Gates

## Phase 0 Gate

Must pass before Phase 1 starts:
- DTO repo structure present
- `.env.example`, `.env`, `README.md`, `.gitignore`, `EXIT.md` present
- Docker Compose validates and starts PostgreSQL plus PDF sidecar
- Alembic initial migration applies cleanly
- seed data counts match spec: 8 pillars, 5 values, 6 subcategories
- backend starts and returns:
  - `GET /api/v1/health` -> 200
  - `GET /api/v1/health/ready` -> 200 or 503 depending on dependencies
- JWT validation returns:
  - 401 invalid or missing token
  - 403 valid token without role
  - 200 valid token with role

## Phase 1 Gate

Must pass before Phase 2 starts:
- page structure matches the two Hall of Fame design references
- public routes render correctly
- month filter works
- mobile responsive layout verified
- API data renders correctly for both award types

## Phase 2 Gate

Must pass before Phase 3 starts:
- admin auth guard works end to end
- winner create, edit, archive, remove flows work
- photo upload validation works
- public Hall of Fame updates correctly from new records

## Phase 3 Gate

Must pass before Phase 4 starts:
- template rendering verified
- recipients CRUD verified
- send path verified against SMTP relay or approved test double
- email preview verified

## Phase 4 Gate

Must pass before Phase 5 starts:
- Golden Ticket mark, revoke, preview, email, and PDF flows work
- Playwright sidecar returns PDF successfully
- Hall of Fame featured card updates correctly

## Phase 5 Gate

Must pass before Phase 6 starts:
- all admin-managed config can be changed without code edits
- zero hardcoded live business config remains in frontend or backend

## Test Matrix By Area

| Area | Unit | Integration | Contract | Visual | Smoke |
|---|---|---|---|---|---|
| Config | Yes | Limited | No | No | Yes |
| Auth | Yes | Yes | Yes | No | Yes |
| DB schema | No | Yes | No | No | Yes |
| Public API | Yes | Yes | Yes | No | Yes |
| Admin API | Yes | Yes | Yes | No | Yes |
| Frontend public pages | Yes | Yes | Indirect | Yes | Yes |
| Frontend admin pages | Yes | Yes | Indirect | Yes | Yes |
| Email | Yes | Yes | Limited | Yes | Yes |
| PDF | Yes | Yes | Limited | Yes | Yes |
| Deployment | No | Limited | No | No | Yes |

## Planned Tooling

### Backend
- `pytest`
- `pytest-asyncio`
- `pytest-cov`
- FastAPI `TestClient`
- direct DB verification through SQLAlchemy and PostgreSQL

### Frontend
- Vitest
- React Testing Library
- Playwright browser tests
- visual snapshot comparison for key routes and states

### Infrastructure and Release
- Docker Compose validation
- Alembic migration checks
- shell smoke checks in `scripts/linux/verify_release.sh`

## Minimum Test Inventory Before Each Phase Build

Before implementing a phase, define:
- acceptance checklist from the handover spec
- API contracts affected
- fixtures or seed data needed
- happy path tests
- validation and permission failure tests
- responsive or visual states affected
- smoke checks required after deploy

## Immediate Next Additions

To improve Phase 0 confidence, add next:
- migration application test against running PostgreSQL
- seed-data verification test
- `/api/v1/auth/admin-check` endpoint tests for 401, 403, 200
- PDF sidecar health and generate endpoint tests
- systemd template presence and command sanity check
