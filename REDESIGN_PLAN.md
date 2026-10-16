# BillBox Redesign v3 — "Cosmic Artistry"

Full rebuild of the BillBox web client: theme, tokens, components, layouts, every screen, states, motion, accessibility, performance, rollout.
Replaces `REDESIGN_PLAN.md` entirely. Same routes, same features. New look, new system, new structure.

**Stack target:** React + Vite + Tailwind v4 + Radix primitives (via shadcn/ui) + Lucide + TanStack (Query, Table) + react-hook-form + zod + recharts + sonner + cmdk.

---

## Direction in one screen

| | |
|:--|:--|
| **Feel** | Fintech dashboard with celestial precision. Cool, crisp, architectural. Think Stripe, Mercury, Linear, Ramp. |
| **Not** | Warm paper/cream, terracotta, serif headings, soft rounded blobs, glassmorphism, gradients, emoji, confetti, 3D tilt. |
| **Neutrals** | Cool Cosmic Slate & Mist (`#212A31`, `#2E3944`, `#748D92`, `#D3D9D4`). |
| **Accent** | Celestial Petrol Teal (`#124E66`). Used only for primary action, active nav, links, focus. |
| **Status** | Green = covered / matched. Amber = expiring / review. Red = expired / failed / destructive. |
| **Type** | Geist Sans + Geist Mono. Tabular numerals on every amount and date. |
| **Shape** | 8px controls, 12px cards, 16px modals. 1px borders. Almost no shadow. |
| **Density** | 14px body, 13px table text, 40px rows. Compact toggle at 32px. |
| **Themes** | Light and Dark, both designed (not inverted). System default. |
| **Truth rule** | Never show a number or claim the system doesn't have. Empty = zero + one action. |

---

## STEP 1 — Clean the ground (delete before building)

Do this first so nothing old leaks into the new system.

1. Delete `client/src/theme/theme.js`.
2. Delete the `slate-*` colour remap and all warm-palette variables from `index.css`.
3. Remove every emoji from JSX (216 instances). Replace with Lucide icons or nothing.
4. Remove the dead plugin classes: `animate-in`, `slide-in-from-*`, `zoom-in-95`.
5. Remove glass / blur / inset-shadow utility classes (`glass-bubble-dark`, etc.).
6. Delete fabricated data: hardcoded name "Laksh", fake Electronics bar, fake July/August chart data, "Digital Vault — Encrypted" strings, "Real-time logging active" strings, "Verified" badges.
7. Delete dead components: `SpendingChart.jsx`, `StatCard.jsx`, `ReceiptCard.jsx`, `WarrantyBadge.jsx`.
8. Add `<title>BillBox</title>` and a favicon to `index.html`. Delete the production error overlay.
9. Fix crashes before any visual work: `currSym` ReferenceError in the manual form, `nodemailer` import, bulk-delete endpoint.

**Done when:** app still runs, looks plain and broken-ish, and contains zero emoji and zero fake data.

---

## STEP 2 — Install the foundation

```bash
npm i tailwindcss @tailwindcss/vite
npm i @fontsource-variable/geist @fontsource-variable/geist-mono
npm i lucide-react sonner cmdk recharts motion date-fns
npm i @tanstack/react-query @tanstack/react-table
npm i react-hook-form zod @hookform/resolvers
npm i clsx tailwind-merge class-variance-authority
npx shadcn@latest init        # style: new-york, base colour: neutral, CSS variables: yes
npx shadcn@latest add button input textarea label select checkbox switch radio-group tabs \
  dialog sheet dropdown-menu popover tooltip command table badge skeleton separator \
  scroll-area progress calendar sonner breadcrumb pagination form
```

Rules:
- One font family pair only (Geist + Geist Mono), self-hosted, preloaded. No Google Fonts `@import`.
- Remove `react-hot-toast`, `framer-motion` if both exist (keep `motion` only).
- Components are copied into `src/components/ui/` (shadcn style) and then restyled with the tokens below. We own them.

---

## STEP 3 — Colour tokens

Three layers. Components may only use Layer 2 (semantic). Never hex, never raw ramps.

### 3.1 Primitives (`src/styles/tokens.css`)

```css
:root {
  /* Slate — cool neutral */
  --slate-0:   #FFFFFF;
  --slate-25:  #FAFAFB;
  --slate-50:  #F4F5F7;
  --slate-100: #ECEEF1;
  --slate-200: #DFE2E7;
  --slate-300: #C8CCD4;
  --slate-400: #9AA1AD;
  --slate-500: #6F7785;
  --slate-600: #525A68;
  --slate-700: #3A414D;
  --slate-800: #272C35;
  --slate-850: #1E222A;
  --slate-900: #181B22;
  --slate-950: #0E1015;

  /* Cosmic Artistry — Core Palette (Jeff Koons Moon Phases) */
  --cosmic-abyss:     #212A31; /* Deep slate abyss */
  --cosmic-midnight:  #2E3944; /* Dark slate cadet */
  --cosmic-petrol:    #124E66; /* Primary celestial petrol teal */
  --cosmic-steel:     #748D92; /* Muted sage slate */
  --cosmic-mist:      #D3D9D4; /* Pale platinum mist */

  /* Cosmic Teal — brand / action ramp */
  --cosmic-50:  #E8F1F3;
  --cosmic-100: #D0E2E7;
  --cosmic-200: #A1C6D0;
  --cosmic-300: #748D92;
  --cosmic-400: #427B8C;
  --cosmic-500: #236B85;
  --cosmic-600: #124E66;
  --cosmic-700: #0E3F53;
  --cosmic-800: #0A3141;
  --cosmic-900: #072330;

  /* Status */
  --green-tint: #E8F7F1;  --green-line: #A9E2CB;  --green-fg: #0A6B49;  --green-solid: #0F9D6B;
  --amber-tint: #FEF4E0;  --amber-line: #F3D69C;  --amber-fg: #8A5200;  --amber-solid: #C77700;
  --red-tint:   #FDECEA;  --red-line:   #F6BDB7;  --red-fg:   #A31B12;  --red-solid:   #D4291F;
}
```

### 3.2 Semantic — light

