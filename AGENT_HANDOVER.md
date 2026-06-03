# CWS Pulse Awards — Agent Build Handover
**Document Type:** Authoritative Build Specification for AI Coding Agent
**Owner:** Gregory, Digital Transformation Office, Cable & Wireless Seychelles
**Status:** All decisions resolved. SOP-compliant. Phase 0 continuation-ready.
**Last Updated:** 2026-06-02 documentation/workspace cleanup
**Current governance snapshot:** `docs/01-standards/internal-dev-kit/`

---

## READ THIS FIRST

This document is the single source of truth for building the CWS Pulse Awards platform. All decisions have been made and confirmed by the programme owner (CCCO) and the DTO lead. All architecture and deployment patterns conform to the DTO standard operating procedures (SOPs):

- `docs/01-standards/internal-dev-kit/02_CICD_AND_REPO_STANDARD.md`
- `docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md`
- `docs/01-standards/internal-dev-kit/04_DOCKER_COMPOSE_STANDARD.md`
- `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md`
- `docs/01-standards/internal-dev-kit/06_ENTRA_ID_INTEGRATION_GUIDE.md`

Where this document conflicts with a SOP, the SOP wins. Where this document is more specific than a SOP, this document wins.

Read this document in full before writing any code. Refer back to it at every phase boundary.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Platform name | CWS Pulse Awards |
| Repo name | `cws-pulse-awards` (private, GitHub, DTO org) |
| Organisation | Cable & Wireless Seychelles (CWS) |
| Internal URL | `https://pulse.cwsey.com` (internal network only) |
| Deploy path on VM | `/opt/pulse-awards/` |
| Programme owner | Maria Pouponneau, Chief Customer Centric Officer (CCCO) |
| DTO lead / technical owner | Gregory, Digital Transformation Office |
| Programme launch | June 2026 |

---

## 2. What You Are Building

The CWS Pulse Awards platform is an **entry and display system** for an internal staff recognition programme. It has exactly three components:

### Component 1: Digital Hall of Fame (Public)
Two public-facing page routes — one per award type — displaying all approved award winners by month. No login required. Accessible on the internal CWS network.

- `/charter-champions` — Charter Champion (Peer-to-Peer) winners
- `/instant-impact` — Instant Impact (Manager-to-Staff) winners

### Component 2: Admin Entry Interface (Restricted)
Restricted admin routes where authorised P&C staff manually enter approved winners after offline vetting. The platform has no nomination form — it is entry and display only.

- `/admin/entry` — New winner entry form
- `/admin/winners` — All winners list with edit/archive/remove
- `/admin/golden-ticket` — Golden Ticket management
- `/admin/config` — Configuration panel

### Component 3: Golden Ticket Selection and Output (Restricted)
Admin selects any approved winner as a Golden Ticket recipient. Updates their Hall of Fame card to Gold treatment. Admin can send a premium email to P&C, generate a print-ready PDF letter, or both.

---

## 3. What You Are NOT Building

- Nomination forms of any kind
- Approval or vetting workflows
- Employee directory or HR system lookup
- Photo consent workflow (handled offline by Maria)
- Reward fulfilment tracking
- HRIS integration
- n8n, Power Automate, or any external workflow orchestration
- Microsoft Forms
- SharePoint lists as backend
- Public internet access — internal network only
- Any feature involving direct staff interaction with the platform beyond viewing

---

## 4. Reference Design Files

The following HTML files are the visual design specifications. Build from them. They are not production code — they are the CCCO's design intent and must be faithfully reproduced in the production React frontend.

| File | Purpose |
|---|---|
| `docs/03-design/reference-html/cws-wall-of-fame-peer.html` | Visual spec for Charter Champions page |
| `docs/03-design/reference-html/cws-wall-of-fame-manager.html` | Visual spec for Instant Impact page |
| `docs/03-design/reference-html/cws-golden-ticket-email.html` | Visual spec for Golden Ticket email template |
| `docs/03-design/reference-html/cws-award-personalised-letter.html` | Visual spec for the Golden Ticket PDF letter |

These files use Playfair Display, DM Sans, and Barlow. Production replaces these with Cormorant Garamond, Plus Jakarta Sans, and Outfit (see `DESIGN_SYSTEM.md`) but preserves all layout, card structure, animation, and colour treatment.

### MJML Email Project (Separate Repository)

A standalone MJML test project is used to develop and iterate on email templates. MJML templates compile to HTML. The compiled output is copied into `backend/app/templates/emails/` when ready.

**Integration rules for the agent:**
- Do NOT write raw HTML email templates
- Create placeholder `.html` stub files in `backend/app/templates/emails/`
- The FastAPI email service uses Jinja2 to render these files with live data
- Template variable names in stubs must match the context objects defined in the email service exactly — the MJML project uses the same names
- Stub format:

```html
<!-- PLACEHOLDER: Replace with MJML-compiled output -->
<!-- Jinja2 variables below must be preserved when replaced -->
<html><body>
<p>{{ winner_first_name }} {{ winner_last_name }} — {{ award_type_label }}</p>
</body></html>
```

