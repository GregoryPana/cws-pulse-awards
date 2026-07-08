# Running Pulse Awards Locally

Three pieces need to be running: the **Postgres database** (Docker), the **backend API**
(FastAPI on port 8000), and the **frontend** (Vite on port 5173).

## Prerequisites (one-time)

- Docker Desktop running (for the `pulse_db` Postgres container)
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

## Start everything (three terminals)

**1. Database**
```powershell
docker start pulse_db
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
- **Email "send" fails** — the SMTP host (`SMTP_HOST` in `.env`) must be reachable from your
  machine; previews work regardless.
