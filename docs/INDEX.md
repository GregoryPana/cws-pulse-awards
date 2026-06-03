# CWS Pulse Awards Documentation Index

This repository is organised so OpenCode/Codex can continue development without relying on hidden chat context.

## Start here

1. `PROJECT_START.md` — current phase, scope, stop conditions, success criteria.
2. `AGENT_HANDOVER.md` — authoritative product and technical specification.
3. `OPENCODE.md` — project-local coding-agent operating rules.
4. `schema.sql` — canonical database schema and seed data.
5. `DESIGN_SYSTEM.md` — visual tokens and frontend design constraints.

## Documentation structure

- `docs/00-agent-control/`
  - current agent handoff, continuation prompts, phase gates, and coding-agent rules.
- `docs/01-standards/internal-dev-kit/`
  - snapshot of Gregory's INTERNAL DEV KIT standards, templates, governance, and compliance guidance.
- `docs/02-architecture/`
  - architecture notes and derived implementation guidance.
- `docs/03-design/reference-html/`
  - CCCO visual reference HTML files for Hall of Fame, Golden Ticket email, and PDF letter.
- `docs/04-deployment/`
  - deployment, CI/CD, VM, NGINX, systemd, and runner guidance.
- `docs/05-operations/`
  - handover, monitoring, backup, rollback, and operational readiness.
- `docs/06-reference/`
  - supporting reference material.
- `docs/reference/TEST_STRATEGY.md`
  - phase-based test strategy and validation gates.
- `docs/99-archive/agent-handoffs/`
  - historical Hermes/OpenCode handoff/session material. Do not treat archived files as current authority unless explicitly referenced by current docs.

## Authority order

If documents conflict, use this order:

1. Gregory's explicit written confirmation in current task context.
2. `AGENT_HANDOVER.md` for Pulse Awards-specific product and technical rules.
3. `PROJECT_START.md` for current phase scope and stop conditions.
4. `docs/01-standards/internal-dev-kit/` for DTO development governance.
5. Current source code and tests.
6. Archived handoffs only as historical evidence.

## Confirmed business decisions

These are closed and must not be reopened during implementation:

- T1: Hall of Fame uses two routes: `/charter-champions` and `/instant-impact`.
- T2/P1: Golden Ticket is as-and-when admin discretion: mark → personalise → trigger.
- T7: CEO closing paragraph is editable/personalised before each Golden Ticket trigger.
- P5: leavers remain permanently visible; no leaver workflow.
- P7: multiple wins per person per year are allowed; no duplicate constraint.

## Current phase gate

The project is in Phase 0 / foundation continuation. Do not proceed to Phase 1 frontend build until Gregory explicitly approves Phase 0.