---

## 5. Technology Stack

### Runtime Services

| Layer | Technology | Managed by | Notes |
|---|---|---|---|
| Backend | Python 3.12 + FastAPI | **systemd** on VM | Not containerised — DTO standard |
| Frontend | React 18 + TypeScript + Vite | **NGINX** (static files) | Built to disk, served by host NGINX |
| Database | PostgreSQL 16 | **Docker Compose** | Host port 5433 (DTO standard) |
| PDF sidecar | Playwright (Python) | **Docker Compose** | Approved utility service — localhost:8001 |
| Reverse proxy / SSL | NGINX | **system install** (apt) | Not a Docker container |

This is the DTO standard deployment model per `docs/01-standards/internal-dev-kit/04_DOCKER_COMPOSE_STANDARD.md`. Docker Compose is for the database and the Playwright PDF sidecar only. The backend process is managed by systemd. The frontend is static files served from disk by the host NGINX install.

### Libraries and Frameworks

| Layer | Technology | Version |
|---|---|---|
| Frontend styling | Tailwind CSS | 3.x |
| Frontend components | shadcn/ui | latest (baseline) |
| Auth (frontend) | MSAL React | latest |
| Auth (backend) | python-jose + JWKS validation | latest |
| ORM | SQLAlchemy 2.0 (async) + Alembic | latest |
| Email | Python smtplib (built-in) + Jinja2 | — |
| Scheduled jobs | APScheduler embedded in FastAPI | latest |
| File storage | Local filesystem — `/data/pulse/photos/` | — |
| Version control | GitHub (DTO organisation) | private repo |
| CI/CD | GitHub Actions + self-hosted runners | — |

**Explicitly excluded:**
- n8n, Power Automate, Microsoft Forms, SharePoint Lists as backend
- WeasyPrint (use Playwright for PDF)
- Redis, Celery, or external task queue
- Any database other than PostgreSQL 16

---

## 6. Repository Structure

Per `docs/01-standards/internal-dev-kit/05_REPOSITORY_STRUCTURE_STANDARD.md`.

```
cws-pulse-awards/
│
├── README.md
├── EXIT.md                          # Repo root — mandatory before handover
├── .gitignore
├── .env.example
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/                     # Route handlers (FastAPI routers)
│   │   │   ├── __init__.py
│   │   │   ├── public.py            # Public Hall of Fame endpoints
│   │   │   ├── admin_winners.py
│   │   │   ├── admin_golden_ticket.py
│   │   │   ├── admin_config.py
│   │   │   └── auth.py
│   │   ├── core/                    # Config, database, auth, dependencies
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Settings from env vars (pydantic-settings)
│   │   │   ├── database.py          # SQLAlchemy async engine and session
│   │   │   ├── auth.py              # JWT validation, role enforcement
│   │   │   └── dependencies.py      # FastAPI dependency callables
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── winner.py
│   │   │   ├── config_pillar.py
│   │   │   ├── config_value.py
│   │   │   ├── config_subcategory.py
│   │   │   ├── config_setting.py
│   │   │   └── email_recipient.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── winner.py
│   │   │   ├── config.py
│   │   │   └── email.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── email_service.py
│   │   │   ├── pdf_service.py       # Calls Playwright sidecar on localhost:8001
│   │   │   └── storage_service.py   # Photo upload — local filesystem
│   │   └── templates/
│   │       └── emails/
│   │           ├── award_charter_champion.html   # MJML stub
│   │           ├── award_instant_impact.html     # MJML stub
│   │           └── golden_ticket.html            # MJML stub
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── alembic.ini
│   ├── tests/
│   ├── requirements.txt
│   └── pulse-awards.service         # systemd unit file template
│
├── frontend/
│   └── app/                         # Single SPA — public Hall of Fame + admin routes
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── msalConfig.ts
│       │   ├── styles/
│       │   │   ├── globals.css
│       │   │   └── design-tokens.css
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useWinners.ts
│       │   │   └── useConfig.ts
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Header.tsx
│       │   │   │   ├── Footer.tsx
│       │   │   │   └── AdminNav.tsx
│       │   │   ├── shared/
│       │   │   │   ├── AnimatedBackground.tsx
│       │   │   │   ├── MonthNav.tsx
│       │   │   │   ├── AwardCard.tsx
│       │   │   │   ├── GoldenTicketCard.tsx
│       │   │   │   ├── Avatar.tsx
│       │   │   │   ├── PillarTag.tsx
│       │   │   │   ├── CategoryBadge.tsx
│       │   │   │   └── EmptyState.tsx
│       │   │   └── admin/
│       │   │       ├── WinnerForm.tsx
│       │   │       ├── WinnerTable.tsx
│       │   │       ├── GoldenTicketTrigger.tsx
│       │   │       ├── PhotoUpload.tsx
│       │   │       └── ConfigEditor.tsx
│       │   ├── pages/
│       │   │   ├── CharterChampions.tsx
│       │   │   ├── InstantImpact.tsx
│       │   │   └── admin/
│       │   │       ├── AdminEntry.tsx
│       │   │       ├── AdminWinners.tsx
│       │   │       ├── AdminGoldenTicket.tsx
│       │   │       └── AdminConfig.tsx
│       │   └── api/
│       │       ├── client.ts
│       │       ├── winners.ts
│       │       ├── config.ts
│       │       └── admin.ts
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── components.json          # shadcn/ui config
│
├── pdf_service/
│   ├── pdf_service.py               # FastAPI micro-service, Playwright renders PDF
│   ├── requirements.txt
│   ├── Dockerfile
│   └── templates/
│       └── golden_ticket_letter.html
│
├── scripts/
│   └── linux/
│       ├── build_release.sh         # Build backend venv + frontend dist
│       ├── install_release.sh       # Install release bundle to /opt/pulse-awards/
│       ├── deploy_backend.sh        # Restart systemd service
│       ├── deploy_frontend.sh       # Sync dist to frontends-src/
│       ├── deploy_nginx.sh          # Copy and reload NGINX config
│       └── verify_release.sh        # Smoke checks: health + ready endpoints
│
├── docs/
│   ├── INDEX.md
│   ├── architecture/
│   ├── deployment/
│   └── operations/
│
├── docker-compose.yml               # PostgreSQL + Playwright sidecar only
└── .github/
    └── workflows/
        ├── ci.yml                   # Tests + build checks on hosted runners
        ├── deploy-staging.yml       # Manual deploy to cwscx-tst01
        └── deploy-production.yml    # Manual deploy to production VM
```

