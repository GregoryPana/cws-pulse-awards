# Running Pulse Awards Locally

Four pieces need to be running: the **Postgres database** (Docker), the **PDF sidecar**
(Docker, Playwright/Chromium), the **backend API** (FastAPI on port 8000), and the
**frontend** (Vite on port 5173).

## Prerequisites (one-time)

- Docker Desktop running (for the `pulse_db` and `pulse_playwright` containers)
- Python 3.12 with the backend dependencies installed (`backend/venv` already exists)
- Node.js 18+ with frontend dependencies installed:
  ```powershell
  cd frontend\app
  npm install
  ```
- Local env flags (already configured in this workspace):
  - Repo-root `.env` contains `DEV_AUTH_ENABLED=true` — the backend accepts the local test
    token so you can use the admin portal without Microsoft sign-in.
  - `frontend/app/.env.local` contains `VITE_DEV_AUTH_ENABLED=true` — the frontend skips
    MSAL and sends that test token.
  - Never enable either flag in production.
  - `APP_BASE_URL` / `PDF_ASSET_BASE_URL` in `.env` point emails and certificate PDFs at
    the logo and Golden Ticket artwork — see §16–17 of `DESIGN_SYSTEM.md` if images don't
    appear.

## Start everything (four terminals)

**1. Database + PDF sidecar**
```powershell
docker start pulse_db
docker start pulse_playwright
```

**2. Backend API** (from the repo root)
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**3. Frontend** (from the repo root)
```powershell
cd frontend\app
npm run dev
```

## Open the app

| Page | URL |
|---|---|
| Wall of Fame — Charter Champions | http://localhost:5173/charter-champions |
| Wall of Fame — Instant Impact | http://localhost:5173/instant-impact |
| Admin portal (entry, directory, recipients) | http://localhost:5173/admin/entry |
| API docs (Swagger) | http://127.0.0.1:8000/docs |

## Run the tests

```powershell
cd backend
python -m pytest
```

Frontend typecheck and production build:
```powershell
cd frontend\app
npx tsc --noEmit
npm run build
```

## Troubleshooting

- **Admin portal shows no winners / preview never renders** — the dev auth flags above are
  missing, or the backend was started before they were set. Restart the backend after any
  `.env` change (env values are read once at startup).
- **Port 5173 already in use** — a previous Vite is still running; kill it or Vite will move
  to 5174 (and the printed URL will say so).
- **A Tailwind colour/class change doesn't show up (e.g. text renders invisible/transparent,
  or a border stays default grey) even after saving the file** — same stale-process pattern as
  the backend one above, but on the frontend: an orphaned `npm run dev` from an earlier session
  keeps serving pre-change CSS. Undefined Tailwind classes (from a colour that didn't exist yet
  when that stale process last compiled) fail silently rather than erroring, which is why this
  is easy to mistake for an app bug. Fix:
  ```powershell
  Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
  then `rm -rf frontend/app/node_modules/.vite` and restart `npm run dev`. Afterwards, **hard-refresh
  the browser** (Ctrl+Shift+R) — restarting the server breaks the old HMR connection, and a normal
  refresh can still reuse a stale cached module graph from before the restart.
- **Email "send" fails** — the SMTP host (`SMTP_HOST` in `.env`) must be reachable from your
  machine; previews work regardless.
- **Logo or Golden Ticket image missing in a downloaded certificate PDF, but fine in the
  browser preview** — the PDF sidecar (`pulse_playwright`) runs in its own Docker container
  with its own network namespace, so it cannot reach `127.0.0.1:5173` the way your browser
  can. It uses `PDF_ASSET_BASE_URL` (`http://host.docker.internal:5173` locally) instead.
  This requires Vite to accept that host — already set in `vite.config.ts`
  (`server.host: true`, `server.allowedHosts: ['host.docker.internal']`). If you changed
  that file, restart Vite. See `DESIGN_SYSTEM.md` §17 for the full explanation.
- **Certificate download returns a 502** — the PDF sidecar isn't running or was rebuilt
  after a `pdf_service/pdf_service.py` change without recreating the container:
  ```powershell
  docker compose build playwright
  docker compose up -d playwright
  ```
  (the sidecar's code is baked into its image, not live-mounted, so edits need a rebuild).
- **A backend code change (new route, new template variable, new setting) doesn't seem to
  take effect, even though `--reload` is running** — `uvicorn --reload`'s file watcher can get
  stuck mid-reload after certain edits (observed after touching `app/core/config.py`): the log
  shows `WatchFiles detected changes... Reloading...` but never a following
  `Application startup complete.`, and the *old* worker process keeps silently serving stale
  code indefinitely. Symptoms: a new route 404s with a generic `{"detail":"Not Found"}` instead
  of your own 404 message, or a new template variable renders as an empty string. Confirm by
  checking `/openapi.json` for your new route, or by counting Python processes — multiple
  orphaned `python.exe` instances from earlier sessions are a common contributor on Windows.
  Fix: kill every `python.exe` process and start one fresh instance:
  ```powershell
  Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
  then restart uvicorn as in step 2 above.
