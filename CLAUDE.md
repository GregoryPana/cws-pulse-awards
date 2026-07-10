# Claude Code Operating Rules — CWS Pulse Awards

This file is the Claude Code and Claude IDE-extension adapter for the repo-local agent harness. It intentionally points to the same source rules used by OpenCode so Claude, OpenCode, Codex, Hermes, and human reviewers work from one project contract.

## Required reading order

1. `AGENTS.md` — cross-agent operating guide and current architecture.
2. `OPENCODE.md` — detailed project rules, confirmed decisions, Phase 0 boundaries, and handoff cadence.
3. `PROJECT_START.md` — original scope and non-goals.
4. `AGENT_HANDOVER.md` — current handover state and review notes.
5. `docs/INDEX.md` and `docs/reference/TEST_STRATEGY.md` — documentation map and test strategy.
6. `schema.sql` and `backend/alembic/versions/` — database contract when working on data/schema behavior.

## Claude-specific operating rules

- Use CodeGraph first when available for orientation, symbol lookup, route tracing, caller/callee checks, and impact analysis.
- If launched from the IDE extension, stay scoped to this repository root and follow the same rules as terminal Claude Code.
- Do not deploy, force-push, rewrite history, inspect/print `.env` values, run destructive database commands, or proceed past Phase 0 without Gregory's explicit approval.
- Do not reinterpret confirmed product decisions in `OPENCODE.md` unless Gregory explicitly reopens them.
- Keep changes narrow and phase-aligned. Do not mix harness/documentation edits with app/runtime edits.
- Before claiming completion, report files changed, commands run, tests/checks run, failures, and residual risks.

## Hermes Update Pack parity

Claude Code must be able to produce the same Hermes Update Pack as OpenCode.

Normal cadence:

1. After meaningful work, append a compact 3–8 line entry to `.opencode/hermes-pending-updates.md`:
   - timestamp and one-line summary;
   - branch + short commit if available, and whether pushed;
   - files changed/inspected;
   - verification run and result, or `not run — reason`;
   - impact flags: deployment, auth/security/data, schema/migration, decision, risk, none.
2. Ask Gregory exactly one concise question: `Hermes pending log: N entries since <oldest date>. Generate the consolidated Hermes Update Pack now?`
3. Only produce the full consolidated pack when Gregory says yes or asks for a Hermes Update Pack.
4. Skip the queue only for deployment, auth/schema/migration, destructive, or security events.

Full pack requirements:

- canonical project name: `CWS Pulse Awards`;
- branch/status and latest commit/push status;
- files changed;
- commands run;
- tests/checks and actual results;
- implementation summary;
- deployment impact;
- auth/security/data impact;
- docs/handover impact;
- decisions made or confirmed;
- risks/open questions;
- suggested Hermes vault updates;
- next recommended task.

Never include secrets, tokens, passwords, cookies, connection-string values, `.env` values, private keys, or customer-sensitive data. Redact as `[REDACTED]` if a value must be referenced.

## Design/UI work

Before substantial frontend/UI work, read `docs/AGENT_DESIGN_SKILLS.md` and `DESIGN_SYSTEM.md` if relevant. Hermes decides which design-skill bundle applies; do not load every design skill by default. For implemented UI, run available build/lint/type checks and provide browser/responsive/console verification before claiming completion.
