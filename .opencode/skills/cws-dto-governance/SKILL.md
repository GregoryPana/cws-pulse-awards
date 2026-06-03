---
name: cws-dto-governance
description: Apply Gregory's CWS DTO INTERNAL DEV KIT governance to this project.
---

# CWS DTO Governance Skill

Use this skill whenever implementing, reviewing, documenting, testing, deploying, or handing over this project.

## Source documents

Read and apply the INTERNAL DEV KIT snapshot under:

`docs/01-standards/internal-dev-kit/`

Priority documents:

1. `01_PLATFORM_STANDARD.md`
2. `05_REPOSITORY_STRUCTURE_STANDARD.md`
3. `04_DOCKER_COMPOSE_STANDARD.md`
4. `06_ENTRA_ID_INTEGRATION_GUIDE.md`
5. `02_CICD_AND_REPO_STANDARD.md`
6. `03_NGINX_REVERSE_PROXY_GUIDE.md`
7. `08_OPERATIONS_AND_HANDOVER_CHECKLISTS.md`
8. `EXIT_TEMPLATE.md`

## Hard rules

- Python/FastAPI backend runs through systemd, not Docker.
- Docker Compose is for PostgreSQL and approved utility services only.
- PostgreSQL uses version 16 and host port 5433 unless an exception is approved.
- React/Vite frontend builds static files served by NGINX.
- Entra backend role enforcement is authoritative.
- CI can use hosted runners for checks, but internal VM deploys require self-hosted runners.
- Migrations are explicit and reviewed.
- EXIT.md is a production/handover gate.

## Report deviations

If implementation deviates from the kit, explicitly report:

- deviation;
- reason;
- risk;
- approval needed;
- safer standard alternative.
