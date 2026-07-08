# CWS Pulse Awards — Design System
**Document Type:** Frontend Design Reference
**Owner:** Gregory, Digital Transformation Office
**Status:** Confirmed — apply from Phase 1 onwards
**Last revised:** July 2026 — added §9 Component Layer, §10 Iconography, §11 Feedback & Guidance, §12 Admin Portal IA, §13 Voice & Tone, §14 Opacity Conventions

---

## 1. Fonts

> **Prototype vs. Phase 1 confirmed fonts**
> The reference HTML files in `docs/03-design/reference-html/` were built with **Playfair Display + DM Sans**. Those fonts should be treated as prototype placeholders only. Phase 1 implementation must use the confirmed font stack below. Playfair Display and DM Sans must not be introduced into application code.

### Google Fonts Import

Place in `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Font Role Mapping

| CSS Variable | Font | Fallback | Usage |
|---|---|---|---|
| `--font-display` | Cormorant Garamond | Georgia, serif | Hero H1, winner names (featured), section headers, decorative quote marks |
| `--font-body` | Plus Jakarta Sans | Arial, sans-serif | Body text, story text, admin forms, descriptions, navigation |
| `--font-label` | Outfit | Arial, sans-serif | Category badges, pillar tags, value chips, month nav buttons, admin labels |

### CSS Variables (in `design-tokens.css`)

```css
:root {
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'Plus Jakarta Sans', Arial, sans-serif;
  --font-label:   'Outfit', Arial, sans-serif;
}
```

### Tailwind Config

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['Plus Jakarta Sans', 'Arial', 'sans-serif'],
        label:   ['Outfit', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

Usage in Tailwind: `font-display`, `font-body`, `font-label`

---

## 2. Colour Palette

### CSS Custom Properties

```css
:root {
  /* Core brand */
  --color-navy:       #0A2240;   /* confirmed; reference HTMLs erroneously used #08192E */
  --color-deep:       #060F1E;   /* deepest background — Instant Impact page body */
  --color-blue:       #0070C0;
  --color-sky:        #00A3D9;

  /* Gold / award accent */
  --color-gold:       #F5A623;
  --color-gold-soft:  #FFD166;
  --color-amber:      #E8870A;

  /* Neutrals */
  --color-white:      #FFFFFF;
  --color-mid-gray:   #6B8099;
  --color-dark-gray:  #2D3748;

  /* Glass / mist */
  --color-mist:       rgba(255, 255, 255, 0.06);
  --color-mist-md:    rgba(255, 255, 255, 0.10);
}
```

**Background per page**: Charter Champions uses `navy-deep` (`#061528`, a darkened navy added July 2026 so cards and gold accents pop against it); Instant Impact uses `--color-deep`. Both walls are intentionally dark canvases — brand colour comes from the cards, orbs, and accents, not the page background.

**Card accent separation (July 2026)**: standard Instant Impact cards use a muted amber/bronze register (`amber` tones, Zap badge icon) so that Golden Ticket cards — animated foil border, breathing gold glow, bright `gold-soft` accents, Sparkles icon — remain unmistakably the brightest thing on the wall. Every card carries a constant `border-trace` beam (sky on the blue wall, amber on the gold wall, dual bright-gold beams on Golden Ticket).

### Tailwind Colour Extension

```typescript
// tailwind.config.ts — extend colors
colors: {
  navy:       '#0A2240',
  deep:       '#060F1E',
  blue:       '#0070C0',
  sky:        '#00A3D9',
  gold:       '#F5A623',
  'gold-soft':'#FFD166',
  amber:      '#E8870A',
  'mid-gray': '#6B8099',
  'dark-gray':'#2D3748',
}
```

### Award Type Colour Assignments