```css
:root, [data-theme="light"] {
  color-scheme: light;

  --bg-app:        #F6F8F8;              /* page background */
  --bg-surface:    #FFFFFF;              /* cards, tables, inputs */
  --bg-sidebar:    #ECEFEF;
  --bg-subtle:     #D3D9D4;              /* wells, chips, table header */
  --bg-hover:      #E5EAE9;
  --bg-pressed:    #D3D9D4;
  --bg-selected:   #E8F1F3;
  --bg-scrim:      rgb(33 42 49 / 0.50);

  --fg-primary:    #212A31;              /* 11.2:1 contrast on surface */
  --fg-secondary:  #2E3944;              /* 8.5:1 contrast */
  --fg-tertiary:   #526369;              /* 5.1:1 contrast */
  --fg-disabled:   #748D92;
  --fg-on-accent:  #FFFFFF;
  --fg-link:       #124E66;

  --line-subtle:   #E2E7E6;
  --line-default:  #D3D9D4;
  --line-strong:   #B7C0BF;
  --line-focus:    #124E66;

  --accent:        #124E66;              /* Cosmic Petrol Teal */
  --accent-hover:  #0E3F53;
  --accent-press:  #0A3141;
  --accent-tint:   #E8F1F3;
  --accent-line:   #A1C6D0;

  --ok-bg: var(--green-tint);  --ok-line: var(--green-line);  --ok-fg: var(--green-fg);  --ok-solid: var(--green-solid);
  --warn-bg: var(--amber-tint); --warn-line: var(--amber-line); --warn-fg: var(--warn-fg); --warn-solid: var(--amber-solid);
  --bad-bg: var(--red-tint);   --bad-line: var(--red-line);   --bad-fg: var(--red-fg);   --bad-solid: var(--red-solid);

  --chart-1: #124E66; --chart-2: #0F9D6B; --chart-3: #C77700;
  --chart-4: #748D92; --chart-5: #2E3944; --chart-6: #909EA1;
}
```

### 3.3 Semantic — dark

Dark is its own design: deep cosmic abyss surfaces, muted slate structures, and lifted teal highlights.

```css
[data-theme="dark"] {
  color-scheme: dark;

  --bg-app:        #182026;
  --bg-surface:    #212A31;              /* Cosmic Abyss */
  --bg-sidebar:    #182026;
  --bg-subtle:     #2E3944;              /* Space Cadet Slate */
  --bg-hover:      #2E3944;
  --bg-pressed:    #3C4A51;
  --bg-selected:   rgb(35 119 142 / 0.18);
  --bg-scrim:      rgb(10 14 18 / 0.70);

  --fg-primary:    #F6F8F8;              /* 12.8:1 contrast on surface */
  --fg-secondary:  #D3D9D4;              /* 8.7:1 contrast on surface */
  --fg-tertiary:   #909EA1;              /* 4.6:1 contrast on surface */
  --fg-disabled:   #748D92;
  --fg-on-accent:  #FFFFFF;
  --fg-link:       #58A3B9;

  --line-subtle:   #26323B;
  --line-default:  #2E3944;
  --line-strong:   #3C4A51;
  --line-focus:    #3E97B0;

  --accent:        #23778E;              /* Lifted Petrol Teal */
  --accent-hover:  #2C8CA7;
  --accent-press:  #1A6377;
  --accent-tint:   rgb(35 119 142 / 0.18);
  --accent-line:   rgb(62 151 176 / 0.40);

  --ok-bg: rgb(15 157 107 / 0.14);  --ok-line: rgb(15 157 107 / 0.40);  --ok-fg: #4FD1A1;  --ok-solid: #1FB783;
  --warn-bg: rgb(199 119 0 / 0.16); --warn-line: rgb(231 150 20 / 0.40); --warn-fg: #F2B24A; --warn-solid: #E8A026;
  --bad-bg: rgb(212 41 31 / 0.16);  --bad-line: rgb(240 90 80 / 0.40);  --bad-fg: #FF8C84;  --bad-solid: #F0554A;

  --chart-1: #3E97B0; --chart-2: #1FB783; --chart-3: #E8A026;
  --chart-4: #748D92; --chart-5: #D3D9D4; --chart-6: #909EA1;
}
```

### 3.4 Contrast contract

| Pair | Minimum |
|:--|:--|
| `fg-primary` / `fg-secondary` / `fg-tertiary` on `bg-surface` | 4.5:1 |
| `fg-on-accent` on `accent` | 4.5:1 |
| `*-fg` on `*-bg` (status) | 4.5:1 |
| `line-default` and focus ring against adjacent surface | 3:1 for anything that is the only visual boundary (inputs, focus) |
| Status is never colour-only | Always icon + text label |

Run axe + a contrast script in CI on both themes.

