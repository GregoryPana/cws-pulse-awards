# Hermes pending updates

## 2026-11-18 — Hall of Fame card layout/responsive pass (CWS Pulse Awards)
- Reworked wall layout: wider container, centred flex-wrap cards (320–440px), footer pinned to card bottom, story clamped to 6 lines with Read more, mobile Golden Ticket padding/type; fixed Dec chip clipped in PeriodNav.
- Branch feature/phase-0-foundation, uncommitted, not pushed.
- Changed: frontend/app/src/components/shared/AwardCard.tsx, PeriodNav.tsx, pages/InstantImpact.tsx, pages/CharterChampions.tsx; added scripts/dev/mock-api.mjs (local-only mock API).
- Verified: `tsc --noEmit` pass, `vite build` pass, browser checks at 360/390/768/1024/1366/1920/2560 widths against mock data (no horizontal overflow). Backend/frontend unit tests not run — none cover this UI.
- Impact flags: none (frontend presentation only; no deploy/auth/schema).

## 2026-11-18 — Hall of Fame audit items 1–8 implemented (CWS Pulse Awards)
- Masonry WinnerGrid (new), compact hero + inline filter, recipient count + docked quick month bar, subcategory replaces repeated type badge, compact pillar tags (+N), animated Read more with 44px tap target, hover-only border-trace beam, pre-launch legibility + "View Jun 2026" jump.
- Branch feature/phase-0-foundation, uncommitted, not pushed.
- Changed: frontend/app/src/components/shared/{AwardCard,WinnerGrid(new),PeriodNav,PillarTag,HallFilters,PreLaunchNotice}.tsx, pages/{InstantImpact,CharterChampions}.tsx, styles/globals.css; scripts/dev/mock-api.mjs (new, local mock).
- Verified: tsc + vite build pass; browser check at 360–2560px on both walls with mock data, no horizontal overflow. No automated UI tests exist; not run against real backend/data.
- Impact flags: none (frontend presentation only).

## 2026-11-18 — Hall of Fame: masonry replaced by uniform-height cards (CWS Pulse Awards)
- WinnerGrid now equal-height centred rows; story area min 3 / max 6 lines; on expand every card height is locked so only the opened card grows (neighbours unchanged). Branch feature/phase-0-foundation, uncommitted.
- Changed: frontend/app/src/components/shared/{WinnerGrid,AwardCard}.tsx. Verified: tsc pass; browser check 360–2560px both walls (rows uniform, no horizontal overflow). Impact: none.