| Award Type | Primary colour | Secondary | Card bar gradient | Badge bg | Badge text |
|---|---|---|---|---|---|
| Charter Champion — Peer | `--color-blue` | `--color-sky` | blue → sky | rgba(0,112,192,.2) | `--color-sky` |
| Charter Champion — Manager sub-type | `--color-navy` | `--color-blue` | navy → blue | rgba(0,112,192,.15) | `#60C4F0` |
| Instant Impact | `--color-amber` | `--color-gold` | amber → gold → gold-soft | rgba(245,166,35,.15) | `--color-gold-soft` |
| Golden Ticket | `--color-gold` | `--color-gold-soft` | Full gold treatment — amber → gold → gold-soft | rgba(245,166,35,.15) | `--color-gold` |

The Charter Champions wall has two card bar variants: `peer` (blue→sky) and `manager` (navy→blue). Both live on the same page and the variant is driven by the nomination type, not the award category.

---

## 3. Background System

Both Hall of Fame pages share the same `AnimatedBackground` React component. The component accepts a `variant` prop:

```typescript
type BackgroundVariant = 'blue' | 'gold'
```

### Implementation

```tsx
// components/shared/AnimatedBackground.tsx
// Position: fixed, inset 0, z-index 0, pointer-events none

// Grid layer:
// Charter Champions (blue): rgba(0,112,192,.07) grid lines
// Instant Impact (gold):    rgba(245,166,35,.04) grid lines
// Grid size: 60px x 60px

// Orbs (3 per page):
// Charter Champions: blue orbs (rgba(0,112,192,.18), rgba(245,166,35,.10), rgba(0,163,217,.12))
// Instant Impact:    gold orbs (rgba(245,132,35,.10), rgba(0,112,192,.12), rgba(245,166,35,.08))
// Filter: blur(90px), animation: drift 18-20s ease-in-out infinite alternate

// Drift keyframe:
// from: translate(0,0) scale(1)
// to:   translate(25-30px, 35-40px) scale(1.06-1.08)
// Each orb has a different animation-delay to desync movement
```

---

## 4. Component Conventions

### Spacing & Radius Tokens

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `18px` | Winner cards |
| `--radius-modal` | `16px` | Admin entry modal |
| `--radius-badge` | `20px` | Category badge, month nav buttons, live badge |
| `--radius-tag` | `6px` | Pillar tag |
| `--radius-btn` | `10px` | Admin bar buttons |

### Hero Section

```
[Hero container]         — text-align: center; padding 52px 24px 40px
  [Eyebrow]              — Outfit 11px / 600 / 3.5px letter-spacing / uppercase / gold
  [H1 title]             — Cormorant Garamond 900 / clamp(36px,6vw,68px) / lh 1.05
    [Accent span]        — color: --color-gold
  [Subtitle]             — Plus Jakarta Sans 300 / 16px / rgba(white,.55) / max-width 520px
  [Month chip]           — glass pill: mist bg, 1px rgba(white,.1) border, gold accent text
  [Gold divider line]    — 60px wide / 2px / gradient: transparent→gold→transparent
```

All hero children animate in with `fadeUp` at staggered delays: eyebrow 0.1s, title 0.25s, subtitle 0.4s, chip 0.55s, divider 0.65s.

### Live Badge

```css
/* Top-right of page header */
.live-badge {
  display: flex; align-items: center; gap: 7px;
  background: rgba(245,166,35,.12);
  border: 1px solid rgba(245,166,35,.3);
  border-radius: 20px; padding: 6px 14px;
  font-size: 12px; font-weight: 600; /* Outfit */
  color: var(--color-gold);
  letter-spacing: 1px; text-transform: uppercase;
}
.live-dot { /* pulse-dot animation, see §5 */ }
```

### Admin Bar

Fixed to `bottom: 24px; right: 24px`. Two buttons:
- **Fullscreen**: `background: rgba(255,255,255,.1)`, white text, subtle border
- **Add Awardee**: gold fill (`--color-gold`), navy text, `box-shadow: 0 6px 20px rgba(245,166,35,.35)`