---

## 7. Deployment Architecture

This section is critical. Read it before writing any infrastructure code.

### DTO Standard Model (per SOP 04)

```
VM: pulse.cwsey.com (internal)
│
├── systemd service: pulse-awards
│     Python 3.12 venv at /opt/pulse-awards/backend/venv
│     FastAPI app — listens on 127.0.0.1:8000 (not publicly exposed)
│
├── NGINX (system install via apt)
│     /etc/nginx/sites-available/pulse-awards.conf
│     Serves frontend from: /opt/pulse-awards/frontends-src/app/dist/
│     Proxies /api/* to: http://127.0.0.1:8000
│     Handles TLS: /etc/ssl/pulse-awards/
│
├── Docker Compose at /opt/pulse-awards/docker-compose.yml
│     postgres:16 — host port 5433 (internal only)
│     playwright sidecar — host port 127.0.0.1:8001 (internal only)
│
└── /data/pulse/photos/ — winner photo storage (VM filesystem, backed up)
```

### Traffic Flow

```
Browser (internal network)
  → HTTPS 443 → NGINX
       → /charter-champions, /instant-impact, /admin/* → serve index.html (SPA)
       → /api/* → proxy to FastAPI on 127.0.0.1:8000
       → /api/v1/photos/* → FastAPI static files mount

FastAPI backend
  → PostgreSQL at 127.0.0.1:5433
  → Playwright sidecar at http://127.0.0.1:8001 (PDF generation)
  → SMTP relay at 172.16.77.10:587 (email send)
```

### systemd Unit File

Create `backend/pulse-awards.service` as the template:

```ini
[Unit]
Description=CWS Pulse Awards Backend
After=network.target

[Service]
Type=exec
User=pulse
WorkingDirectory=/opt/pulse-awards/backend
EnvironmentFile=/opt/pulse-awards/.env
ExecStart=/opt/pulse-awards/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Install to `/etc/systemd/system/pulse-awards.service` during deployment.

### VM Prerequisites (document in EXIT.md)

Before first deploy, the VM needs:
```bash
sudo apt update && sudo apt install -y nginx python3.12 python3.12-venv docker.io docker-compose-v2
sudo mkdir -p /opt/pulse-awards /data/pulse/photos
sudo useradd -r -s /bin/false pulse
sudo chown pulse:pulse /opt/pulse-awards /data/pulse/photos
```

---

## 8. Design System

See `DESIGN_SYSTEM.md` for the full reference. Summary:

### Fonts

```css
:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'Plus Jakarta Sans', Arial, sans-serif;
  --font-label:   'Outfit', Arial, sans-serif;
}
```

### Colours

```css
:root {
  --color-navy:       #0A2240;
  --color-blue:       #0070C0;
  --color-sky:        #00A3D9;
  --color-gold:       #F5A623;
  --color-gold-soft:  #FFD166;
  --color-amber:      #E8870A;
}
```

Award type colour coding: Charter Champion = blue/sky, Instant Impact = amber/gold, Golden Ticket = full gold treatment.

---

## 9. Data Model

See `schema.sql` for the complete annotated SQL with seed data.

### Table Summary

| Table | Purpose |
|---|---|
| `winners` | All award entries — Charter Champion, Instant Impact, Golden Ticket flags |
| `config_pillars` | 8 Customer Centric Charter Pillars |
| `config_values` | 5 Company Values |
| `config_subcategories` | Sub-categories per award type (3 each) |
| `config_settings` | Key-value store for all platform configuration |
| `email_recipients` | P&C distribution email addresses — multi-recipient, admin-managed |

### Key Data Decisions

- `award_type` values: `CHARTER_CHAMPION`, `INSTANT_IMPACT`, `TEAM_AWARD`, `TOP_5`
- `status` values: `PUBLISHED`, `ARCHIVED`, `REMOVED`
- `golden_ticket`: boolean — no uniqueness constraint per period
- `golden_ticket_occasion`: optional free-text label (e.g., "Q1 2026")
- `golden_ticket_ceo_message`: personalised CEO closing paragraph — admin writes before trigger
- `photo_url`: nullable — initials avatar fallback if null
- `nominated_by`: nullable — "A colleague" shown on Hall of Fame if null
- No duplicate win constraint — same person can win multiple times in a year
- Leavers: cards remain permanently — no leaver workflow

---

## 10. API Design

### Base URL

All API routes prefixed `/api/v1`.

### Health Endpoints (Required — checked by verify_release.sh)

```
GET /api/v1/health
    Returns: { status: "ok", version: str }
    Auth: none
    Note: basic liveness check