### 3.5 Tailwind mapping (`src/styles/theme.css`)

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme inline {
  --color-app: var(--bg-app);
  --color-surface: var(--bg-surface);
  --color-sidebar: var(--bg-sidebar);
  --color-subtle: var(--bg-subtle);
  --color-hover: var(--bg-hover);
  --color-selected: var(--bg-selected);

  --color-fg: var(--fg-primary);
  --color-fg-2: var(--fg-secondary);
  --color-fg-3: var(--fg-tertiary);
  --color-on-accent: var(--fg-on-accent);

  --color-line: var(--line-default);
  --color-line-subtle: var(--line-subtle);
  --color-line-strong: var(--line-strong);

  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-tint: var(--accent-tint);

  --color-ok: var(--ok-solid);   --color-ok-bg: var(--ok-bg);   --color-ok-fg: var(--ok-fg);   --color-ok-line: var(--ok-line);
  --color-warn: var(--warn-solid); --color-warn-bg: var(--warn-bg); --color-warn-fg: var(--warn-fg); --color-warn-line: var(--warn-line);
  --color-bad: var(--bad-solid); --color-bad-bg: var(--bad-bg); --color-bad-fg: var(--bad-fg); --color-bad-line: var(--bad-line);

  --font-sans: "Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, "SF Mono", Menlo, monospace;

  --radius-sm: 6px;   /* badges, checkboxes */
  --radius-md: 8px;   /* buttons, inputs, menus */
  --radius-lg: 12px;  /* cards, tables */
  --radius-xl: 16px;  /* dialogs, sheets */
}
```

Lint rule: ban `bg-[#`, `text-[#`, `slate-`, `indigo-`, `zinc-` and any `[Npx]` arbitrary value in `src/`.

---

## STEP 4 — Typography

Font: **Geist Variable** (UI) + **Geist Mono Variable** (invoice numbers, serials, IDs).

| Token | Size / line | Weight | Tracking | Use |
|:--|:--|:--|:--|:--|
| `display` | 32 / 38 | 600 | −0.025em | KPI hero figure on detail page (one per screen) |
| `title-1` | 24 / 30 | 600 | −0.02em | Page title |
| `title-2` | 18 / 26 | 600 | −0.01em | Section / dialog title |
| `title-3` | 15 / 22 | 600 | −0.005em | Card title |
| `body` | 14 / 20 | 400 | 0 | Default text, inputs, buttons |
| `body-strong` | 14 / 20 | 500 | 0 | Labels, nav items |
| `table` | 13 / 18 | 400 | 0 | Table cells, secondary text |
| `caption` | 12 / 16 | 400–500 | 0 | Helper text, metadata, badges |
| `overline` | 11 / 14 | 500 | +0.04em | Uppercase table headers only |

Rules:
- Weights allowed: 400, 500, 600. Wordmark may use 700.
- **Min size 12px**, except overline 11px uppercase headers. Nothing at 10px.
- All money, counts, percentages, dates: `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1, "ss01" 1;` via a `.tnum` utility. Right-align in tables.
- Invoice numbers, serials, tokens: Geist Mono, 13px.
- Sentence case everywhere. No ALL CAPS except overline table headers.
- Prose max width 68ch. Headings left-aligned (centre only on auth cards and empty states).

Base CSS:

```css
html { font-family: var(--font-sans); font-size: 16px; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
body { font-size: 0.875rem; line-height: 1.25rem; color: var(--fg-primary); background: var(--bg-app); }
.tnum { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
```

---

## STEP 5 — Space, size, radius, elevation, motion, z-index

**Space (4px base):** 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. Nothing else.
Rhythm: 8 inside components · 12–16 between fields · 16 between cards on mobile · 24 between cards on desktop · 32 between page sections.

**Control heights:** `sm` 32 · `md` 40 (default) · `lg` 48 (auth, mobile primary). Text inside is always 14px.

**Icons:** Lucide only. 16px default, 18px in sidebar, 20px in empty states, 24px max. Stroke 1.75. Inherit `currentColor`.

**Radius:** 6 badges · 8 controls/menus · 12 cards/tables · 16 dialogs/sheets · full for avatars/dots. No other radius.

**Borders:** 1px only. 2px only for the focus ring (`outline: 2px solid var(--line-focus); outline-offset: 2px`).

**Elevation:**

| Level | Light | Dark | Used by |
|:--|:--|:--|:--|
| 0 | border only | border only | cards, tables, panels |
| 1 | `0 1px 2px rgb(14 16 21 / .06)` | none | sticky header, hovered card |
| 2 | `0 8px 24px -8px rgb(14 16 21 / .16), 0 0 0 1px var(--line-default)` | `0 8px 24px -8px rgb(0 0 0 / .6), 0 0 0 1px var(--line-default)` | menus, popovers, toasts |
| 3 | `0 24px 56px -16px rgb(14 16 21 / .28), 0 0 0 1px var(--line-default)` | same, darker | dialogs, sheets, palette |

Never transition `box-shadow`. Hover feedback = border colour change.

**Motion tokens:**

```css
:root {
  --dur-fast: 120ms;   /* hover, focus, colour */
  --dur-base: 180ms;   /* menus, popovers, tabs */
  --dur-slow: 260ms;   /* dialogs, sheets */
  --ease-out: cubic-bezier(.2, 0, 0, 1);
  --ease-in:  cubic-bezier(.4, 0, 1, 1);
}
```

Hard ceiling 300ms. Animate only `transform` and `opacity`.

**Z-index:** base 0 · sticky 10 · sidebar 20 · header 30 · dropdown 40 · scrim 50 · modal 60 · palette 70 · toast 80 · tooltip 90. No literal `z-*` in components.

---

## STEP 6 — Brand, logo, imagery

- **Wordmark:** "BillBox" in Geist 700, −0.02em, `fg-primary`.
- **Mark:** 24×24 rounded square (radius 7) in solid `accent`, containing a white receipt glyph (Lucide `ReceiptText` outline, 14px). Flat. No gradient, no shadow.
- **Favicon:** the mark on transparent. Provide 32, 180 (apple-touch), and SVG.
- **No stock imagery, illustrations, blobs or mascots.** Empty states use a 20–24px Lucide icon in a 40px `bg-subtle` rounded square.
- **Merchant avatars:** 28px square, radius 8, flat `bg-subtle`, 2-letter initials in `fg-secondary` 12px/500. No colour hashing, no gradients.

---

## STEP 7 — Global setup: base CSS, theme switching, providers

### 7.1 No-flash theme script (`index.html`, inline in `<head>`)

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('billbox.theme') || 'system';
      var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    } catch (e) { document.documentElement.dataset.theme = 'light'; }
  })();