Both use Plus Jakarta Sans 600 / 13px. On mobile (`<640px`): reduce inset to 16px.

### Card Structure

All winner cards share a common structure:

```
[Card container]
  [Card bar]         — top accent strip, 4px, award-type gradient
  [Card inner]       — padding 24px
    [Category badge] — Outfit font, uppercase, coloured per award type
    [Avatar wrap]    — flex row: avatar + name/role
      [Avatar]       — 56px circle, initials or photo, gradient background
      [Name block]   — awardee-name (Cormorant Garamond 700) + role (Plus Jakarta Sans 400)
    [Pillar tag]     — small chip: "icon + pillar name"
    [Story]          — italic, smaller, with decorative quote mark
    [Nominated by]   — smallest text, border-top separator
```

Cards also carry a `::before` pseudo-element — a 3px top accent strip (blue → sky → gold gradient) that is hidden by default (`opacity: 0`) and fades in on hover alongside the `translateY(-6px)` lift. This is separate from the always-visible 4px `card-bar` at the very top.

Featured (Golden Ticket) card spans full grid width with a two-column layout:
- Left column: person details, pillar, category badge, nominated by
- Right column: story panel with larger typography, optional impact stat block

### Avatar

- Size: 56px standard, 72px featured
- If `photo_url` is set: `<img>` tag with rounded-full, object-cover
- If no photo: initials computed as `firstName[0] + lastName[0]`, uppercase
- Background: gradient per award type (blue→sky for Charter Champion, amber→gold for Instant Impact)
- Golden Ticket ring: `box-shadow: 0 0 0 3px var(--color-gold), 0 4px 20px rgba(245,166,35,.3)`

### Empty State

When no cards match the active month filter, replace the grid with a centred empty state:

```
[Empty state container]  — grid-column: 1/-1; text-align center; padding 80px 24px
  [Icon]                 — 48px emoji / opacity .4
  [Text]                 — 15px / rgba(white,.3) / line-height 1.6
```

### Period Navigation (`PeriodNav`, July 2026)

Replaces the flat month row. Combines a **year stepper** with a launch-aware **month
selector** so the wall scales cleanly as years accumulate. All launch logic lives in
`frontend/app/src/lib/dates.ts` (single source of truth — never hard-code the launch date).

- **Year stepper**: centered ‹ year › control (Cormorant 3xl). Arrows are bounded — you can
  never step past the current year or before the launch year (2026). Disabled arrows drop to
  30% opacity.
- **Month chips**: "Full Year" + Jan–Dec. Each month is classified by `monthState(year, i)`:
  - `available` (launch ≤ period ≤ now): normal chip; active state per wall — Charter Champion
    `--color-blue` white text, Instant Impact amber→gold gradient navy text.
  - `prelaunch` (before Jun 2026): dashed border, muted, **Lock** icon, still clickable — selecting
    it shows the pre-launch notice rather than a bare empty state.
  - `future` (after this month): dashed, 20% opacity, disabled, `title` explains why.
- Horizontal scroll on mobile (no wrapping); wheel-to-scroll enabled.

### Programme Launch Rule

The programme launched **June 2026** (`LAUNCH_LABEL`). No winners can exist before it.

- Selecting any pre-launch period renders `PreLaunchNotice` — a calm, explanatory empty state
  ("Nothing here — and that's expected… the programme began in Jun 2026") — never the generic
  "no winners match" copy.
- Selectable years everywhere (walls + admin) come from `selectableYears()` = launch year →
  current year, newest first.

### Category Filter (`HallFilters`)

Year moved into `PeriodNav`, so `HallFilters` is now a single centered **category** selector
(max-width 420px) beneath the period nav — one job per control.

### Entry Form (Admin Modal)

