# INTERNAL DEV KIT Application Notes — CWS Pulse Awards

This file records how Gregory's INTERNAL DEV KIT applies to the Pulse Awards project. The actual kit snapshot in `docs/01-standards/internal-dev-kit/` is intentionally preserved as a source copy.

## Applied standards

- Platform standard: FastAPI backend, React/Vite frontend, PostgreSQL 16, Entra OIDC/JWT, host NGINX.
- Repository standard: backend/frontend/docs/scripts/.github layout with mandatory `.env.example`, `.gitignore`, `README.md`, and `EXIT.md`.
- Docker Compose standard: Docker Compose is for PostgreSQL and approved utility services only. Backend runs via systemd. For Pulse Awards, the PDF service is treated as an approved utility sidecar with no persistent data.
- NGINX standard: host NGINX serves frontend static files and proxies `/api/` to the backend.
- Entra standard: backend JWT validation and role enforcement are authoritative; frontend checks are convenience only.
- CI/CD standard: GitHub Actions target now; GitLab CE future-compatible templates retained. Internal VM deploys require self-hosted runners.
- Operations/handover standard: `EXIT.md` is mandatory before production handover.

## Pulse-specific paths

- Kit snapshot: `docs/01-standards/internal-dev-kit/`
- OpenCode rules: `OPENCODE.md`
- Project-local OpenCode skills: `.opencode/skills/`
- Design references: `docs/03-design/reference-html/`
- Current handoff: `docs/00-agent-control/OPENCODE_CONTINUATION_HANDOFF.md`

## Key exceptions / clarifications

- The Playwright PDF service is allowed as a Docker Compose utility service because it has no persistent data and is supporting infrastructure, not the main backend runtime.
- SMTP/email sending is not production-enabled until reviewed and approved.
- GitHub remote and runner labels are not yet confirmed.
