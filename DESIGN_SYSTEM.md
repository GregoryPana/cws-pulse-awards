# CWS Pulse Awards — Design System
**Document Type:** Frontend Design Reference
**Owner:** Gregory, Digital Transformation Office
**Status:** Confirmed — apply from Phase 1 onwards

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

**Background per page**: Charter Champions uses `--color-navy` as body background; Instant Impact uses `--color-deep`. This intentional difference gives the gold award type a deeper, more dramatic feel.

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

### Month Navigation

- Buttons: Outfit font, 12px, 600 weight
- Jan–Dec buttons + "All" button
- Active state per award type:
  - Charter Champion active: `background: var(--color-blue)`, white text
  - Instant Impact active: `background: linear-gradient(135deg, var(--color-amber), var(--color-gold))`, navy text
- Horizontal scroll on mobile (no wrapping)

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

*End of Design System*