- Background: dark navy `#0d2035`
- Border: 1px solid rgba(255,255,255,.10)
- Input fields: `background: rgba(255,255,255,.07)`, border `rgba(255,255,255,.12)` → focus border `var(--color-blue)` for Charter Champion flow, `var(--color-gold)` for Instant Impact flow
- Labels: Outfit 11px, uppercase, muted
- Primary button: gold gradient (amber → gold), navy text
- Cancel button: ghost style, muted text

---

## 5. Animation Conventions

### Card entrance

```css
@keyframes cardIn {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply with staggered delay: `animation-delay: {index * 0.1}s`
Duration: 0.7s, fill-mode: forwards

### Hero fade-up

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Hero elements stagger from 0.1s to 0.65s.

### Card hover

```css
.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(0,0,0,.4), 0 0 0 1px rgba(245,166,35,.2);
  transition: transform 0.3s, box-shadow 0.3s;
}
```

### Modal entrance

```css
@keyframes modalIn {
  from { transform: scale(.9); opacity: 0; }
  to   { transform: scale(1);  opacity: 1; }
}
/* Apply: animation: modalIn .3s cubic-bezier(.34,1.56,.64,1); */
```

### Live badge dot pulse

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.7); }
}
```

### Motion discipline & `prefers-reduced-motion`

All non-essential animations (drift, cardIn, fadeUp, hover lift) must be suppressed when the user has requested reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Pulse-dot on the live badge is considered decorative and must also be suppressed. The orb drift animation must stop (orbs become static). Card entrances can skip to final opacity/position immediately. Card hover lift (`translateY`) is a feedback affordance and may be retained at a shorter duration (0.15s).

---

## 6. Email Design System

Email templates are developed in the separate MJML test project. This section defines the conventions that MJML templates must follow so that compiled output integrates correctly.

### Email Colour Use

Emails use only solid hex colours — no CSS custom properties, no rgba gradients in background contexts. This is an Outlook compatibility requirement.

| Element | Colour | Hex |
|---|---|---|
| Header background | Navy | `#0A2240` |
| Top stripe | Gold | `#F5A623` |
| Body background | White | `#FFFFFF` |
| Body text | Dark gray | `#2D3748` |
| Charter Champion card header | Blue | `#0070C0` |
| Instant Impact card header | Navy | `#0A2240` |
| Pillar tag text | Gold | `#F5A623` |
| Footer background | Navy | `#0A2240` |
| Footer text | Gold | `#F5A623` |
| Tagline text | Muted blue | `#4A6A85` |

### Email Fonts

Web fonts are not used in email templates. System font fallbacks only:

| Role | Stack |
|---|---|
| Headings | `Georgia, 'Times New Roman', serif` |
| Body | `Arial, Helvetica, sans-serif` |
| Labels / badges | `Arial, Helvetica, sans-serif` (bold, condensed via letter-spacing) |

> **Golden Ticket email reference note**: `docs/03-design/reference-html/cws-golden-ticket-email.html` was prototyped with `Barlow Condensed + Barlow` (loaded from Google Fonts for browser preview). When compiled to MJML/HTML for actual delivery, this template must fall back to `Georgia` for headings and `Arial` for body, matching the table above. The Barlow prototype fonts are for visual reference only.

### Jinja2 Variable Convention

All MJML template variables must be wrapped in double curly braces and snake_case:

```
{{ winner_first_name }}
{{ winner_last_name }}
{{ winner_job_title }}
{{ winner_department }}
{{ award_type_label }}
{{ subcategory }}
{{ charter_pillar }}
{{ company_value }}
{{ story }}
{{ nominated_by }}
{{ award_month }}
{{ hall_of_fame_url }}
```

These match the context objects defined in the email service. Do not rename them without updating both the template and the service.

---

## 7. Responsive Breakpoints

Tailwind defaults apply. Key overrides:

| Breakpoint | Behaviour |
|---|---|
| Mobile (< 640px) | Single column card grid, month nav scrolls horizontally, featured card collapses to single column |
| Tablet (640–1024px) | 2-column card grid |
| Desktop (> 1024px) | 3-column card grid (auto-fill minmax 300px), featured card spans full width |