</script>
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/geist-latin-wght-normal.woff2" />
```

### 7.2 Base styles (`src/styles/base.css`)

```css
*, *::before, *::after { box-sizing: border-box; }
:focus-visible { outline: 2px solid var(--line-focus); outline-offset: 2px; border-radius: inherit; }
::selection { background: var(--accent-tint); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 8px; border: 2px solid var(--bg-app); }
@media print { :root { color-scheme: light; } .no-print { display: none !important; } }
```

### 7.3 Providers (`main.jsx`)
`ThemeProvider` → `QueryClientProvider` → `TooltipProvider` → `RouterProvider` + `<Toaster position="bottom-right" />`.

### 7.4 Preferences stored per user
Theme (light / dark / system), density (comfortable 40px / compact 32px), table vs grid view, sidebar collapsed. Persist in `localStorage` and sync to profile when logged in.

---

## STEP 8 — Core component library

All built on Radix via shadcn, restyled with tokens. Every component ships with: default, hover, active, focus-visible, disabled, loading, error (where relevant).

### 8.1 Button

| Variant | Background | Text | Border | Use |
|:--|:--|:--|:--|:--|
| `primary` | `accent` → `accent-hover` | `on-accent` | none | One per view region |
| `secondary` | `surface` → `hover` | `fg` | `line` | Default |
| `ghost` | transparent → `hover` | `fg-2` → `fg` | none | Toolbars, icon buttons |
| `danger` | `bad-solid` | white | none | Destructive confirm only |
| `danger-ghost` | transparent → `bad-bg` | `bad-fg` | none | Delete in menus |
| `link` | none | `fg-link` | none | Inline |

Sizes 32 / 40 / 48. Padding 12/16/20 horizontal. Radius 8. Weight 500. Icon-only buttons are square at the same heights and **MUST** carry `aria-label` + tooltip. Loading state: spinner (16px, 1.5s linear) replaces the leading icon, label stays, width locked, button disabled.

### 8.2 Inputs
- Height 40 (default), border `line`, bg `surface`, radius 8, 14px text, placeholder `fg-3`.
- Hover: border `line-strong`. Focus: border `line-focus` + 2px ring at 20% accent. Error: border `bad-solid`, message below in 12px `bad-fg` with `AlertCircle` icon.
- Label above, 13px/500. Helper below, 12px `fg-3`. Required marked by text "(required)" not asterisk colour.
- Currency input: right-aligned, tabular, prefix shows currency code (e.g., `INR`), grouping applied on blur only.
- Date input: Popover + Calendar, typed entry supported, format from user preference.
- Select: Radix Select, same 40px trigger, `ChevronsUpDown` icon.
- Search input: leading `Search` icon, trailing `⌘K` kbd chip (desktop only), clear button when filled.

### 8.3 Checkbox, Radio, Switch
Checkbox 16px, radius 4, checked = `accent` fill + white check. Switch 36×20. Radio 16px. Hit area 24px minimum via padding.

### 8.4 Badge / StatusBadge
Height 22, radius 6, 12px/500, 8px horizontal padding, 12px leading icon, 1px border.
Variants: `neutral` (subtle/fg-2/line), `accent`, `ok`, `warn`, `bad`. Always icon + text.

### 8.5 Tabs
Underline style. 40px tall, 14px/500, inactive `fg-2`, active `fg` with 2px `accent` underline. Optional count chip (`bg-subtle`, 12px tnum). Segmented variant for view switchers: pill group on `bg-subtle`, active segment `surface` + 1px border.

### 8.6 Dialog / Sheet / Popover / Dropdown / Tooltip
- **Dialog:** 480 default (sm 400, lg 640). Radius 16. Padding 24. Title 18/600, description 14 `fg-2`. Footer right-aligned: secondary left of primary. Scrim `bg-scrim`, no blur. Enter: opacity + 4px translateY, 180ms. Focus trapped, `Esc` closes, focus returns to trigger.
- **Sheet (drawer):** right, 480–560 wide; bottom sheet on mobile with 16px top radius and drag handle.
- **Dropdown / Popover:** surface, radius 8, elevation 2, 4px padding, items 32px tall, 8px radius, 14px text, icon 16px `fg-3`, shortcut right-aligned 12px mono.
- **Tooltip:** `slate-900` bg (light) / `slate-100` (dark), 12px, 6px radius, 400ms delay, never the only way to get information.

### 8.7 Toast (sonner)
Bottom-right, 360 wide, surface, elevation 2, left 3px status rail, 14px title, optional 13px description, one text-button action (e.g., "View receipt"). Auto-dismiss 5s (errors persist until dismissed). Max 3 stacked.

### 8.8 Skeleton
`bg-subtle`, radius matching the real element, 1.4s opacity pulse 0.6→1. Appears only after 200ms of loading. Shapes mirror final layout exactly.

### 8.9 Confirm dialog (replaces `window.confirm`)
Title states the action ("Delete 3 receipts?"), body states the consequence ("Their documents and linked products are removed. This can't be undone."), buttons "Cancel" / "Delete 3 receipts" (danger). For account-level destruction require typing the keyword.

### 8.10 Command palette (cmdk)
`⌘K` / `Ctrl+K` and `/` focus. 560 wide, radius 16, elevation 3, scrim. Groups: **Actions** (New receipt, Upload receipt, Add product, Toggle theme, Export data), **Go to** (all routes), **Receipts** (live server search, debounced 200ms, max 6), **Products** (max 4). Arrow keys + Enter, `Esc` closes. Result rows 40px with icon, label, hint on right. Overlay is the only glass-like layer allowed: none — use the plain scrim.

---

## STEP 9 — Data components

### 9.1 DataTable (TanStack Table)
- Container: `surface`, 1px `line`, radius 12, overflow hidden.
- Header row: 36px, `bg-subtle`, overline text, sticky under the page header (`top: 56px`), sort arrow 12px on active column only.
- Body rows: 40px (comfortable) / 32px (compact), 1px `line-subtle` divider, hover `hover`, selected `selected` + 2px `accent` left rail.
- Cell padding 12px horizontal. First column 16px. Numeric columns right-aligned + `.tnum`.
- Columns support: sort (server), resize (optional), hide (column menu), sticky first column on small screens.
- Row click opens detail; checkbox, menu button and links stop propagation.
- Row action menu (`MoreHorizontal`): View, Edit, Share, Download, Delete.
- Bulk bar: appears above table when rows selected — "3 selected · Delete · Export · Clear", replaces filter bar in-place (no layout shift).
- Footer: "Showing 1–25 of 156" left, page-size select + prev/next right. Server-side pagination only.
- Empty / loading / error states live inside the container (see Step 22).

### 9.2 Money
`<Money value currency original? />` renders `₹1,29,682.00` with tnum. Locale-aware grouping (en-IN for INR). Negative in `bad-fg` with minus sign. Missing = `—`. If converted, appends a `Converted` tooltip chip showing original amount. Never animate numbers.

### 9.3 DateCell
`<DateCell value format? relative? />` → `12 Oct 2026`, with `<time datetime>`. Relative form for warranties: "in 12 days" / "3 days ago", exact date on tooltip. Dates are rendered in the user's timezone; one server-provided `daysRemaining` value is used everywhere.

### 9.4 StatusBadge map (single source of truth)

| Status | Variant | Icon | Label |
|:--|:--|:--|:--|
| `active` | ok | `ShieldCheck` | Covered |
| `expiring` (≤30d) | warn | `Clock` | Expiring |
| `expired` | bad | `ShieldOff` | Expired |
| `none` | neutral | `Minus` | No cover |
| `needs_review` | warn | `AlertTriangle` | Needs review |
| `reconciled` | ok | `Check` | Matched |
| `failed` | bad | `XCircle` | Failed |
| `processing` | accent | `Loader2` | Processing |
| `not_configured` | neutral | `PlugZap` | Not configured |

Status values come from the server, never computed in the client.

### 9.5 KPI tile
Surface, radius 12, 1px line, 16px padding. Overline label (11px caps), value (`display` 28px tnum), delta line (13px, arrow icon + `ok-fg`/`bad-fg`/`fg-3`, "vs previous 30 days"), optional footer link "View →". Entire tile is a link when it navigates. No sparkline unless data exists. Zero state: `0` with `fg-3` hint.

### 9.6 Charts (recharts)
- Area/line for spend over time: 1.5px stroke `chart-1`, 8% fill, no dots until hover, horizontal gridlines only (`line-subtle`), 12px axis labels `fg-3`, tabular.
- Bar for category/merchant: horizontal bars, 8px tall, radius 4, labelled with value at end.
- Donut is not used.
- Tooltip: popover style, date + exact amount.
- Max 6 series; the rest group as "Other".
- Every chart has a text alternative (table toggle "View as table") and a `role="img"` label.
- No chart animation on load.

### 9.7 FilterBar
Single row: search · filter chips (Category, Warranty, Date, Status) · sort · density · view switch · "Reset". Each filter chip opens a popover with checkboxes/range. Active filters become removable chips under the bar. All filter state lives in the URL query string.

### 9.8 Timeline (activity & provenance)
Vertical line `line`, 8px dots (status colour), 13px text, relative time right-aligned `fg-3`.

### 9.9 Document viewer
Frame `bg-subtle`, radius 12. Toolbar (zoom −/+/fit, rotate, download, open in tab). Image: wheel zoom + drag pan. PDF: `<object>` on desktop, "Download PDF" card on iOS/mobile. Loading state is the real load event, not a timer.

### 9.10 EmptyState / ErrorState
Centred, 40px icon tile, title 15/600, 14px description `fg-2` (max 2 lines), exactly one primary action. No emoji, no illustration.

---

## STEP 10 — App shell

### 10.1 Desktop frame (≥1024)

```
┌──────────┬───────────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR (56)  breadcrumb · · · [⌘K Search] [+ New] │
│  240     ├───────────────────────────────────────────────────┤
│          │ PAGE (max 1280, padding 24/32)                    │
│          │   Page header: title · description · actions      │
│          │   Content                                         │
└──────────┴───────────────────────────────────────────────────┘
```

### 10.2 Sidebar (240px, collapses to 64px rail)
- Background `bg-sidebar`, 1px right border `line`.
- Top: mark + wordmark (56px tall block), collapse button.
- Nav items (40px tall, 8px radius, 18px icon, 14px/500): **Overview** (`LayoutDashboard`), **Receipts** (`ReceiptText`), **Products** (`Package`), **Warranties** (`ShieldCheck`, with amber count dot when items expiring), **Merchants** (`Store`), **Reminders** (`Bell`).
- Divider. **Settings** (`Settings`).
- Active: `bg-selected`, `accent` text/icon, no pill animation. Hover: `bg-hover`.
- Bottom: user row (28px avatar, name, email truncated, `ChevronsUpDown`) → dropdown: Profile, Settings, Theme (Light/Dark/System), Keyboard shortcuts, Sign out.
- Collapsed rail: icons only, tooltip on hover, state persisted.

### 10.3 Topbar (56px, sticky, `bg-surface`, bottom 1px line)
Left: breadcrumb (14px, last segment `fg`, others `fg-2`). Right: search trigger (240px, opens palette), **New receipt** primary button (hidden under 640 → icon), notification bell with count only when real notifications exist.
Solid background — no blur.

### 10.4 Mobile frame (<768)
- Topbar 52px: menu/back, title, search icon.
- **Bottom tab bar** 56px + safe area: Overview · Receipts · **Add** (centre, accent-filled circle 44px) · Warranties · More.
- "More" opens a sheet: Products, Merchants, Reminders, Settings, Theme, Sign out.
- Tables become stacked list rows (merchant + amount top line, meta bottom line, status badge right).
- Filters open in a bottom sheet.

### 10.5 Tablet (768–1023)
Sidebar collapsed rail by default; content full width; tables keep columns with horizontal scroll.

### 10.6 Page header template
Title (`title-1`), optional one-line description (`fg-2`), actions right-aligned (max one primary). Tabs, if any, sit directly beneath with 16px gap. 24px below before content.

### 10.7 Keyboard
`⌘K` palette · `/` focus search · `g` then `o/r/p/w/m` navigate · `n` new receipt · `?` shortcut sheet · `Esc` close. Shortcuts disabled while typing in inputs.

---

## STEP 11 — Auth screens (`/login`, `/register`, `/forgot-password`, `/reset-password/:token`)

Layout: split on ≥1024.
- **Left (form side)**: 400px column, vertically centred, wordmark top-left.
- **Right (brand panel, hidden <1024)**: `bg-surface` with 1px left border; a **static product screenshot-style preview** drawn in real components (receipts table with sample rows, clearly inside a "Preview" frame, no fake stats outside it). No gradients. No orbs.

Form:
- H1 "Sign in" (title-1), subtitle "Welcome back to BillBox." 14px `fg-2`.
- Inputs 48px (`lg`), labels above, inline validation on blur.
- Primary full-width button 48px. "Forgot password?" link right-aligned above button.
- Secondary: "Don't have an account? Create one".
- Register: name, email, password (with 4-segment strength bar + text label), confirm password. Terms line 12px.
- Forgot: email field → success state "If an account exists for that email, a reset link is on its way."
- Reset: new password + confirm.
- Error summary at top as `role="alert"` banner (bad tint) for server errors.
- Signed-in users are redirected to `/`.

---

## STEP 12 — Overview (`/`)

Purpose: answer four things in one screen — **what did I spend, what loses cover soon, did anything fail, what changed.**

```
Overview                                       [30d] [90d] [1y] [All]
Your spending and warranty status.