GET /api/v1/health/ready
    Returns: { status: "ready", db: "ok", smtp: "ok" }
    Auth: none
    Note: readiness check — verifies DB connection and SMTP reachability
    Returns 503 if any dependency is unavailable
```

### Authentication Model

- Public endpoints: no token required (internal network = sufficient access control)
- Admin endpoints: Entra ID JWT Bearer token required in Authorization header
- Backend validates: signature, issuer, audience, expiry, `CWS-Pulse-Admin` role claim
- Returns 401 for missing/invalid token, 403 for valid token without required role
- Frontend must NOT block startup on a `/auth/me` call — read identity and role from MSAL token claims directly

### Public Endpoints

```
GET  /api/v1/winners
     Query params: award_type (required), month (optional "Jun 2026"), year (optional)
     Returns: List[WinnerPublic]

GET  /api/v1/winners/{id}
     Returns: WinnerPublic

GET  /api/v1/config/pillars
     Returns: List[Pillar] (active only, sorted)

GET  /api/v1/config/values
     Returns: List[Value] (active only, sorted)

GET  /api/v1/config/subcategories
     Query params: award_type (optional)
     Returns: List[Subcategory] (active only)

GET  /api/v1/config/settings/public
     Returns: Dict — safe public settings only (hall_of_fame_url, hall_of_fame_intro, programme_launch_month)
```

### Admin Endpoints — Winners

```
GET    /api/v1/admin/winners
       Query: award_type, month, year, status, golden_ticket
       Returns: List[WinnerAdmin]

POST   /api/v1/admin/winners
       Body: WinnerCreate
       Returns: WinnerAdmin
       Side effect: triggers award notification email to all active email_recipients

GET    /api/v1/admin/winners/{id}
       Returns: WinnerAdmin

PUT    /api/v1/admin/winners/{id}
       Body: WinnerUpdate
       Returns: WinnerAdmin

POST   /api/v1/admin/winners/{id}/photo
       Body: multipart/form-data — file field "photo"
       Accepts: JPEG, PNG — max 2MB
       Returns: { photo_url: str }
       Stores to: /data/pulse/photos/{id}.{ext}

POST   /api/v1/admin/winners/{id}/archive
       Body: { reason: str (optional) }
       Returns: WinnerAdmin

POST   /api/v1/admin/winners/{id}/remove
       Body: { reason: str (required) }
       Returns: WinnerAdmin
```

### Admin Endpoints — Golden Ticket

```
GET    /api/v1/admin/golden-ticket
       Returns: List[WinnerAdmin] where golden_ticket = true

POST   /api/v1/admin/winners/{id}/golden-ticket/mark
       Body: { occasion: str (optional), ceo_message: str }
       Returns: WinnerAdmin

DELETE /api/v1/admin/winners/{id}/golden-ticket/revoke
       Returns: WinnerAdmin

POST   /api/v1/admin/winners/{id}/golden-ticket/trigger
       Body: { send_email: bool, generate_pdf: bool }
       Returns: { email_sent: bool, pdf_download_token: str | null }

GET    /api/v1/admin/winners/{id}/golden-ticket/pdf
       Query: token (short-lived, 10 min expiry)
       Returns: application/pdf stream

GET    /api/v1/admin/winners/{id}/golden-ticket/email-preview
       Returns: { html: str }