Admin UI is desktop-first — usable on tablet but not optimised for mobile.

---

## 8. Accessibility

### Minimum targets

- WCAG AA contrast on all text against its immediate background
- Interactive elements (buttons, month nav, form fields, modal triggers) must be keyboard-reachable and have a visible focus ring
- All images and icon-only controls require `aria-label` or `alt` text

### Focus ring spec

```css
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 3px;
  border-radius: 4px;
}
```

Use `--color-blue` as the focus ring color inside Charter Champion flows where gold has insufficient contrast against the blue background.

### Colour contrast notes

- Body text `rgba(255,255,255,.72)` on navy `#0A2240` passes AA (ratio ~8.5:1)
- Muted text `rgba(255,255,255,.35)` on navy is decorative only (e.g. `.nominated-by`) — do not use for primary content
- `--color-gold` `#F5A623` on `--color-navy` `#0A2240` passes AA for large text (18px+); verify at small sizes before use
- Admin labels at Outfit 11px uppercase should use at least `rgba(255,255,255,.55)` to maintain readability

### Screen reader considerations

- Month filter buttons must include `aria-pressed` state
- Live badge dot is decorative — add `aria-hidden="true"` to the dot element
- Card grid uses semantic list markup (`<ul>` / `<li>`) in the React implementation

---

## 9. Component Layer (shadcn-style)

The admin portal is built on a themed component library at `frontend/app/src/components/ui/`,
following the shadcn/ui pattern: components are copied into the repo (not imported from a
package) and built on Radix UI primitives, styled entirely with the Pulse Awards tokens above.

| Component | File | Primitive | Notes |
|---|---|---|---|
| `Button` | `ui/button.tsx` | native + Slot | Variants: `default` (gold gradient, navy text), `secondary` (glass), `outline` (gold outline), `ghost`, `destructive` (soft red). Sizes: `sm`, `default`, `lg`, `icon` |
| `Input` / `Textarea` | `ui/input.tsx`, `ui/textarea.tsx` | native | Dark control: `#0B1C30` fill, `border-white/[0.06]`, gold focus ring |
| `Select` | `ui/select.tsx` | @radix-ui/react-select | Dark popover, gold check on the selected item |
| `Tabs` | `ui/tabs.tsx` | @radix-ui/react-tabs | Pill TabsList; active trigger = amber→gold gradient with navy text |
| `Switch` | `ui/switch.tsx` | @radix-ui/react-switch | Gold when on; used for on/off recipient state |
| `Card` family | `ui/card.tsx` | native | Glass card: `border-white/[0.05]`, white 6%→1.5% gradient, backdrop blur. Includes `CardEyebrow` (gold micro-label) |
| `Badge` | `ui/badge.tsx` | native | Variants: `default` (gold), `success` (emerald), `muted`, `outline`, `destructive` |
| `Label` | `ui/label.tsx` | @radix-ui/react-label | Outfit 11px uppercase, `text-white/55` |

Utility: `cn()` in `src/lib/utils.ts` (clsx + tailwind-merge). All new UI must compose these
components rather than restyling raw elements.

Shared admin patterns (form fields with completion ticks, live email preview hook, step
indicator) live in `frontend/app/src/pages/admin/shared.tsx`.

---

## 10. Iconography

Two icon sets are used deliberately — do not mix their roles:

| Set | Package | Used for | Examples |
|---|---|---|---|
| **Hugeicons** | `@hugeicons/react` + `@hugeicons/core-free-icons` | Public Wall of Fame pages and celebratory/brand moments | Hero eyebrows (`Agreement01Icon`, `ChampionIcon`), featured story (`SparklesIcon`), empty states (`Award01Icon`) |
| **Lucide** | `lucide-react` | Admin portal functional UI: actions, forms, navigation, status | `Save`, `Send`, `Archive`, `Trash2`, `CheckCircle2`, `Loader2`, tab icons |