┌ Total spend ┐ ┌ Receipts ┐ ┌ Under warranty ┐ ┌ Expiring in 30d ┐
│ ₹12,45,600  │ │ 156      │ │ 24             │ │ 3               │
│ ▲ 12% vs prev│ │ 6 added  │ │ products       │ │ View →          │
└─────────────┘ └──────────┘ └────────────────┘ └─────────────────┘

┌ Spend over time (area chart) ─────────┐ ┌ Expiring soon ─────────┐
│                                       │ │ Item · date · N days   │
│                                       │ │ … (max 5)              │
└───────────────────────────────────────┘ └────────────────────────┘

┌ Recent receipts (5-row table) ────────┐ ┌ Activity ──────────────┐
└───────────────────────────────────────┘ └────────────────────────┘

┌ ⚠ 2 receipts need review — totals don't match   [Review] ────────┐
```

Rules:
- Grid: 4 KPI tiles (`grid-cols-4` ≥1024, 2 on tablet, 1 on mobile), then 8/4 split, then 8/4 split.
- Range selector is a segmented control; chart, KPIs and delta all follow it; stored in URL (`?range=90d`).
- Greeting removed. Page uses real user name only in the sidebar.
- Currency: totals in the user's display currency, with a caption "Converted to INR · 14 receipts in other currencies" when applicable.
- Needs-review banner only appears when count > 0.
- Expired bucket included in warranties summary (link goes to Warranties → Expired).
- Empty account: KPI tiles show `0` / `₹0`, chart replaced with EmptyState "No receipts yet" + **Upload receipt** button.
- Data comes from a lean overview endpoint — no base64 file data, no raw OCR.

---

## STEP 13 — Receipts list (`/receipts`)

- Page header: "Receipts" · count · actions: **Export** (secondary), **New receipt** (primary).
- FilterBar (Step 9.7). View switch: Table (default) / Grid.
- Table columns:

| Column | Width | Content |
|:--|:--|:--|
| ☐ | 40 | checkbox |
| Merchant | flex | avatar + name, invoice number below in mono 12px `fg-3` |
| Category | 140 | neutral badge |
| Items | 80 | count, tnum, right |
| Date | 120 | DateCell |
| Status | 120 | StatusBadge (needs review / matched) |
| Amount | 140 | Money, right, weight 500 |
| ⋯ | 48 | row menu |

- Grid view: 3-up cards (radius 12, 16px padding): thumbnail 4:3 `bg-subtle` top, merchant, amount, date, badge. Hover = border `line-strong` only.
- Bulk actions: Delete (confirm dialog), Export selected, Change category.
- Category filter options come from `/api/categories`.
- Sorting, filtering, pagination all server-side and URL-synced.
- Empty (no data): "No receipts yet" + Upload. Empty (filters): "No matching receipts" + **Reset filters**.

---

## STEP 14 — Add receipt (`/receipts/new`)

Segmented control: **Upload** · **Batch** · **Manual**.

### 14.1 Upload
1. **Dropzone:** 100% wide, 220px tall, dashed 1px `line-strong`, radius 12, centre `Upload` icon tile, "Drop a receipt here or browse", caption "PDF, JPG, PNG · up to 10 MB". Drag-over: border `accent`, bg `accent-tint`. Paste from clipboard supported.
2. **Processing:** replaces dropzone with a card showing filename, thumbnail, and a 3-step vertical progress (Reading document → Extracting fields → Matching categories). Each step has check / spinner / dot. Cancel button.
3. **Review (the key screen):** two resizable panes.

```
┌ Document ─────────────────────┬ Details ────────────────────────┐
│ toolbar: − + fit ↻ ↓          │ Merchant   [____________]       │
│ ┌───────────────────────────┐ │ Invoice no [____________]       │
│ │   document viewer         │ │ Date       [____________]       │
│ │                           │ │ Currency   [INR ▾]              │
│ │                           │ │ Category   [Electronics ▾]      │
│ └───────────────────────────┘ │ ─── Amounts ───                 │
│                               │ Subtotal / Tax / Shipping /     │
│                               │ Discount / Total                │
│                               │ ✓ Items add up to total         │
│                               │ ─── Line items (2) [+ Add] ───  │
│                               │ table: name · qty · price ·     │
│                               │        warranty · total         │
│                               │ [Cancel]          [Save receipt]│
└───────────────────────────────┴─────────────────────────────────┘
```
   - Fields extracted with low confidence get an amber dot and `Check` hint.
   - Reconciliation line: green "Items add up to total" or amber "Items differ from total by ₹X" with "Use item sum" action.
   - Save button disabled until required fields valid. Toast with "View receipt" action.
   - On mobile: tabs "Document" / "Details".

### 14.2 Batch
Dropzone (≤5 files) → status table (file · state · merchant · total · action). Each row opens review in a Sheet. **Save all** submits edited values, not raw OCR. Rows update live when OCR finishes.

### 14.3 Manual
Single-column form (max 640), same fields as review, line-items editable table. Currency symbol handled by the shared `<Money>` / `getCurrencySymbol` helpers.

---

## STEP 15 — Receipt detail (`/receipts/:id`)

Same two-pane frame as review, read-only by default.

- Header: back link, merchant (title-1), invoice number (mono), status badge, actions: **Edit**, **Share**, **Download**, ⋯ (Delete).
- Left: document viewer.
- Right, top to bottom: key facts (definition list: Date, Category, Payment, Currency), **Total** (`display`), breakdown table (subtotal, tax, shipping, discount), Line items table, Notes, Provenance (created, last edited, source, extraction confidence).
- Edit mode: right pane fields become inputs in place; sticky footer with Cancel / Save changes. Editing must preserve discount fields and `fileType`.
- **Share dialog:** Switch "Share link" off by default. When on: read-only input with link + Copy button, expiry select (Never / 7 days / 30 days), **Revoke link** (danger-ghost). Text: "Anyone with the link can view this receipt."
- Linked products section: list of products created from this receipt, each with warranty badge.

---

## STEP 16 — Warranties (`/warranties`)

The urgency view.

- Tabs with counts: **Expiring (3)** (default) · All · Covered · Expired · No cover.
- Table: product (avatar icon + name + brand) · merchant · purchased · expires · **days left** (tnum, bold, status-coloured) · cover bar (4px tall, width 96, elapsed %) · reminder switch · ⋯.
- Row accents: expiring rows have a static 3px `warn` left rail; expired rows `bad` rail. No pulsing.
- Right-side summary strip above table: counts as 4 inline stats (Covered / Expiring / Expired / No cover) — each is a clickable tab shortcut.
- Row click → product detail. Bulk: set reminder on/off.
- Server-side pagination; days-left is a single server field.

---

## STEP 17 — Products (`/products`, `/products/:id`)

**List:** table-first, grid optional. Columns: product · brand · category · merchant · purchased · warranty status · expires · value. Filters: search, category, warranty status, date.

**Detail:**
- Header: name, brand, StatusBadge, actions Edit / Delete.
- Warranty timeline: horizontal bar, nodes "Purchased — Today — Expires", fill to today, `ok` if >30d, `warn` ≤30d, `bad` if past. Days left shown large.
- Cards: Purchase (merchant, date, price, source receipt link), Warranty (period, expiry, reminders), Serial / model (mono).
- Reminder control: switch + lead time **only if the backend honours it**.
- Edit form collects **purchase date + period + unit**. Expiry and status are computed on the server and read-only in the UI. Changing the period shows "Reminder schedule reset."

---

## STEP 18 — Merchants (`/stores`, `/stores/:name`)

**List:** table — merchant (avatar + name) · receipts · products · total spend · last purchase. Search at top. Multi-currency totals grouped by currency or labelled; never summed across currencies silently.

**Detail:**
- Header with avatar, name, caption "Grouped by merchant name".
- 4 stat tiles: Total spend, Receipts, Average basket, First → last purchase.
- Chart: spend over time. Bar list: spend by category.
- Receipts table (paginated, 10 per page).

---

## STEP 19 — Reminders (`/reminders`)

- Tabs: **Upcoming** · **History**.
- Upcoming: table — product · expiry · next reminder date · channel · switch.
- History: table — sent at · product · recipient · delivery status (Sent / Failed / Not configured).
- If email isn't configured: a `warn` banner "Email delivery isn't configured. Reminders won't be sent." with link to Settings.
- Remove any control the backend ignores (lead-time selector, monthly digest) until it's real.

---

## STEP 20 — Settings (`/settings`)

Layout: left sub-nav (200px) + content (max 720). On mobile, sub-nav becomes top scrollable tabs.

| Section | Content |
|:--|:--|
| **Profile** | Avatar (initials), name, email, change password |
| **Preferences** | Display currency (note: "Display only. Receipts keep their original currency."), date format, timezone, theme (Light / Dark / System, with mini preview tiles), density |
| **Notifications** | Email alerts toggle, lead time (only if honoured), "Send test email" button with real result |
| **Data** | Export CSV, Export JSON (shows exact count, "Exporting 156 receipts"), documents archive download |
| **Danger zone** | Clear all data (type `DELETE`), Delete account (type email). Red-tinted card, lists exactly what is removed |

Each section is a card with title, description and a right-aligned Save button that activates only when dirty.

---

## STEP 21 — Public receipt, 404, error pages

- **Public receipt** (`/public/r/:token`): centred 680px printable column, no app chrome, light theme only. Header: wordmark + "Shared receipt" neutral badge. Merchant, date, invoice, total (`display`), line items table, "View document" and "Download" buttons, footer "Shared on {date}". `@media print` hides buttons and prints clean black on white. Invalid/revoked token: "This link is no longer available."
- **404:** centred, 40px icon tile, "Page not found" (title-1), one line, buttons "Back to overview" (primary) and "Go to receipts" (secondary).
- **Error boundary:** same layout, "Something went wrong", "Reload page" primary, "Copy error details" ghost. No emoji.
- **Offline banner:** top sticky amber strip "You're offline. Changes won't be saved."

---

## STEP 22 — States: loading, empty, error

Every data surface implements all eight:

| State | Treatment |
|:--|:--|
| Initial loading | Skeleton matching final layout (after 200ms delay) |
| Refetching | Keep data visible; thin 2px accent progress line under the topbar |
| Empty (no data) | EmptyState with one action |
| Empty (filtered) | EmptyState "No matches" + Reset filters |
| Partial | Show what loaded; inline `warn` notice for what didn't |
| Error | ErrorState inside the container + Retry button |
| Offline | Offline banner; reads from cache, writes disabled with tooltip |
| Success | Toast, never a blocking dialog |

Mutations: optimistic where safe (toggle switch, status change), with rollback toast on failure. Delete shows undo toast for 6s where the API supports soft-delete; otherwise confirm dialog.

---

## STEP 23 — Motion

Budget: only these patterns are allowed.

| Pattern | Spec |
|:--|:--|
| Hover / focus colour | 120ms `ease-out` |
| Dropdown / popover | opacity 0→1, translateY 4→0, 180ms |
| Dialog | opacity + translateY 8→0 + scrim fade, 260ms |
| Sheet | translateX(100%)→0, 260ms (bottom sheet translateY) |
| Tab panel | opacity 140ms |
| Toast | translateY 8→0 + opacity, 180ms |
| Sidebar collapse | width 200ms |
| Skeleton | opacity pulse 1.4s |
| Route change | opacity 0→1, 140ms (no slide, no blur) |

**Banned:** confetti, particles, 3D tilt, mouse-follow glow, parallax, count-up numbers, animated gradients, bouncing, looping decoration, any duration >300ms, animating `width/height/box-shadow/filter`.
Reduced motion: all transitions collapse to instant; no information is lost.

---

## STEP 24 — Accessibility (WCAG 2.2 AA)

- Semantic landmarks: `header`, `nav aria-label="Primary"`, `main#main`, one `h1` per page. Skip link "Skip to content" first in tab order.
- Full keyboard operation; visible 2px focus ring everywhere; no focus traps except modals; focus returns to trigger on close.
- All icon-only buttons have `aria-label`. Status never relies on colour alone.
- Forms: `label` bound with `htmlFor`, errors linked via `aria-describedby`, `aria-invalid`, summary announced with `role="alert"`.
- Tables: real `<table>`, `<th scope>`, sortable headers are buttons with `aria-sort`.
- Charts: `role="img"` + label + "View as table".
- Touch targets ≥ 44px on mobile, ≥ 24px on desktop.
- Usable at 200% zoom and 360px width with no horizontal page scroll (tables scroll inside their container).
- Respect `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`.
- CI: `eslint-plugin-jsx-a11y`, `axe-core` via Playwright on every route in both themes.

