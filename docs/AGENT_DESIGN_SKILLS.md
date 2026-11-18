# Agent Design Skills

This project is implemented by Claude/OpenCode inside the repo, while Hermes owns design-skill routing and high-level orchestration.

## Policy

Do **not** load every design skill for every task. For routine development, use the default project bundle below. When Hermes orchestrates, use its selected route; when OpenCode or Claude is invoked directly, record the same route before implementation.

```text
Design route
- Domain/product skill: CWS SaaS Product UI with Pulse Awards exception
- Visual direction: DESIGN_SYSTEM.md | skill required | not relevant
- Component/implementation skill:
- Motion: CSS/restraint | Emil/GSAP required | not relevant
- Interface polish: required | optional | not relevant — reason
- Final verification: frontend design quality gate
```

## Default bundle for this CWS internal app

Use for normal dashboards, forms, admin screens, workflow pages, reports, records, and settings:

1. **CWS SaaS Product UI** — workflow-first internal SaaS design, app shell, forms, tables, dashboards, roles, states.
2. **shadcn/ui Components** — React/Tailwind/shadcn component composition, semantic tokens, cards, tables, dialogs, sheets, forms.
3. **Impeccable Frontend Craft** — static/structural implementation craft and evidence-based polish within `DESIGN_SYSTEM.md`.
4. **Frontend Design Quality Gate** — build/lint/browser/responsive/console checks before claiming UI complete.

Optional only when needed:

- **Emil Kowalski Motion Polish** — interaction states, interruption/reversal, restrained admin motion, and rare awards/celebration moments.
- **Web Design Style Library** — visual direction, reference family, or token exploration.
- **GSAP Web Animation** — motion tokens, animation implementation, ScrollTrigger/timelines, reduced-motion/performance.
- **Mobile App UI Design** — mobile-first screens, onboarding, thumb-zone workflows, bottom-sheet patterns.

## Project design source of truth

Before substantial UI work, read whichever exists:

- `DESIGN.md`
- `DESIGN_SYSTEM.md`
- `docs/DESIGN.md`
- `docs/DESIGN_SYSTEM.md`
- this file

If no design-system file exists, propose one before large frontend changes.

## Hermes skill files available locally

When you need the full guidance, read only the relevant files:

```text
/home/gpanagary/.hermes/skills/creative/design-skill-stack/SKILL.md
/home/gpanagary/.hermes/skills/creative/cws-saas-product-ui/SKILL.md
/home/gpanagary/.hermes/skills/software-development/shadcn-ui-components/SKILL.md
/home/gpanagary/.hermes/skills/software-development/frontend-design-quality-gate/SKILL.md
/home/gpanagary/.hermes/skills/creative/web-design-style-library/SKILL.md
/home/gpanagary/.hermes/skills/software-development/gsap-web-animation/SKILL.md
/home/gpanagary/.hermes/skills/creative/mobile-app-ui-design/SKILL.md
```

## Agent-agnostic source resolution

Central skill roots:

```text
WSL:     /mnt/c/Users/gpanagary/central-agent-skills
Windows: C:\Users\gpanagary\central-agent-skills
```

| Capability | Project minimum | Central agent skill | Hermes-local full source |
|---|---|---|---|
| Product workflow and Pulse exception | This file plus `DESIGN_SYSTEM.md`, `PROJECT_START.md`, and `AGENT_HANDOVER.md` | No complete central equivalent | `/home/gpanagary/.hermes/skills/creative/cws-saas-product-ui/SKILL.md` |
| Component implementation | `DESIGN_SYSTEM.md` and project component conventions | No central equivalent currently | `/home/gpanagary/.hermes/skills/software-development/shadcn-ui-components/SKILL.md` |
| Static interface craft | Completion standard below | `skills/design/impeccable-frontend-craft/SKILL.md` | `/home/gpanagary/.hermes/skills/creative/interface-polish-engineering/SKILL.md` |
| Motion and micro-interactions | Pulse/admin boundaries in project docs | `skills/design/emil-kowalski-motion-polish/SKILL.md` | `/home/gpanagary/.hermes/skills/software-development/gsap-web-animation/SKILL.md` for complex GSAP work |
| Visual/mobile direction | This file and `DESIGN_SYSTEM.md` | No complete central equivalent | Use the applicable Hermes paths above when readable |
| Final QA | Completion standard below | `skills/design/impeccable-frontend-craft/SKILL.md` supplies craft review only | `/home/gpanagary/.hermes/skills/software-development/frontend-design-quality-gate/SKILL.md` |

Read a central or Hermes file only when the task needs that capability and the path is accessible. If a named source cannot be read, apply this project's embedded minimum, report the missing source, and do not claim its full checklist was performed.

## Completion standard for UI work

Before saying frontend/UI work is complete:

- run available lint/typecheck/build commands;
- inspect key routes/components in browser where possible;
- check console errors;
- check mobile/responsive behavior for user-facing screens;
- confirm empty/loading/error/success states where relevant;
- record whether interface polish was required, optional, or not relevant and what was actually inspected;
- summarize what was verified and what remains unverified.
