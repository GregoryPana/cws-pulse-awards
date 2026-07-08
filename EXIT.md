# EXIT.md — CWS Pulse Awards

This file is the required DTO production/handover gate. It must be completed before production handover is considered complete.

Current status: **Phase 0 baseline verified locally / not production-ready**.

---

## 1. Application Overview

- Application name: CWS Pulse Awards
- One-line description: Internal staff recognition platform for Digital Hall of Fame, admin award entry, and Golden Ticket recognition output.
- Business purpose: Support the CWS Pulse Awards recognition programme with controlled entry of approved winners and internal display of recognition outcomes.
- Primary users:
  - Public/internal viewers: CWS staff on internal network.
  - Admin users: authorised P&C/admin staff in Entra group/role `CWS-Pulse-Admin`.
  - Programme owner: Maria Pouponneau, CCCO.
  - Technical owner: Gregory Panagary, DTO.
- Production URL: `https://pulse.cwsey.com` internal network only.
- Current status: Phase 0 baseline verified locally; not handed over; not approved for production.

## 2. Environment Model

- Pre-production VM: To be confirmed.
- Production VM: Dedicated Linux production VM required/target; provisioning to be confirmed.
- Internal DNS names: `pulse.cwsey.com` planned.
- TLS certificate approach: Host NGINX TLS termination using CWS internal certificate process; exact certificate paths to be confirmed.

## 3. Architecture Summary

- Backend: Python 3.12 + FastAPI, SQLAlchemy async, Alembic, managed by systemd on VM host.
- Frontend(s): React 18 + TypeScript + Vite + Tailwind/shadcn baseline; static build served by host NGINX. Public routes `/charter-champions` and `/instant-impact`; admin routes under `/admin/*`.
- Reverse proxy: Host NGINX, `/api/` proxied to backend on `127.0.0.1:8000`, frontend static files served from disk.
- Database: PostgreSQL 16 via Docker Compose, host port `5433`, named persistent volume.
- PDF sidecar: Playwright utility service via Docker Compose, localhost `8001`, no persistent data.
- Authentication: Microsoft Entra ID; frontend MSAL; backend JWT/JWKS validation and authoritative role enforcement.
- Monitoring: Health/readiness endpoints required; Uptime Kuma recommended once deployed.

## 4. Repository And Deployment

- Repository URL: `https://github.com/GregoryPana/cws-pulse-awards`
- Default branch: `feature/phase-0-foundation` (not yet renamed to `main`).
- Current working branch: `feature/phase-0-foundation`.
- Current CI/CD platform: GitHub Actions. Baseline test workflow in `.github/workflows/ci.yml`;
  deploy workflows in `.github/workflows/deploy-staging.yml` and `deploy-production.yml`.
- Staging deploy workflow/job: `deploy-staging.yml` — `workflow_dispatch`, runs the backend/
  frontend test+build gate, then deploys via `scripts/linux/*.sh` on the self-hosted runner.
- Production deploy workflow/job: `deploy-production.yml` — identical structure, gated by the
  `production` GitHub Environment's required-reviewer protection rule (must be configured in
  repo Settings — the workflow YAML alone is not the approval gate).
- Self-hosted runner names/labels: one runner today, `pulse-awards-runner-01`, labels
  `self-hosted,linux,pulse-awards,staging,production` — see
  `docs/deployment/self-hosted-runner-setup.md` for the full setup and the plan for splitting
  onto a separate production VM later.

## 5. Runtime Paths

- App root on VM: `/opt/pulse-awards/`
- Backend service name: `pulse-awards`
- Backend service file: `backend/pulse-awards.service` template, installed to `/etc/systemd/system/pulse-awards.service` when approved.
- Compose file path: `/opt/pulse-awards/docker-compose.yml`
- Frontend build path: To be confirmed during Phase 1; expected under `/opt/pulse-awards/frontend/app/dist` or release directory per deployment script.
- NGINX site path: `/etc/nginx/sites-available/pulse-awards.conf` with enabled symlink in `/etc/nginx/sites-enabled/`.
- Backup path: `/opt/backups/pulse-awards/` target; final retention not confirmed.
- Photo storage path: `/data/pulse/photos/`.

## 6. Health And Verification

- Health endpoint: `GET /api/v1/health`
- Readiness endpoint: `GET /api/v1/health/ready`
- Standard local verification commands:

```bash
docker compose up -d --build
curl -fsS http://127.0.0.1:8000/api/v1/health
curl -fsS http://127.0.0.1:8000/api/v1/health/ready
cd backend && ./venv/bin/python -m alembic upgrade head
cd .. && ./scripts/linux/verify.sh
```

- Standard production verification commands: To be finalized after deployment scripts and NGINX config are created.
- Phase 0 repo verification scripts:
  - `scripts/linux/smoke.sh`
  - `scripts/linux/verify.sh`

## 7. Backup And Restore

- Backup method: placeholder script only in `scripts/linux/backup_template.sh`; production backup job still required.
- Schedule: To be confirmed.
- Retention: To be confirmed.
- Last successful backup test date: Not yet performed.
- Last restore-readiness test date: Not yet performed.
- Known backup risks:
  - same-VM-only backups are insufficient for disaster recovery;
  - photo storage path `/data/pulse/photos/` must be included in backup plan;
  - restore-readiness must be proven before production handover.

## 8. Entra Registration Record

- App registration name: To be confirmed.
- Enterprise application name: To be confirmed.
- Tenant ID: To be filled from approved Entra registration; do not commit secrets.
- Client ID: To be filled from approved Entra registration; do not commit secrets.
- Application ID URI: Expected `api://<client-id>` unless CWS Entra admin approves another URI.
- API scope(s): Expected `access_as_user`.
- Redirect URLs:
  - `https://pulse.cwsey.com/`
  - staging/local URLs to be confirmed.
- Post-logout URLs: To be confirmed.
- App roles: `CWS-Pulse-Admin` required for admin API access.
- Assigned groups: To be confirmed by P&C/IT.
- Request/approval reference: To be recorded.
- Support owner: Gregory Panagary / DTO.

## 9. Operational Runbook

- Start backend:

```bash
sudo systemctl start pulse-awards
```

- Stop backend:

```bash
sudo systemctl stop pulse-awards
```

- Restart backend:

```bash
sudo systemctl restart pulse-awards
```

- View backend logs:

```bash
journalctl -u pulse-awards -n 100 --no-pager
```

- Start supporting services:

```bash
docker compose up -d --build
```

- View supporting services:

```bash
docker compose ps
```

- NGINX reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 10. Security And Data Notes

- The platform is internal-only; no public internet exposure.
- No nomination, approval, HRIS, or employee-directory integration is in scope.
- Photos are stored on local filesystem and must be backed up.
- Backend authorization is authoritative; frontend role checks are convenience only.
- `.env` is ignored and must never be committed.
- SMTP sends are not production-enabled until reviewed and approved.

## 11. Confirmed Business Decisions

- T1: Hall of Fame uses two routes: `/charter-champions` and `/instant-impact`.
- T2/P1: Golden Ticket is as-and-when admin discretion: mark → personalise → trigger.
- T7: CEO closing paragraph is editable/personalised before each Golden Ticket trigger.
- P5: leavers remain permanently visible; no leaver workflow.
- P7: multiple wins per person per year are allowed; no duplicate constraint.

## 12. Handover Status

- [ ] Phase 0 approved by Gregory.
- [x] GitHub remote created and branch pushed.
- [ ] CI baseline checks passing in GitHub Actions.
- [ ] Staging deployment verified.
- [ ] Production deployment verified.
- [ ] Monitoring configured.
- [ ] Backup completed and restore-readiness tested.
- [ ] Entra registration details recorded.
- [ ] Final operational owner confirmed.
- [ ] Handover walkthrough completed.

## 13. Open Items Before Production Handover

- Complete approved Phase 0 review against the verified local baseline.
- ~~Create/confirm GitHub private repo remote.~~ Done — see §4.
- Register the self-hosted runner on `cwscx-tst01` per
  `docs/deployment/self-hosted-runner-setup.md` (not yet performed on the actual VM).
- Configure the `staging` and `production` GitHub Environments (variables + production's
  required-reviewer rule) per §7 of the runner setup guide.
- Run `deploy-staging.yml` for the first time and confirm `scripts/linux/verify_release.sh`
  passes end-to-end against the real VM.
- Provision the self-signed TLS certificate at `/etc/ssl/pulse-awards/` before the first
  `deploy_nginx.sh` run.
- Complete frontend and admin workflows in later phases.
- Replace email templates with reviewed MJML-derived production templates.
- Complete backup/restore scripts and tests.
- Complete monitoring/status-page setup.