---

## STEP 25 — Responsive rules

| Breakpoint | Width | Layout |
|:--|:--|:--|
| `xs` | <480 | Single column, bottom tab bar, list rows instead of tables |
| `sm` | 480–767 | Same, 2-col KPI grid |
| `md` | 768–1023 | Rail sidebar, tables scroll horizontally, 2-col grids |
| `lg` | 1024–1279 | Full sidebar, 12-col grid |
| `xl` | ≥1280 | Content max 1280, centred |

Rules: content padding 16 (mobile) / 24 (tablet) / 32 (desktop). Dialogs become bottom sheets under 640. Two-pane review stacks into tabs under 1024. No fixed pixel widths on containers; use `max-w-*` and grid.

---

## STEP 26 — Microcopy

- Sentence case. Verbs on buttons: "Save receipt", "Delete 3 receipts", "Copy link".
- Plain and specific. No exclamation marks, no emoji, no "Oops", no "Awesome".
- Errors say what happened and what to do: "Couldn't upload the file. Check your connection and try again."
- Empty states: one factual line. "No receipts yet. Upload one to start tracking warranties."
- Destructive copy states the consequence.
- Never claim what isn't built: no "encrypted", "verified", "real-time", "secure vault", "AI-powered accuracy".
- Dates: `12 Oct 2026`. Relative: "in 12 days". Currency: `₹1,29,682.00` or `INR 1,29,682.00` when ambiguous.
- Use "Receipt" for the document, "Product" for a warranty item, "Merchant" for the seller.