Rule of thumb: if the icon celebrates a person or decorates the public experience → Hugeicons.
If the icon labels an action or a system state → Lucide. Hugeicons render via
`<HugeiconsIcon icon={Name01Icon} size={16} strokeWidth={2} />`.

---

## 11. Feedback & Guidance Patterns

Every admin action must tell the user what is happening. The system provides four layers:

1. **Toasts (sonner)** — every completed or failed action fires a toast: title in plain
   language + one-sentence description of what happened and what to do next. Success uses
   `toast.success`, failures `toast.error`. The `<Toaster>` is mounted once in the admin shell
   (bottom-right, dark theme, `#0B1C30` panel).
2. **Loading states** — any in-flight action swaps the button icon for a spinning `Loader2`
   and changes the label to present tense ("Saving...", "Sending..."). Buttons disable while busy.
3. **Completion ticks** — required form fields show a small emerald `CheckCircle2` next to
   the label the moment they are filled in. The Add Winner flow also shows a 4-step indicator
   (Fill in → Preview → Save → Send) where each step is numbered, turns gold when it is the
   current step, and shows a tick when done.
4. **Persistent state badges** — records show "All changes saved ✓" / "Changes not saved yet"
   badges so the user always knows whether the database matches the screen. The live email
   preview carries an "Up to date / Updating..." badge with a pulsing dot while rendering.

Buttons that cannot be pressed yet must say why in muted helper text next to them
("Save unlocks when every starred field is filled in.").

---

## 12. Admin Portal Information Architecture

The admin portal (`/admin/entry`) is a three-tab application. Tabs are separated by job and
frequency of use, and all tab content stays mounted (`forceMount`) so nothing typed is lost
when switching tabs:

| Tab | Job | Key elements |
|---|---|---|
| **Add Winner** | Create a new recognition (most frequent) | Guided 4-step flow, form with completion ticks, live email preview (renders from the unsaved form via `POST /admin/winners/preview`, debounced ~650ms), save + send |
| **All Winners** | Manage existing records | Filter bar, master-detail list, inline edit with its own live preview, resend, hide (archive), Golden Ticket panel |
| **Recipients** | Configure who receives emails (least frequent) | Add form, on/off switches, delete, live counts |

The live preview is the centrepiece of the entry experience: it renders the real backend
template from the in-progress payload before anything is saved, so what the user sees is
always what will be sent.

---

## 13. Voice & Tone (UI copy)

The portal is used by non-technical staff from every department. All UI copy must be:

- **Plain** — no jargon. Say "Hide From Wall", not "Archive record"; "Who Gets The Emails",
  not "Distribution list configuration". Domain words that staff already know (Golden Ticket,
  Wall of Fame, Charter Champion) are fine.
- **Direct** — lead with the action: "Fill in every field marked with a star (*)."
- **Explanatory** — every screen says what it does and what happens next: "Nothing is sent
  until you press send."
- **Reassuring on errors** — error toasts say what failed and the next step: "Check the
  Recipients tab, then try again."

Avoid: record IDs as the primary label (use names), HTTP/status words, ALL-CAPS enum values
in visible copy (translate `PUBLISHED` → "On the wall").

---

## 14. Border & Opacity Conventions

Tailwind's colour opacity modifier only supports steps of 5 (`/5`, `/10`, ...). Values like
`border-white/7` silently generate **no CSS** and the border falls back to Tailwind's default
grey — this caused the original harsh borders. Therefore:

- For subtle sub-10% opacities, always use bracket syntax: `border-white/[0.05]`,
  `bg-white/[0.03]`, `border-gold/[0.08]`.
- Standard surfaces: card border `white/[0.05]`, control border `white/[0.06]`, hover
  `white/[0.10]–[0.12]`, dashed empty-state border `white/[0.09]`.
- Gold accents may use scale values (`gold/15`, `gold/25`) since they sit on the 5-step scale.