```

### Admin Endpoints — Configuration

```
GET/POST/PUT/DELETE  /api/v1/admin/config/pillars
GET/POST/PUT/DELETE  /api/v1/admin/config/values
GET/POST/PUT/DELETE  /api/v1/admin/config/subcategories
GET/PUT              /api/v1/admin/config/settings
GET/POST/DELETE      /api/v1/admin/config/recipients
PATCH                /api/v1/admin/config/recipients/{id}/toggle
POST                 /api/v1/admin/config/pillars/reorder   (body: [{id, sort_order}])
POST                 /api/v1/admin/config/values/reorder
```

---

## 11. Frontend Pages

### `/charter-champions` — Charter Champions Hall of Fame

Visual reference: `docs/03-design/reference-html/cws-wall-of-fame-peer.html`

- Animated background: blue orbs and grid
- Hero: Cormorant Garamond 900 H1, subtitle, month chip
- Month nav: Jan–Dec + All. Current month active by default. Horizontally scrollable on mobile.
- Card grid: `auto-fill, minmax(300px, 1fr)`, 24px gap
- Golden Ticket winner if present in filtered set: full-width featured card with gold ring, gold border, gold badge
- Standard cards: blue card-bar, initials/photo avatar, pillar tag, story, nominated by
- On load: fetch `GET /api/v1/winners?award_type=CHARTER_CHAMPION` with current month
- Admin bar (bottom-right): visible only if MSAL cache has a valid admin token. Shows "Add Awardee" button opening entry modal. Hidden if not admin.
- Deep link support: `?month=Jun+2026` query param pre-selects month filter

### `/instant-impact` — Instant Impact Hall of Fame

Visual reference: `docs/03-design/reference-html/cws-wall-of-fame-manager.html`

- Same structure as Charter Champions — gold/amber colour treatment throughout
- Fetch: `GET /api/v1/winners?award_type=INSTANT_IMPACT`

### Shared Hall of Fame Behaviour

- Top nav bar on both pages links to both Hall of Fame pages
- No login required on public pages — MSAL is not invoked
- SPA: NGINX `try_files` ensures all routes serve `index.html`; React Router handles client-side routing

### `/admin/*` — Admin Routes

All admin routes protected by MSAL auth guard. Redirect to Entra ID login if no valid token. Role `CWS-Pulse-Admin` required.

**`/admin/entry`** — Winner entry form (modal pattern, all fields, photo upload)

**`/admin/winners`** — Table: all entries, all statuses, columns: name, type, month, status, GT flag, actions (edit/archive/remove/mark GT)

**`/admin/golden-ticket`** — GT management: list current GT winners, winner picker, CEO message editor, output options (email / PDF / both), preview, trigger

**`/admin/config`** — Tabbed: Pillars, Values, Sub-categories, Email Recipients, Platform Settings

### Auth Implementation Notes (per SOP 06)

```typescript
// msalConfig.ts
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: import.meta.env.VITE_ENTRA_AUTHORITY,
    redirectUri: import.meta.env.VITE_APP_URL,
  },
  cache: { cacheLocation: "sessionStorage" },
};

export const loginRequest = {
  scopes: [import.meta.env.VITE_ENTRA_API_SCOPE],
};
```

- Use MSAL redirect flow
- Read identity and role from token claims — do NOT block app startup on a `/api/v1/auth/me` call
- Token acquisition centralized in a single `useAuth` hook
- Redirect URI must match the exact deployed SPA base URL registered in Entra

---

## 12. Email System

### SMTP Configuration

```
Host: 172.16.77.10
Port: 587 (primary) / 25 (fallback)
Auth: none
TLS: STARTTLS where available
From: from config_settings key email_from_address
```

### Email Templates

Three email types. Each has a stub `.html` file in `backend/app/templates/emails/`. Jinja2 renders before send.

**Email 1: Award Notification — Charter Champion**
- Trigger: automatically on `POST /api/v1/admin/winners` for CHARTER_CHAMPION
- Template: `award_charter_champion.html`
- Subject: `CWS Pulse Awards — New Charter Champion: {{ winner_first_name }} {{ winner_last_name }}`

**Email 2: Award Notification — Instant Impact**
- Same pattern as Email 1
- Template: `award_instant_impact.html`

**Email 3: Golden Ticket Notification**
- Trigger: `POST /api/v1/admin/winners/{id}/golden-ticket/trigger` with `send_email: true`
- Template: `golden_ticket.html`
- Subject: `CWS Golden Ticket — {{ winner_first_name }} {{ winner_last_name }}{% if occasion_label %} | {{ occasion_label }}{% endif %}`

### Jinja2 Context Variables (must match MJML project)

Award notification context:
```python
{
    "winner_first_name": str,
    "winner_last_name": str,
    "winner_job_title": str,
    "winner_department": str,
    "award_type_label": str,     # "Charter Champion" or "Instant Impact"
    "subcategory": str,
    "charter_pillar": str,
    "company_value": str,
    "story": str,
    "nominated_by": str,         # "A colleague" if blank
    "award_month": str,
    "hall_of_fame_url": str,
    "photo_url": str | None,
}
```

Golden Ticket context (superset of above):
```python
{
    # All award notification fields, plus:
    "ceo_message": str,
    "ceo_name": str,
    "ceo_title": str,
    "ccco_name": str,
    "ccco_title": str,
    "chief_pc_name": str | None,
    "chief_pc_title": str | None,
    "occasion_label": str | None,
}
```

### Email Service Rules

- All sends synchronous within the FastAPI request (volume is low — no queue needed)
- SMTP failure: log error, return 500 with clear admin-facing message. Do not silently fail.
- Failed email must NOT prevent the winner record from being saved
- Email service function signature accepts template name + context dict — adding new template types must not require changing the service interface

---

## 13. PDF Generation — Playwright Sidecar

### Architecture

Playwright runs as a Docker Compose utility service. Backend calls it via HTTP on `http://127.0.0.1:8001`. Port 8001 is bound to `127.0.0.1` on the VM host only — not publicly reachable.

This is an approved Docker Compose utility service per `docs/01-standards/internal-dev-kit/04_DOCKER_COMPOSE_STANDARD.md`. It is documented here as a utility service with no persistent data and no backup requirements.

### Playwright Service API

```
POST http://127.0.0.1:8001/generate
     Body: { html: str, filename: str }
     Returns: application/pdf binary stream

GET  http://127.0.0.1:8001/health
     Returns: { status: "ok" }
```

### PDF Generation Flow

1. FastAPI renders `pdf_service/templates/golden_ticket_letter.html` with Jinja2 (same context object as Golden Ticket email)
2. FastAPI POSTs rendered HTML string to `http://127.0.0.1:8001/generate`
3. Playwright service renders in Chromium headless, calls `page.pdf(format="A4", print_background=True)`
4. PDF bytes returned to FastAPI
5. FastAPI stores bytes in memory with UUID token key (10 min TTL)
6. FastAPI returns token to frontend
7. Frontend calls `GET /api/v1/admin/winners/{id}/golden-ticket/pdf?token={token}`
8. FastAPI streams PDF bytes as `application/pdf` download

### PDF Letter Template

`pdf_service/templates/golden_ticket_letter.html` is a static render version of `docs/03-design/reference-html/cws-award-personalised-letter.html` with:
- All interactive JS and contenteditable elements removed
- Jinja2 template variables in place of editable fields
- Print-safe CSS only (no transitions, no animations)
- A4 format margins
- Google Fonts loaded via link tag (Playwright fetches external resources)

---

## 14. Authentication — Entra ID

### App Registration

One app registration per `docs/01-standards/internal-dev-kit/06_ENTRA_ID_INTEGRATION_GUIDE.md`.

Required configuration:
- Supported account types: `Accounts in this organizational directory only`
- Redirect URIs (Single-page application): `https://pulse.cwsey.com/` + staging URL
- App role: name = `CWS-Pulse-Admin`, value = `CWS-Pulse-Admin`, allowed member types = Users/Groups
- API scope: `access_as_user` under `Expose an API`
- Application ID URI: `api://{client_id}`

Document in EXIT.md using the standard Entra Registration Record format from SOP 06.

### Backend JWT Validation

```python
# core/auth.py
# Validate in this order:
# 1. Decode header to get kid
# 2. Fetch JWKS from: https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys
# 3. Validate signature, issuer, audience, expiry
# 4. Check roles claim contains "CWS-Pulse-Admin"
# 5. Return decoded payload or raise HTTPException

# Cache JWKS for 24 hours
# Issuer: https://login.microsoftonline.com/{tenant_id}/v2.0
# Audience: api://{client_id}
# Handle blank ENTRA_JWKS_URL safely — fall back to discovery URL if blank
```

Returns 401 for missing/invalid token. Returns 403 for valid token missing required role.

---

## 15. NGINX Configuration

Per `docs/01-standards/internal-dev-kit/03_NGINX_REVERSE_PROXY_GUIDE.md`.

### Site File Location

`/etc/nginx/sites-available/pulse-awards.conf`

Enabled via symlink: `/etc/nginx/sites-enabled/pulse-awards.conf`

### Configuration Template (store as `docs/nginx/pulse-awards.conf.template`)

```nginx
upstream pulse_backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name pulse.cwsey.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name pulse.cwsey.com;

    ssl_certificate     /etc/ssl/pulse-awards/pulse-awards.crt;
    ssl_certificate_key /etc/ssl/pulse-awards/pulse-awards.key;

    root /opt/pulse-awards/frontends-src/app/dist;
    index index.html;

    # Prevent stale frontend shell after deploys (lesson from CWSCX)
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # API proxy
    location /api/ {
        proxy_pass http://pulse_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 5M;
    }

    # SPA fallback — all non-file routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 16. Environment Variables

See `.env.example` for all variables with descriptions. Critical values:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Uses `127.0.0.1:5433` — host port, not Docker service name |
| `ENTRA_AUDIENCE` | Must be `api://{ENTRA_CLIENT_ID}` — wrong value causes 401 on every API call |
| `ENTRA_JWKS_URL` | Optional — if blank, backend falls back to discovery URL. Must not crash if blank. |
| `PDF_SERVICE_URL` | `http://127.0.0.1:8001` — Playwright sidecar on host port |

---

## 17. CI/CD

Per `docs/01-standards/internal-dev-kit/02_CICD_AND_REPO_STANDARD.md`.

### Repository Settings

- Private repository in GitHub DTO organisation
- Protected `main` branch — PR review required, status checks required before merge
- GitHub environments: `staging` and `production`
- All deploy jobs: **manual trigger only**

### Workflow Files

```
.github/workflows/
├── ci.yml                  # Runs on every push — tests + build checks
├── deploy-staging.yml      # Manual — runs on self-hosted runner, targets cwscx-tst01
└── deploy-production.yml   # Manual — runs on self-hosted runner, targets production VM
```

### Staging Target

- Host: `cwscx-tst01.cwsey.com`
- IP: `172.17.1.213`
- Runner label: `self-hosted`, `linux`, `staging`

### Runner Labels Required

```yaml
# In deploy-staging.yml
runs-on: [self-hosted, linux, staging]

# In deploy-production.yml
runs-on: [self-hosted, linux, production]
```

### Deploy Script Responsibilities (scripts/linux/)

| Script | Responsibility |
|---|---|
| `build_release.sh` | Creates Python venv, installs requirements, builds React frontend to `dist/` |
| `install_release.sh` | Archives release bundle on VM, extracts to `/opt/pulse-awards/` |
| `deploy_backend.sh` | Runs Alembic migrations, restarts `pulse-awards` systemd service |
| `deploy_frontend.sh` | Rsyncs `dist/` to `/opt/pulse-awards/frontends-src/app/dist/` |
| `deploy_nginx.sh` | Copies NGINX config to `sites-available/`, symlinks, tests, reloads |
| `verify_release.sh` | Smoke checks — must check both health endpoints |

### verify_release.sh Requirements

```bash
#!/bin/bash
# Per SOP 02 — check both endpoints after every deploy
BASE_URL="${1:-https://pulse.cwsey.com}"

echo "Checking health..."
curl -kfsS "${BASE_URL}/api/v1/health" || { echo "FAIL: /health"; exit 1; }

echo "Checking readiness..."
curl -kfsS "${BASE_URL}/api/v1/health/ready" || { echo "FAIL: /health/ready"; exit 1; }

echo "Checking Charter Champions page..."
curl -kfsS "${BASE_URL}/charter-champions" | grep -q "Charter" || { echo "FAIL: charter-champions"; exit 1; }

echo "All checks passed."
```

### GitHub Environment Secrets Pattern

```
STAGING_HOST       = cwscx-tst01.cwsey.com
STAGING_PATH       = /opt/pulse-awards
STAGING_BASE_URL   = https://cwscx-tst01.cwsey.com
STAGING_SSH_KEY    = (if deploying over SSH — not needed if runner is on the same VM)

PRODUCTION_HOST    = (production VM hostname)
PRODUCTION_PATH    = /opt/pulse-awards
PRODUCTION_BASE_URL = https://pulse.cwsey.com
PRODUCTION_SSH_KEY  = (if needed)
```

---

## 18. Build Phase Order

Phases are strictly sequential. Do not begin a phase until the previous phase is complete, running on the VM, and Gregory has reviewed it.

### Phase 0 — Foundation

- Docker Compose: PostgreSQL (port 5433) + Playwright sidecar (127.0.0.1:8001) running
- FastAPI skeleton: `app/main.py`, `core/config.py`, `core/database.py`, `core/auth.py`
- Alembic initial migration with full schema and seed data
- Health endpoints: `GET /api/v1/health` and `GET /api/v1/health/ready`
- Entra ID JWT validation working (return 403 for missing role)
- systemd unit file created and service starts successfully
- Email service stub (logs to console, does not send)
- PDF service stub (returns placeholder PDF)

Deliverable: `systemctl start pulse-awards` succeeds. Health check returns 200. Seed data queryable. Admin token validation returns correct 401/403.

### Phase 1 — Hall of Fame

- Charter Champions page (`/charter-champions`)
- Instant Impact page (`/instant-impact`)
- Shared components built from design reference files
- Public API endpoints working
- Month filter working
- Golden Ticket featured card (visual treatment only — no trigger flow)
- Responsive layout
- NGINX serving frontend from `/opt/pulse-awards/frontends-src/app/dist/`

Deliverable: Both pages render with seed sample data. Month filter works. NGINX serving correctly. Mobile responsive.

### Phase 2 — Admin Entry

- Admin route protection (MSAL, role check)
- Winner entry form (all fields, photo upload)
- Winners list table with edit/archive/remove
- Photo upload and serving via FastAPI static mount
- Admin bar on Hall of Fame pages (visible only to admin)

Deliverable: Admin can log in, enter a winner, see it appear on Hall of Fame immediately. Photo upload works.

### Phase 3 — Award Notification Email

- Email service with Jinja2 rendering (SMTP to 172.16.77.10)
- Stub templates wired up
- Email triggers on winner creation (auto, server-side)
- Email recipients CRUD in admin config
- Email preview in admin UI
- Test send function in admin config

Deliverable: Award notification email sends to configured recipients on winner entry. Admin can manage recipient list.

### Phase 4 — Golden Ticket

- Golden Ticket marking flow
- CEO personalised message editor
- Playwright PDF sidecar fully implemented
- Golden Ticket letter HTML template (from `docs/03-design/reference-html/cws-award-personalised-letter.html`)
- Golden Ticket email stub wired
- Trigger UI: email / PDF / both options with preview
- PDF download via token
- Hall of Fame featured card updates on marking

Deliverable: Admin marks, personalises, previews, triggers Golden Ticket. PDF downloads. Email sends. Hall of Fame updates.

### Phase 5 — Admin Configuration

- Charter Pillars CRUD with drag-to-reorder
- Company Values CRUD
- Sub-categories CRUD per award type
- Email recipients management
- Platform settings form (all config_settings)
- Zero hardcoded config values anywhere in the codebase

Deliverable: Admin can manage all platform content and settings without touching code or database.

### Phase 6 — Polish and EXIT.md

- Archive view
- Edit/remove workflow polishing
- Mobile responsive testing (all admin pages)
- Error states and user feedback throughout
- Loading states and skeleton screens
- `verify_release.sh` all checks passing
- EXIT.md for all services (see requirements below)
- Full end-to-end test: entry → email → Golden Ticket → PDF

Deliverable: Platform handover-ready. EXIT.md complete. All flows tested end-to-end.

---

## 19. Confirmed Decisions Register

All decisions below are final. Do not re-open them.

| # | Decision | Resolution |
|---|---|---|
| T1 | Hall of Fame page structure | Two separate page routes — `/charter-champions` and `/instant-impact` — in one SPA |
| T2/P1 | Golden Ticket flow | No timing restriction. As-and-when, admin discretion. Mark → personalise → trigger. |
| T3 | Fonts | Cormorant Garamond (display) / Plus Jakarta Sans (body) / Outfit (labels) |
| T4 | Photo storage | Local filesystem — `/data/pulse/photos/` on DTO VM |
| T5 | Platform URL | `https://pulse.cwsey.com` — internal network only |
| T6 | Photo at entry | Optional — initials avatar fallback if no photo |
| T7 | CEO closing paragraph | Personalised — admin writes before triggering each Golden Ticket |
| T8 | Golden Ticket output | Email + PDF both supported. Admin chooses at trigger time. |
| P4 | P&C distribution email | Config-driven — `email_recipients` table. Not hardcoded. |
| P5 | Leaver policy | Cards remain permanently. No leaver workflow. |
| P7 | Duplicate wins | Multiple wins allowed per person per year. No platform constraint. |
| — | Admin access | Entra ID app roles. No platform-side user management. |
| — | Nomination intake | Entirely offline. No nomination form in platform. |
| — | Approval workflow | Entirely offline. Platform is entry-and-display only. |
| — | Backend runtime | systemd — not containerised |
| — | Frontend serving | NGINX static files — not a container |
| — | Docker Compose scope | PostgreSQL (port 5433) + Playwright sidecar only |

---

## 20. Seed Data

The initial Alembic migration must include all seed data below. The platform is unusable without it.

### Charter Pillars (8 — confirmed final)
Professionalism & Respect | Empathy, Listening & Understanding | Effective & Transparent Communication | Proactive Problem Solving, Urgency & Ownership | Customer Centricity & Insights Driven | Accountability | Innovation | Continuous Improvement

### Company Values (5 — confirmed final)
Customer | Team | Integrity | Respect | Accountability

### Sub-categories (6 — confirmed final)
Charter Champion: Collaboration Catalyst | Empathy Anchor | Knowledge Sharer
Instant Impact: Service Recovery Excellence | Innovative Efficiency | Integrity Under Pressure

### Config Settings defaults
See `schema.sql` for the complete INSERT statements including the golden_ticket_message_template default.

---

## 21. EXIT.md Requirements

Mandatory before any component is considered complete or handed over.

Minimum contents:

- Architecture overview with ASCII or Mermaid diagram
- All environment variables (name, purpose, example — never actual secrets)
- Database schema summary with field descriptions
- API endpoint reference (all routes, methods, auth requirement, request/response shape)
- systemd service name, start/stop/restart/status commands
- Deployment steps from zero to running
- Entra Registration Record (format from SOP 06)
- Operational runbooks: add Charter Pillar, change P&C distribution list, edit email template content, remove winner, revoke Golden Ticket, generate PDF manually
- Known issues and technical debt log
- Backup and restore procedure for database and photo storage
- NGINX config location and reload command

---

*End of Agent Handover Document*
*SOP compliance: 02, 03, 04, 05, 06*
*All decisions confirmed by CCCO and DTO lead as of May 2026*
*Do not proceed past Phase 0 without Gregory reviewing the running service.*