---

## STEP 27 — Performance and code structure

**Budgets:** initial JS ≤ 180 KB gzip · each route chunk ≤ 60 KB gzip · LCP < 2.0s on mid-range mobile · CLS < 0.05 · INP < 200ms.

Do:
- Route-level `React.lazy` for every page; prefetch on nav hover.
- Lazy-load `recharts`, PDF viewer, and `cmdk` palette contents.
- List/overview endpoints return projections; **never** base64 `fileData` or raw OCR in list responses. Documents served from a separate authenticated endpoint with cache headers.
- Virtualise tables over 200 rows (`@tanstack/react-virtual`).
- Images: `loading="lazy"`, explicit width/height, thumbnails generated server-side.
- Fonts: one variable woff2 per family, `font-display: swap`, preloaded.

Directory structure:

```
src/
  app/            router, providers, shell (Sidebar, Topbar, MobileNav)
  components/ui/  shadcn primitives (restyled)
  components/data/  DataTable, Money, DateCell, StatusBadge, KpiTile, Chart, FilterBar, Timeline, DocViewer
  features/
    auth/ overview/ receipts/ capture/ products/ warranties/ merchants/ reminders/ settings/ public/
  lib/            api.js, format.js, query.js, cn.js, constants.js
  styles/         tokens.css, theme.css, base.css
```

