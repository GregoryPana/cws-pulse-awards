# Hermes Update Pack — CWS Pulse Awards

Produce the same consolidated Hermes Update Pack used by OpenCode for this repository.

## Rules

- Work read-only unless Gregory explicitly asks for edits.
- Use canonical project name: `CWS Pulse Awards`.
- Read `CLAUDE.md`, `OPENCODE.md`, and `.opencode/skills/hermes-update-pack/SKILL.md` first.
- Read all unflushed entries in `.opencode/hermes-pending-updates.md` if present.
- Include current branch, latest commit, and whether the latest commit is pushed to origin if this can be checked safely.
- Do not include secrets, tokens, cookies, passwords, connection strings, `.env` values, private keys, or customer-sensitive data. Redact as `[REDACTED]`.

## Output format

```markdown
# Hermes Update Pack — CWS Pulse Awards

## Session metadata
- Agent:
- Date:
- Branch:
- Latest commit / pushed status:
- Working directory:
- Task summary:

## Files changed or inspected

## Commands run

## Tests / verification

## Implementation summary

## Deployment impact

## Auth / security / data impact

## Documentation / handover impact

## Decisions

## Risks / open questions

## Suggested Hermes vault updates

## Next recommended task
```

After producing the pack, if Gregory confirms it is flushed, move the covered pending entries under a `## Flushed <YYYY-MM-DD>` heading in `.opencode/hermes-pending-updates.md`.
