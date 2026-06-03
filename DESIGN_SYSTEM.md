# CWS Pulse Awards — Design System
**Document Type:** Frontend Design Reference
**Owner:** Gregory, Digital Transformation Office
**Status:** Confirmed — apply from Phase 1 onwards

---

## 1. Fonts

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
| `--font-display` | Cormorant Garamond | Georgia, serif | Hero H1, winner names (featured), section headers, decorative quotes |
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
  --color-navy:       #0A2240;
  --color-deep:       #060F1E;
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
| Charter Champion | `--color-blue` | `--color-sky` | blue → sky | rgba(0,112,192,.2) | `--color-sky` |
| Instant Impact | `--color-amber` | `--color-gold` | amber → gold → gold-soft | rgba(245,166,35,.15) | `--color-gold-soft` |
| Golden Ticket | `--color-gold` | `--color-gold-soft` | Full gold treatment — amber → gold → gold-soft | rgba(245,166,35,.15) | `--color-gold` |

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

Featured (Golden Ticket) card spans full grid width with a two-column layout:
- Left column: person details, pillar, category badge, nominated by
- Right column: story panel with larger typography, optional impact stat block

### Avatar

- Size: 56px standard, 72px featured
- If `photo_url` is set: `<img>` tag with rounded-full, object-cover
- If no photo: initials computed as `firstName[0] + lastName[0]`, uppercase
- Background: gradient per award type (blue→sky for Charter Champion, amber→gold for Instant Impact)
- Golden Ticket ring: `box-shadow: 0 0 0 3px var(--color-gold), 0 4px 20px rgba(245,166,35,.3)`

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

### Live badge dot pulse

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .4; transform: scale(.7); }
}
```

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

*End of Design System*