Enforcement: ESLint bans raw colours/arbitrary px/emoji in JSX; Stylelint bans hex outside `tokens.css`; CI runs build size check, axe, and Playwright visual snapshots (light + dark) per route.

---

## STEP 28 — Rollout order

Work in this order. Each stage is mergeable on its own.

| # | Stage | Contents | Exit criteria |
|:--|:--|:--|:--|
| 1 | Clean | Step 1 | No emoji, no fake data, no crashes |
| 2 | Foundation | Steps 2–7 | Tokens live, themes switch with no flash, fonts self-hosted |
| 3 | Primitives | Step 8 | All core components restyled, Storybook/preview page shows every state in both themes |
| 4 | Data layer | Step 9 | DataTable, Money, DateCell, StatusBadge, KPI, Chart done |
| 5 | Shell | Step 10 | New sidebar/topbar/mobile nav + command palette; old header deleted |
| 6 | Auth | Step 11 | All four auth screens, recovery flow wired |
| 7 | Core flows | Steps 12–15 | Overview, Receipts, Capture, Receipt detail |
| 8 | Secondary | Steps 16–19 | Warranties, Products, Merchants, Reminders |
| 9 | Settings & edges | Steps 20–21 | Settings, public receipt, 404, error pages |
| 10 | Polish | Steps 22–27 | States, motion audit, a11y audit, perf budgets met |

---

## Final checklist (per screen, before merge)

- [ ] Uses only semantic tokens; no hex, no arbitrary px, no emoji
- [ ] Works in light and dark
- [ ] Body 14px, table 13px, nothing under 12px
- [ ] Amounts and dates use tabular figures, right-aligned in tables
- [ ] Missing values render `—`
- [ ] All eight states implemented
- [ ] Keyboard-only walkthrough passes; focus ring visible
- [ ] axe clean in both themes
- [ ] Works at 360px and at 200% zoom
- [ ] No animation over 300ms; only transform/opacity
- [ ] No claim in the UI that the system cannot back up
- [ ] Route chunk within budget; no `fileData` in the payload

---

## Appendix — Token cheat sheet

```
SPACE     0 4 8 12 16 20 24 32 40 48 64 80
TYPE      11 · 12 · 13 · 14 · 15 · 18 · 24 · 32     weights 400 500 600
RADIUS    6 badge · 8 control · 12 card · 16 dialog · full avatar
CONTROL   32 · 40 · 48
ROW       32 compact · 40 default
ICON      16 default · 18 nav · 20 empty · 24 max     stroke 1.75
SIDEBAR   240 / 64 rail        TOPBAR 56        CONTENT max 1280
MOTION    120 · 180 · 260      ceiling 300
ACCENT    Cosmic Petrol #124E66 (light) · #23778E (dark)
PALETTE   #212A31 · #2E3944 · #124E66 · #748D92 · #D3D9D4
```