---

## 15. Motion System (GSAP)

CSS keyframes (§5) remain for the hero fade-ups and ambient orb drift. Everything data-driven
or interactive is animated with **GSAP** through three shared hooks in
`frontend/app/src/lib/animations.ts` — never with ad-hoc tweens in components:

| Hook / helper | What it does | Where it is used |
|---|---|---|
| `useStaggerReveal(selector, deps)` | Stagger-reveals matching descendants (rise 26px, `power3.out`, 0.06s stagger) every time `deps` change | Wall of Fame card grids (re-runs on month/filter change), admin winner list, recipient rows, Add Winner mount |
| `usePanelTransition(key)` | Fades/slides a container in when `key` changes | Admin tab switches (title block + panel), directory detail panel when a new winner is selected |
| `popIn(el)` | Springy scale-in (`back.out(2.2)`) | Step-indicator circles the moment a step completes |

Rules:

- Durations 0.4–0.6s, eases `power2/power3.out` for movement, `back.out` only for
  celebratory pops. No bounces on functional UI.
- Every hook checks `prefers-reduced-motion` and skips (content appears instantly).
- Element marking is via data attributes (`data-card`, `data-reveal`, `data-winner-item`,
  `data-recipient-row`) so markup stays readable.
- Buttons carry `active:scale-[0.97]` for press feedback; card hover lift stays CSS.

## 16. Logo

The official CWS mark (blue dashed-globe) lives at `frontend/app/public/brand/cws-logo.png`.

- **Web**: `CwsLogoMark` renders it inside a white circular chip (so the blue mark keeps
  contrast on dark backgrounds), sized sm/md/lg, with the wordmark alongside. Used across both
  walls (`Header`) and the admin portal. It is also the browser favicon (`index.html`).
- **Email**: each template masthead shows the logo via an **absolute URL** —
  `{{ hall_of_fame_url }}/brand/cws-logo.png` (44×44, white rounded chip). Email clients cannot
  load app-relative or `cid:` paths reliably, and they hide images until the recipient allows
  them, so the text wordmark beside it remains the fallback. Never inline the logo as SVG in
  email (clients strip SVG).

## 17. Email Iconography — No Emoji, No SVG

**Resolved July 2026.** Earlier templates used emoji (🏆 🤝 🎫) and later inline SVG for the
Golden Ticket crown. Both fail widely: emoji render inconsistently and look informal; **inline
SVG is stripped by Gmail, Outlook, and most clients** — that is why the crown "did not appear."

The rule for all email decoration:

- Use **plain-text dingbat glyphs** that render as font characters everywhere — e.g. `&#10038;`
  (✶ six-pointed star) for ornaments and dividers. These are text, not images, so nothing can
  strip them.
- Convey emphasis with **HTML/CSS structure** (bordered circular medallions, gold rules,
  letter-spaced labels, the "GT" monogram in Georgia serif) rather than iconography.
- The only raster image in an email is the logo (§16), loaded by absolute URL with the text
  masthead as fallback.

## 18. Golden Ticket Email

The Golden Ticket template (`backend/app/templates/emails/golden_ticket.html`) is the premium
artefact of the system — a foil-and-navy "admit one" ticket:

- Structure: foil gradient stripe → dark masthead (logo + "Admit One" stamp) → radial navy hero
  with a **"GT" monogram medallion** (gold-ringed circle, Georgia serif, ✶ ornaments) and
  occasion chip → perforated divider (dashed gold rule with rounded dark notches) → cream winner
  stub (award-type bar, pillar/value twin panels, serif story quote) → navy CEO letter panel with
  signature rule → gold CTA → uppercase footer strap.
- All decoration follows §17 (text glyphs + CSS, no emoji, no SVG). Colours are solid hex with
  gradient enhancements layered over `background` fallbacks, per §6 Outlook rules. Headings
  Georgia serif; body Arial.

---

*End of Design System*
