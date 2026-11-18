---
name: hermes-update-pack
description: Credit-efficient Hermes handoff. Log a compact pending entry after meaningful work and ask Gregory whether to flush; produce the full consolidated pack only when he says yes or runs /hermes-handoff.
---

# Hermes Update Pack

Canonical vault project name: **CWS Pulse Awards**.

## Update cadence — pending log first (changed 2026-07-06)

Do NOT produce this full pack after every task. After each meaningful coding/review/documentation task:

1. Append one compact entry (3-8 lines) to `.opencode/hermes-pending-updates.md` (create with a `# Hermes Pending Updates` heading if missing): timestamp + one-line summary; `branch @ short-SHA (pushed to origin: yes/no)`; files; verification result or "not run — why"; impact flags (deployment / auth-security-data / decision / risk / none).
2. Ask Gregory exactly one line: `Hermes pending log: N entries since <oldest date>. Generate the consolidated Hermes Update Pack now?`
3. Only when he says yes (or runs /hermes-handoff), produce ONE consolidated pack in the format below covering all unflushed entries plus current repo state; then move flushed entries under a `## Flushed <YYYY-MM-DD>` heading at the bottom of the log.
4. Skip the queue only for deployment, auth/schema/migration, destructive or security events.
5. Never write secrets into the pending log or the pack.

```markdown
# Hermes Update Pack — CWS Pulse Awards

## Session metadata
- Agent:
- Date:
- Branch:
- Working directory:
- Task summary:

## Files changed
- `path`: change summary

## Commands run
- command — result

## Tests / verification
- test/check:
- result:
- failures:

## Implementation summary

## Phase impact
- Phase 0 impact:
- Later phase impact:

## Deployment impact

## Auth / security / data impact

## Documentation / handover impact

## Decisions
- Confirmed:
- New decisions required:

## Risks / open questions

## Suggested Hermes vault updates

## Next recommended task
```
