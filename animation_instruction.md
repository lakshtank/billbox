# BillBox — Animation, Effects, Transitions, Mobile & Toasts

Companion to `BILLBOX_REDESIGN_v3.md` ("Cosmic Artistry"). Same tokens, same components. This file adds the motion layer.

**Libraries used:** Motion · GSAP (+ScrollTrigger) · View Transitions API · NumberFlow · Vaul · Sonner · AutoAnimate · Lenis · dotLottie · canvas-confetti · Magic UI (copy-in components) · tw-animate-css.

---

## STEP 0 — Rules of the motion layer

### 0.1 Amendments to v3 Step 23
This file overrides v3's motion section where they conflict. Everything else in v3 still holds.

| v3 said | Now |
|:--|:--|
| No animated numbers | **Allowed on KPI tiles and "days left" only** (NumberFlow). Never in tables, receipt detail, public receipt, exports. |
| No confetti | **Allowed once**: first receipt ever saved. Never again. |
| No mouse-follow glow | **Allowed on KPI tiles and the auth brand panel only**, hover-capable devices only. |
| Route change: opacity only | **Shared-element morph + directional transitions** (View Transitions + Motion). |
| Ceiling 300ms | 300ms for UI. **Signature moments up to 600ms** (theme reveal, dashboard intro). Data draw-in up to 800ms. |

**Still banned:** parallax scroll, 3D card tilt, looping decorative animation, particle backgrounds, animated gradients, pulsing status indicators, bouncing, anything that delays a user action.

### 0.2 Four tiers

| Tier | Name | Examples | Always on? |
|:--|:--|:--|:--|
| **T1** | Micro | press, hover, focus, switch, copy→check | Yes |
| **T2** | Transition | dialogs, sheets, route changes, lists | Yes |
| **T3** | Choreography | dashboard intro, upload flow, chart draw | Skipped on lite/none |
| **T4** | Signature | theme reveal, first-receipt confetti, morph to detail | Skipped on lite/none |

### 0.3 Hard guardrails
1. Animate only `transform`, `opacity`, `clip-path`. Never `width/height/top/left/box-shadow/filter` (exception: tiny one-off `filter` inside View Transitions is browser-composited).
2. Nothing blocks input. Animations never delay a click, route or form submit.
3. Every animation has a reduced-motion fallback (instant or opacity-only).
4. Heavy libraries (GSAP, Lottie, confetti) load via dynamic `import()`, never in the initial bundle.
5. Money is always exact. A number may animate for ≤700ms, but the final value is in the DOM and `aria-label` from frame one.
6. Cap: max 12 simultaneously animating elements per screen. Stagger only the first 12 rows.

---

## STEP 1 — Install

```bash
npm i motion gsap @gsap/react @number-flow/react vaul sonner \
      @formkit/auto-animate lenis @lottiefiles/dotlottie-react canvas-confetti tw-animate-css
npm i -D @types/canvas-confetti
npx shadcn@latest add drawer           # wraps Vaul
```

Magic UI pieces (copy-in, built on Motion). Check the exact install command for each on magicui.design/docs before running:
- `border-beam` — upload dropzone and processing card
- `shimmer-button` — optional first-run CTA only
- `blur-fade` — section reveal

| Library | Role | Where | Loaded |
|:--|:--|:--|:--|
| **Motion** (`motion/react`) | layout/FLIP, presence, springs, gestures, scroll-linked | shell, lists, sheets, gestures | initial (tree-shaken, use `LazyMotion`) |
| **GSAP** + ScrollTrigger | timelines, choreography | dashboard intro, auth intro, upload sequence | lazy |
| **View Transitions API** | route morph, theme reveal | router, theme toggle | native |
| **NumberFlow** | rolling digits | KPI tiles, days-left | lazy with dashboard |
| **Vaul** | drag-to-dismiss bottom sheets | all mobile dialogs | lazy |
| **Sonner** | toasts | global | initial |
| **AutoAnimate** | zero-config list add/remove | small lists, chips | initial |
| **Lenis** | smooth scroll | desktop pages only | lazy |
| **dotLottie** | success/empty/processing animations | capture flow, empty states | lazy |
| **canvas-confetti** | first-receipt moment | capture success | lazy |
| **tw-animate-css** | Radix enter/exit classes | dialogs, menus, tooltips | CSS |

CSS import order in `theme.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
```

---

## STEP 2 — Motion foundation

### 2.1 Tokens in JS (`src/lib/motion.js`)

```js
export const ease = {
  out:   [0.2, 0, 0, 1],
  in:    [0.4, 0, 1, 1],
  inOut: [0.45, 0, 0.25, 1],
  emph:  [0.16, 1, 0.3, 1],     // expo-out feel for hero moves
};

export const spring = {
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 },   // buttons, toggles
  soft:   { type: 'spring', stiffness: 320, damping: 32 },              // sheets, bars, layout
  gentle: { type: 'spring', stiffness: 180, damping: 26 },              // large surfaces
};

export const dur = { fast: 0.12, base: 0.18, slow: 0.26, sig: 0.6 };

export const variants = {
  fadeUp:  { hidden: { opacity: 0, y: 8 },  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } } },
  fade:    { hidden: { opacity: 0 },        show: { opacity: 1,        transition: { duration: dur.base } } },
  scaleIn: { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1, transition: spring.snappy } },
  stagger: (gap = 0.04, delay = 0) => ({ show: { transition: { staggerChildren: gap, delayChildren: delay } } }),
};
```

### 2.2 Global provider (`main.jsx`)

```jsx
import { LazyMotion, domMax, MotionConfig } from 'motion/react';

<MotionConfig reducedMotion="user" transition={spring.soft}>
  <LazyMotion features={domMax} strict>
    <App />
  </LazyMotion>
</MotionConfig>
```
With `LazyMotion strict`, use `m.div` instead of `motion.div` everywhere (`import * as m from 'motion/react-m'`). `domMax` is required for layout animations and drag.

### 2.3 Motion tier hook (`src/hooks/useMotionTier.js`)

```js
import { useReducedMotion } from 'motion/react';

export function useMotionTier() {
  const reduced = useReducedMotion();
  if (reduced) return 'none';
  const lowCpu  = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMem  = (navigator.deviceMemory ?? 8) <= 2;
  const saveData = navigator.connection?.saveData;
  return lowCpu || lowMem || saveData ? 'lite' : 'full';
}
// none → T1 only, instant. lite → T1 + T2. full → everything.
```
Use it to gate T3/T4: `if (tier !== 'full') return;`.

### 2.4 CSS foundation (`base.css` additions)

```css
:root { --ease-inout: cubic-bezier(.45, 0, .25, 1); --ease-emph: cubic-bezier(.16, 1, .3, 1); }

/* Hover only where hover exists */
@media (hover: none) { .hover-only { display: none; } }

/* Skeleton: transform sweep, not background-position */
.skeleton { position: relative; overflow: hidden; background: var(--bg-subtle); border-radius: inherit; }
.skeleton::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--bg-hover), transparent);
  animation: sweep 1.4s var(--ease-inout) infinite;
}
@keyframes sweep { to { transform: translateX(100%); } }

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}
```

---

## STEP 3 — Route transitions (the "app feels native" layer)

Three kinds:
1. **Lateral** (sidebar to sidebar): quick crossfade + 6px rise.
2. **Drill-down** (list → detail): shared-element morph of the row's merchant avatar/thumbnail into the detail header.
3. **Back**: reverse.

### 3.1 Lateral — `AnimatedOutlet`

```jsx
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useLocation, useOutlet } from 'react-router-dom';

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const section = location.pathname.split('/')[1] || 'overview';   // only animate when section changes
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={section}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.2, 0, 0, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  );
}
```
Exit is 80ms so navigation never feels slow. Do not re-animate when only the `:id` or query string changes.

### 3.2 Drill-down — View Transitions API + React Router

Use React Router v7 (or a version that has the stable `viewTransition` prop).

```jsx
<Link to={`/receipts/${r.id}`} viewTransition>
  <Avatar style={{ viewTransitionName: `receipt-avatar-${r.id}` }} />
</Link>
```
On the detail page header:
```jsx
<Avatar style={{ viewTransitionName: `receipt-avatar-${id}` }} />
<h1 style={{ viewTransitionName: `receipt-title-${id}` }}>{merchant}</h1>
```
Only the clicked row has a name at transition time, so there are no duplicate-name errors. Use `useViewTransitionState(to)` to set the name only on the row being navigated.

```css
::view-transition-group(*) { animation-duration: 340ms; animation-timing-function: var(--ease-emph); }
::view-transition-old(root) { animation: fade-out 120ms var(--ease-in) both; }
::view-transition-new(root) { animation: fade-in 200ms var(--ease-out) both; }
@keyframes fade-in  { from { opacity: 0 } }
@keyframes fade-out { to   { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; } }
```
Fallback: browsers without the API navigate normally (lateral transition still plays).

### 3.3 Directional slide on mobile
On `<768px`, drill-down uses a push transition: new page `x: 24 → 0` + opacity, old page `x: 0 → -12` + opacity 0. Implement with `AnimatePresence custom={direction}` where `direction = +1` for deeper route depth and `-1` for shallower (compare `pathname.split('/').length`).

---

## STEP 4 — Shell animations

### 4.1 Sidebar collapse (240 ↔ 64)
Animate with Motion layout so text doesn't squash:

```jsx
<m.aside
  animate={{ width: collapsed ? 64 : 240 }}
  transition={spring.soft}
  className="sticky top-0 h-dvh border-r border-line bg-sidebar overflow-hidden"
>
  <nav>
    {items.map(i => (
      <NavLink key={i.to} to={i.to} className="relative flex h-10 items-center gap-3 px-3 rounded-md">
        {({ isActive }) => (<>
          {isActive && <m.span layoutId="nav-active" className="absolute inset-0 rounded-md bg-selected" transition={spring.snappy} />}
          <i.icon className="relative size-[18px]" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <m.span className="relative text-sm font-medium whitespace-nowrap"
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }}>
                {i.label}
              </m.span>
            )}
          </AnimatePresence>
        </>)}
      </NavLink>
    ))}
  </nav>
</m.aside>
```
The active highlight is a shared `layoutId` surface that **glides between items** on navigation (this is the only sliding indicator in the app, and it marks a state change, not a hover).

Width animation here is acceptable (one element, `overflow-hidden`, no reflow of content because labels are unmounted); if profiling shows jank, switch to `transform: translateX` on a fixed 240px panel.

### 4.2 Topbar scroll state
```jsx
const { scrollY } = useScroll();
const borderOpacity = useTransform(scrollY, [0, 16], [0, 1]);
<m.div style={{ opacity: borderOpacity }} className="absolute inset-x-0 bottom-0 h-px bg-line" />
```
At scroll 0 the topbar is flush with the page; after 16px the divider fades in. Cheap, opacity only.

### 4.3 Command palette
- Open: scrim fade 140ms; panel `scale 0.97 → 1`, `y -8 → 0`, spring `snappy`.
- Results: `AnimatePresence mode="popLayout"` with `layout` on each row so filtering reorders smoothly (FLIP).
- Active row highlight uses `layoutId="palette-active"` so the selection bar glides with arrow keys.
- Close: 100ms fade, no scale.

### 4.4 Mobile bottom tab bar
- Sliding active pill with `layoutId="tab-active"` (same trick as sidebar).
- Press feedback: `whileTap={{ scale: 0.92 }}` on icon.
- Centre **Add** button: `whileTap={{ scale: 0.94 }}`; on press opens the "Add" sheet (Upload / Manual / Batch).
- **Hide on scroll down, show on scroll up**:

```jsx
const { scrollY } = useScroll();
const [hidden, setHidden] = useState(false);
useMotionValueEvent(scrollY, 'change', (y) => {
  const prev = scrollY.getPrevious() ?? 0;
  setHidden(y > prev && y > 120);
});
<m.nav animate={{ y: hidden ? 'calc(100% + env(safe-area-inset-bottom))' : 0 }} transition={spring.soft} />
```

---

## STEP 5 — Dashboard choreography (T3)

### 5.1 Intro timeline (GSAP, lazy)

```jsx
// features/overview/useOverviewIntro.js
import { useGSAP } from '@gsap/react';
import { useMotionTier } from '@/hooks/useMotionTier';

export function useOverviewIntro(scope, ready) {
  const tier = useMotionTier();
  useGSAP(async () => {
    if (!ready || tier !== 'full') return;
    const { gsap } = await import('gsap');
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('[data-intro="header"]', { y: 8, opacity: 0, duration: 0.35 })
        .from('[data-intro="kpi"]',    { y: 14, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.15')
        .from('[data-intro="panel"]',  { y: 16, opacity: 0, duration: 0.5,  stagger: 0.08 }, '-=0.25')
        .from('[data-intro="row"]',    { x: -8, opacity: 0, duration: 0.3,  stagger: 0.03 }, '-=0.3');
    });
    return () => mm.revert();
  }, { scope, dependencies: [ready, tier] });
}
```
Rules: plays once per session (store `sessionStorage.introPlayed`), never on range change, never on refetch. Total runtime ≤ 900ms. Content is visible by default in CSS; GSAP uses `from` so if JS fails nothing is hidden.

### 5.2 KPI numbers — NumberFlow

```jsx
import NumberFlow from '@number-flow/react';
import { useEffect, useState } from 'react';

export function KpiValue({ value, currency }) {
  const [v, setV] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setV(value)); return () => cancelAnimationFrame(id); }, [value]);
  return (
    <NumberFlow
      value={v}
      locales="en-IN"
      format={currency ? { style: 'currency', currency, maximumFractionDigits: 0 } : undefined}
      transformTiming={{ duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }}
      spinTiming={{ duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }}
      className="tnum text-[28px] font-semibold tracking-tight"
      aria-label={new Intl.NumberFormat('en-IN', currency ? { style:'currency', currency } : {}).format(value)}
    />
  );
}
```
- Digits roll individually on mount and when the range changes (30d → 90d), so the user sees *what changed*.
- Delta chip uses `trend` colouring: green up / red down, arrow rotates with a spring.
- Use tabular numerals: `font-variant-numeric: tabular-nums` so width doesn't jitter.

### 5.3 Range switch (30d / 90d / 1y / All)
- Segmented control uses a `layoutId="range-pill"` sliding thumb.
- KPI values roll (NumberFlow).
- Chart **morphs** to the new series (Recharts animates path interpolation when `data` changes, `animationDuration={600}`).
- Table/list panels crossfade: `AnimatePresence mode="popLayout"` keyed by `range`, 140ms.
- Show the thin 2px accent progress line under the topbar while fetching; keep previous data visible (no skeleton flash).

### 5.4 Skeleton → content
```jsx
<AnimatePresence mode="popLayout" initial={false}>
  {isLoading
    ? <m.div key="sk" exit={{ opacity: 0, transition: { duration: 0.1 } }}><Skeleton/></m.div>
    : <m.div key="ct" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.18 } }}><Content/></m.div>}
</AnimatePresence>
```

### 5.5 KPI spotlight border (T3, hover-capable only)

```jsx
function SpotlightTile({ children }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return <div ref={ref} onPointerMove={onMove} className="spotlight rounded-lg border border-line bg-surface p-4">{children}</div>;
}
```
```css
@media (hover: hover) and (pointer: fine) {
  .spotlight { position: relative; }
  .spotlight::before {
    content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none; opacity: 0;
    transition: opacity var(--dur-base, 180ms);
    background: radial-gradient(180px circle at var(--mx) var(--my), var(--accent-line), transparent 70%);
    mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);   /* border-only reveal */
    padding: 1px;
  }
  .spotlight:hover::before { opacity: 1; }
}
```
It lights only the 1px border near the cursor. No effect on touch.

---

## STEP 6 — Tables & lists

### 6.1 First-load row stagger
Only first render, only first 12 rows:

```jsx
<m.tbody variants={variants.stagger(0.025)} initial={firstLoad ? 'hidden' : false} animate="show">
  {rows.slice(0, 12).map(r => <m.tr key={r.id} variants={variants.fade} />)}
  {rows.slice(12).map(r => <tr key={r.id} />)}
</m.tbody>
```

### 6.2 Sorting / filtering reorder (FLIP)
Add `layout="position"` to each `m.tr` and wrap in `<LayoutGroup>`. When the server returns a new order, rows glide to their new slots (200ms soft spring). Disable above 50 rows (`layout` off) to protect performance.

### 6.3 Bulk selection bar
```jsx
<AnimatePresence>
  {selected.length > 0 && (
    <m.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={spring.snappy}
           className="sticky top-14 z-10 flex h-12 items-center gap-3 rounded-lg border border-accent-line bg-accent-tint px-4">
      <NumberFlow value={selected.length} /> selected …
    </m.div>
  )}
</AnimatePresence>
```
The count rolls as selection changes.

### 6.4 Row delete
Row collapses with `exit={{ opacity: 0, height: 0 }}` inside `AnimatePresence` (height OK here: single row, short, `overflow-hidden`). Paired with the Undo toast (Step 12).

### 6.5 Chips, tags, small lists (AutoAnimate)
```jsx
const [parent] = useAutoAnimate({ duration: 180, easing: 'ease-out' });
<ul ref={parent}>{chips.map(c => <li key={c.id}>…</li>)}</ul>
```
Use for filter chips, line-item editor rows, reminder lists. Zero config, respects reduced motion.

### 6.6 Mobile swipe actions (list rows)

```jsx
function SwipeRow({ children, onDelete, onShare }) {
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-120, -40], [1, 0]);
  return (
    <div className="relative overflow-hidden">
      <m.div style={{ opacity: actionsOpacity }} className="absolute inset-y-0 right-0 flex">
        <button className="w-16 bg-accent text-on-accent" onClick={onShare}>Share</button>
        <button className="w-16 bg-bad text-white" onClick={onDelete}>Delete</button>
      </m.div>
      <m.div drag="x" dragConstraints={{ left: -128, right: 0 }} dragElastic={0.08} style={{ x }}
        onDragEnd={(_, i) => animate(x, i.offset.x < -64 || i.velocity.x < -400 ? -128 : 0, spring.snappy)}
        className="relative bg-surface">
        {children}
      </m.div>
    </div>
  );
}
```
Light haptic on open: `navigator.vibrate?.(8)` (Android only; iOS ignores it). Actions are also available in the row menu — swipe is a shortcut, never the only path.

### 6.7 Pull to refresh (mobile, list pages)
Use a `drag="y"` container only when `scrollTop === 0`. Show a 24px spinner that scales/rotates with drag distance (`useTransform`), trigger refetch past 72px, release with `spring.soft`.

---

## STEP 7 — Capture flow (the showpiece, T3/T4)

### 7.1 Dropzone
- Idle: dashed border.
- Drag-over: border turns `accent`, background `accent-tint`, icon tile scales `1 → 1.08` (spring snappy), caption changes to "Release to upload".
- Add **Border Beam** (Magic UI, celestial teal #124E66 to #3E97B0) to the dropzone while a file is hovering — a light beam travelling the border (CSS `offset-path` animation, GPU friendly). Remove it on drop.
- Paste (`Ctrl+V`) triggers the same accept animation.

### 7.2 Processing card
- File thumbnail slides into the left pane with `layoutId="doc-thumb"` (same id used by the review pane → the thumbnail **grows into the document viewer**).
- 3-step progress (Reading → Extracting → Matching). Each step:
  - pending: 8px grey dot
  - active: ring spinner (SVG circle `pathLength` loop)
  - done: SVG check **draws** (`pathLength 0 → 1`, 220ms)
- Connector line between steps fills via `scaleY` from `top` origin as each completes.
- Steps advance on **real backend events** (poll/SSE), never on timers.

### 7.3 Scan effect on the document
Only while status is `processing`:

```css
.scan { position: relative; overflow: hidden; }
.scan::after {
  content: ""; position: absolute; inset-inline: 0; top: 0; height: 64px;
  background: linear-gradient(to bottom, transparent, var(--accent-tint), var(--accent-line));
  transform: translateY(-100%); animation: scan 1.8s var(--ease-inout) infinite;
  pointer-events: none;
}
@keyframes scan { to { transform: translateY(calc(100% + var(--scan-h, 480px))); } }
@media (prefers-reduced-motion: reduce) { .scan::after { animation: none; display: none; } }
```
Remove the class the moment extraction finishes. This is the only looping effect allowed, and it maps to a real in-progress state.

### 7.4 Field auto-fill reveal
When extraction completes, fields populate in reading order:

```jsx
fields.forEach((f, i) => animate(
  `[data-field="${f}"]`,
  { opacity: [0, 1], y: [4, 0] },
  { delay: i * 0.045, duration: 0.24, ease: ease.out }
));
```
Each field also gets a one-shot highlight overlay: `background: var(--accent-tint)` fading to transparent over 900ms (opacity animation on a pseudo-element). Low-confidence fields then show an amber dot that pops in (`scale 0 → 1`, spring snappy).

### 7.5 Reconciliation line
"Items add up to total" ↔ "Items differ by ₹X": swap with `AnimatePresence mode="wait"`; icon morphs check ↔ alert (cross-scale 120ms). Colour transitions via `transition: color, background-color 140ms`.

### 7.6 Save success (T4)
1. Button: label crossfades to spinner (width locked), then to a check (draw), 180ms.
2. Toast appears (Step 12) with "View receipt".
3. **First receipt ever only:** lazy-import `canvas-confetti`, fire one subtle burst from the button position:

```js
export async function firstReceiptMoment(el) {
  if (localStorage.getItem('billbox.firstReceipt')) return;
  localStorage.setItem('billbox.firstReceipt', '1');
  const { default: confetti } = await import('canvas-confetti');
  const r = el.getBoundingClientRect();
  confetti({
    particleCount: 70, spread: 60, startVelocity: 28, ticks: 140, scalar: 0.8, gravity: 1.1,
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
    colors: ['#124E66', '#3E97B0', '#0F9D6B', '#D3D9D4'],
    disableForReducedMotion: true,
  });
}
```
4. Optional: play a 600ms dotLottie checkmark in the review header (`<DotLottieReact src="/lottie/success.lottie" autoplay loop={false} />`). Source a free animation from LottieFiles, recolour to Cosmic Teal/green, and store it in `/public/lottie/`.
5. Route to the receipt with the shared-element morph (Step 3.2).

### 7.7 Batch table
Rows update in place: status badge cross-fades `Processing → Ready`, extracted merchant and total fade in with the field reveal. A row that completes after the user opened its drawer updates live (no stale blanks).

---

## STEP 8 — Receipt detail

- **Entry:** avatar + title shared-element morph from list row (Step 3.2). Right pane sections fade-up with 40ms stagger.
- **Document viewer:** Motion gestures.
  - Wheel zoom: `useMotionValue(scale)`, clamp 0.5–4, animate with `spring.snappy`.
  - Drag pan: `drag` with `dragMomentum` (inertia) and bounds computed from the zoomed size.
  - Double-click / double-tap: toggle fit ↔ 2×, animated.
  - Pinch-zoom on touch via `onPointerDown` pair tracking or `@use-gesture/react` `usePinch`.
- **Edit toggle:** read-only text and inputs swap with `AnimatePresence mode="popLayout"`, each field `layout="position"` so height changes don't jump. Sticky save bar slides up from bottom (`y: 100% → 0`, spring soft).
- **Copy actions** (invoice no., share link): icon morph `Copy → Check` (Step 13.4).
- **Share switch on:** link input expands (`height` auto via `layout`), then focus + select text.

---

## STEP 9 — Warranties & products

- **Cover bar:** `scaleX` from 0 to elapsed fraction (`transform-origin: left`), 500ms `ease.emph`, runs when row first enters viewport (`whileInView`, `once`).
- **Days left:** NumberFlow, counting down from a rounded-up start on first view; colour changes by status.
- **Product timeline (Purchased → Today → Expires):** line draws left→right (`pathLength`), "Today" marker drops in with a spring, label fades. 700ms total, once per visit.
- **Tabs (Expiring / All / Covered / Expired):** underline is a shared `layoutId="warranty-tab"` that glides; counts roll with NumberFlow; list crossfades 140ms.
- **Reminder switch:** thumb spring, track colour 120ms, optimistic with rollback shake on failure.
- Expiring/expired rails stay **static**. No pulsing.

---

## STEP 10 — Charts

Recharts config:

```jsx
<AreaChart data={data}>
  <Area type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={1.5}
        fill="url(#fillSpend)" isAnimationActive={tier === 'full'}
        animationDuration={800} animationEasing="ease-out" dot={false}
        activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-surface)' }} />
  <defs><linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"  stopColor="var(--chart-1)" stopOpacity={0.14} />
    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
  </linearGradient></defs>
  <Tooltip cursor={{ stroke: 'var(--line-strong)', strokeDasharray: '3 3' }} content={<ChartTooltip />} isAnimationActive={false} />
</AreaChart>
```
(The soft area fade is a chart fill, not a decorative gradient.)

- **Reveal:** chart draws left→right once when it scrolls into view (`useInView`, then set `isAnimationActive`).
- **Hover focus (bar lists):** hovered bar stays full opacity, siblings drop to 0.45 (`transition: opacity 120ms`).
- **Tooltip:** follows cursor with `useSpring` x/y for a slightly weighted feel; content swaps instantly (no fade).
- **Legend toggle:** toggling a series fades it to 0 and re-scales the axis.

---

## STEP 11 — Dialogs, sheets, drawers, menus

### 11.1 Radix enter/exit via tw-animate-css
```jsx
// DialogContent
className="data-[state=open]:animate-in data-[state=closed]:animate-out
           data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
           data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.98]
           data-[state=open]:slide-in-from-bottom-2 duration-200"
// Overlay
className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-150"
```
Popover/Dropdown: `slide-in-from-top-1` (side-aware via `data-[side=...]`), 140ms. Tooltip: `fade-in-0 zoom-in-95`, 120ms.

### 11.2 Responsive Dialog → Drawer (Vaul)

```jsx
export function ResponsiveModal({ open, onOpenChange, title, description, children }) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  if (isMobile) return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerContent className="max-h-[92dvh] rounded-t-2xl">
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle>{description && <DrawerDescription>{description}</DrawerDescription>}</DrawerHeader>
        <div className="overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">{children}</div>
      </DrawerContent>
    </Drawer>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle>{description && <DialogDescription>{description}</DialogDescription>}</DialogHeader>{children}</DialogContent>
    </Dialog>
  );
}
```
Use it for **every** modal in the app (share, confirm, add product, filters). On phones you get drag handle, velocity-based dismiss, rubber-band, and the page behind scales to 0.95 with rounded corners (set `data-vaul-drawer-wrapper` on the app root).

Snap points for the filter sheet: `snapPoints={[0.5, 1]}`.

### 11.3 Side sheet (desktop)
Right sheet slides `x: 100% → 0` with `spring.soft`; scrim fades; content below header fades up with 30ms stagger.

---

## STEP 12 — Toasts (Sonner, fully themed)

### 12.1 Mount

```jsx
// app/Toaster.jsx
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  return (
    <Sonner
      position={isMobile ? 'top-center' : 'bottom-right'}
      visibleToasts={3}
      gap={8}
      offset={{ bottom: 24, right: 24 }}
      mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 8px)', left: 12, right: 12 }}
      closeButton
      expand={false}
      duration={5000}
      swipeDirections={isMobile ? ['up'] : ['right']}
      theme="system"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:       'toast group relative flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-3 pr-9 shadow-[var(--elev-2)] text-sm text-fg',
          title:       'font-medium leading-5',
          description: 'mt-0.5 text-[13px] leading-[18px] text-fg-2',
          actionButton:'ml-auto shrink-0 rounded-md px-2 h-7 text-[13px] font-medium text-accent hover:bg-accent-tint',
          cancelButton:'rounded-md px-2 h-7 text-[13px] text-fg-2 hover:bg-hover',
          closeButton: 'absolute right-2 top-2 size-6 rounded-md text-fg-3 hover:bg-hover',
          success:     'toast-ok',
          error:       'toast-bad',
          warning:     'toast-warn',
          info:        'toast-info',
        },
      }}
    />
  );
}
```

```css
/* left status rail + icon colour */
.toast::before { content: ""; position: absolute; inset-block: 8px; left: 0; width: 3px; border-radius: 3px; background: var(--line-strong); }
.toast-ok::before   { background: var(--ok-solid); }
.toast-bad::before  { background: var(--bad-solid); }
.toast-warn::before { background: var(--warn-solid); }
.toast-info::before { background: var(--accent); }

/* countdown bar (transform only) */
.toast .countdown { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; transform-origin: left; background: var(--line-strong);
  animation: countdown var(--toast-duration, 5s) linear forwards; }
.toast:hover .countdown { animation-play-state: paused; }
@keyframes countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }
```

### 12.2 One API for the whole app (`lib/notify.js`)

```js
import { toast } from 'sonner';
import { Check, AlertTriangle, XCircle, Info } from 'lucide-react';

const buzz = (ms = 8) => navigator.vibrate?.(ms);

export const notify = {
  success: (title, opts) => (buzz(), toast.success(title, { icon: <Check className="size-4 text-ok" />, ...opts })),
  error:   (title, opts) => (buzz(20), toast.error(title,  { icon: <XCircle className="size-4 text-bad" />, duration: Infinity, ...opts })),
  warn:    (title, opts) => toast.warning(title, { icon: <AlertTriangle className="size-4 text-warn" />, ...opts }),
  info:    (title, opts) => toast.info(title, { icon: <Info className="size-4 text-accent" />, ...opts }),

  // loading → success/error in the SAME toast (icon morphs)
  promise: (p, msgs) => toast.promise(p, {
    loading: msgs.loading,
    success: msgs.success,
    error:   msgs.error,
  }),

  // destructive with undo + visible countdown
  undo: ({ title, onUndo, onCommit, ms = 6000 }) => {
    const t = setTimeout(onCommit, ms);
    toast(title, {
      duration: ms,
      action: { label: 'Undo', onClick: () => { clearTimeout(t); onUndo(); } },
      onDismiss: () => {},
    });
  },
};
```

### 12.3 Toast catalogue (exact copy & behaviour)

| Event | Toast | Persist | Action |
|:--|:--|:--|:--|
| Receipt saved | "Receipt saved" | 5s | **View receipt** |
| Upload running | promise: "Uploading…" → "Receipt uploaded" / "Couldn't upload. Try again." | until resolved | Retry on error |
| Receipt deleted | "Receipt deleted" | 6s with countdown | **Undo** |
| Bulk delete | "3 receipts deleted" | 6s | **Undo** |
| Link copied | "Link copied" | 2s | — |
| Share on / off | "Sharing turned on" / "Sharing turned off" | 4s | — |
| Reminder toggled | "Reminder on for {product}" | 3s | — |
| Reminder schedule reset | "Reminder schedule reset" | 4s | — |
| Export started | promise: "Exporting 156 receipts…" → "Export ready" | until resolved | **Download** |
| Network lost | "You're offline" | until back online | — |
| Network back | "Back online" | 3s | — |
| Save failed | "Couldn't save changes" | until dismissed | **Retry** |

Rules: max 3 visible; identical toasts dedupe by `id`; errors never auto-dismiss; no toast for things the user can already see happen (e.g., switching a tab); toasts never cover the mobile bottom tab bar (they're top-anchored on phones).

### 12.4 Entrance feel
Sonner's default stacking/slide is kept (it is well tuned). Layer on: icon pops in with `scale 0.6 → 1` spring (use a small `m.span` wrapper), and for `success` the check **draws** (SVG `pathLength`) over 220ms.

---

## STEP 13 — Micro-interactions (T1)

### 13.1 Button press & loading
```jsx
<m.button whileTap={{ scale: 0.97 }} transition={spring.snappy} … />
```
Loading: leading icon swaps to spinner via `AnimatePresence mode="wait"` (100ms), button width locked with `min-width` from measured ref, label stays.

### 13.2 Switch
Thumb is a `m.span` with `layout` and `transition={spring.snappy}`; track colour `transition: background-color 120ms`.

### 13.3 Checkbox draw
```jsx
<svg viewBox="0 0 16 16"><m.path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2"
  initial={false} animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ duration: 0.16 }} /></svg>
```

### 13.4 Copy → Check morph
```jsx
<AnimatePresence mode="wait" initial={false}>
  <m.span key={copied ? 'ok' : 'copy'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }}>
    {copied ? <Check className="size-4 text-ok" /> : <Copy className="size-4" />}
  </m.span>
</AnimatePresence>
```
Reverts after 1.6s.

### 13.5 Input error shake (one-shot)
```css
@keyframes shake { 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
[aria-invalid="true"].shake { animation: shake 240ms var(--ease-out); }
```
Add the `shake` class once on a failed submit; remove on `animationend`. Error message fades/slides down 4px (140ms).

### 13.6 Password strength bar
Four segments, each `scaleX` fill with 60ms stagger; colour steps red → amber → green → green.

### 13.7 Tab underline, segmented pills, nav pill
All share `layoutId` gliding with `spring.snappy`. One `layoutId` namespace per control.

### 13.8 Theme toggle — circular reveal (T4)

```js
import { flushSync } from 'react-dom';

export async function setThemeAnimated(next, originEl) {
  const apply = () => { document.documentElement.dataset.theme = next; localStorage.setItem('billbox.theme', next); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduced) return apply();

  const { left, top, width, height } = originEl.getBoundingClientRect();
  const x = left + width / 2, y = top + height / 2;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  const t = document.startViewTransition(() => flushSync(apply));
  await t.ready;
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
    { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' }
  );
}
```
```css
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 2; }
```
The new theme expands outward from the toggle like a wave. Falls back to an instant switch.

### 13.9 Hover (desktop only)
Wrap all hover styles in `@media (hover:hover) and (pointer:fine)`. Allowed hovers: colour/border change (120ms), icon nudge `translateX(2px)` on "View →" links, row action buttons fade in. No scaling cards, no lifts.

---

## STEP 14 — Scroll effects

### 14.1 Lenis (desktop pointer devices only)

```jsx
import { ReactLenis } from 'lenis/react';

export function SmoothScroll({ children }) {
  const tier = useMotionTier();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  if (tier !== 'full' || !fine) return children;
  return <ReactLenis root options={{ lerp: 0.12, smoothWheel: true, syncTouch: false, anchors: true }}>{children}</ReactLenis>;
}
```
Disable on routes with virtualised tables (`handle: { smooth: false }` in the route config) and inside dialogs (`data-lenis-prevent` on scroll containers).

### 14.2 Scroll-linked progress
Receipt detail and Settings long pages: 2px accent line at top, `scaleX` bound to `useScroll().scrollYProgress` (with `useSpring` smoothing).

### 14.3 Sticky table header
Header gains a bottom shadow only when stuck: `IntersectionObserver` on a 1px sentinel above the header toggles a `data-stuck` attribute; shadow is opacity-faded via a pseudo-element.

### 14.4 Reveal on scroll
`whileInView` with `viewport={{ once: true, margin: '-10% 0px' }}`, `fadeUp` variant. Use only for below-the-fold panels on Overview, Merchant detail and Settings. Never in tables.

---

## STEP 15 — Auth screens

Brand panel (right side, ≥1024px):
- **Intro (GSAP, once):** a mock receipts table built from real components (labelled "Preview") builds in row by row: header fades, rows slide-fade with 70ms stagger, one row's status badge flips Processing → Matched at 1.2s, KPI chip ticks up via NumberFlow. Total ≈ 2s, then stops (no loop).
- **Cursor spotlight:** a soft radial highlight on the panel follows the pointer (same technique as Step 5.5, larger radius, `accent-tint`). Disabled on touch.
- **Form side:** fields fade-up with 50ms stagger; submit button width-locks during loading; on server error the card does a single shake and focuses the first invalid field.
- **Success (login):** form fades out 120ms, route morphs to Overview.

---

## STEP 16 — Mobile responsiveness & mobile motion

### 16.1 Breakpoints & layout (from v3, enforced here)

| Range | Behaviour |
|:--|:--|
| <480 | single column, bottom tab bar, list rows (no tables), Vaul sheets |
| 480–767 | same, 2-col KPI grid |
| 768–1023 | rail sidebar, tables scroll inside container, two-pane review becomes tabs |
| 1024+ | full sidebar, two-pane layouts |

### 16.2 Required CSS

```css
html { -webkit-text-size-adjust: 100%; }
body { min-height: 100dvh; overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }
.app-root { padding-inline: max(16px, env(safe-area-inset-left)) max(16px, env(safe-area-inset-right)); }
.tabbar { padding-bottom: env(safe-area-inset-bottom); }
main { padding-bottom: calc(72px + env(safe-area-inset-bottom)); }   /* clear the tab bar on mobile */

/* iOS zooms inputs under 16px. Fix on mobile only (amends v3's 14px) */
@media (max-width: 767px) { input, select, textarea { font-size: 16px; } }

button, [role="button"], a { touch-action: manipulation; }          /* kills 300ms tap delay + double-tap zoom */
.scroll-x { overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x proximity; }
.long-list > * { content-visibility: auto; contain-intrinsic-size: auto 56px; }
```

### 16.3 Mobile component rules
- Touch targets ≥ 44×44. Row height 56 on mobile.
- Tables → **stacked rows**: top line merchant + amount (right, tnum), bottom line date · category, status badge trailing. Implemented with the same `columns` config and a `renderMobileRow` prop.
- Filters open in a Vaul sheet with snap points `[0.5, 1]`; "Apply" sticky at bottom.
- Receipt review: tabs **Document | Details**; switching tabs uses a horizontal slide (`x: ±16` + fade, 180ms) in the direction of the tab order.
- Document viewer: pinch-zoom + double-tap; toolbar becomes a floating pill at the bottom.
- Sidebar replaced by tab bar + "More" sheet.
- Dialogs always become drawers (Step 11.2).
- Keyboard handling: when the keyboard opens, scroll the focused field into view using `visualViewport`:
```js
visualViewport?.addEventListener('resize', () => document.activeElement?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
```
- Orientation: tab bar hides in landscape under 500px height.

### 16.4 Motion on mobile
| Effect | Mobile behaviour |
|:--|:--|
| Hover effects, spotlight, cursor glow | Off |
| Lenis smooth scroll | Off (native momentum) |
| Route transition | Push/pop slide (Step 3.3) |
| Dashboard intro | Shortened: KPIs stagger only, 500ms |
| Chart draw | 500ms, once |
| Confetti | Fewer particles (40) |
| Haptics | Light `vibrate` on success/error/swipe-open (Android) |
| Low-end devices (`tier = lite`) | T1 + T2 only |

### 16.5 Container queries for cards
Use `@container` on KPI tiles and panels so they adapt to the column they sit in, not just the viewport:
```css
.kpi { container-type: inline-size; }
@container (max-width: 180px) { .kpi .delta { display: none; } .kpi .value { font-size: 24px; } }
```

---

## STEP 17 — Performance & accessibility gates

### 17.1 Loading strategy
```js
// lazy features
const Overview = lazy(() => import('@/features/overview'));
// lazy libs, inside effects/handlers only
const { gsap } = await import('gsap');
const { default: confetti } = await import('canvas-confetti');
```
Budget: motion layer adds ≤ 35 KB gzip to the initial bundle (Motion `LazyMotion` + Sonner + AutoAnimate). GSAP, Lottie, confetti, Lenis, NumberFlow load with the screens that use them.

### 17.2 Frame budget
- 60fps target; no long task >50ms during any animation.
- `will-change` only on elements actively animating, removed after (Motion/GSAP do this).
- Profile every T3/T4 animation in Chrome DevTools with 4× CPU throttle; if it drops below 50fps, move it to `lite`-disabled.

### 17.3 Reduced motion matrix

| Feature | `prefers-reduced-motion: reduce` |
|:--|:--|
| Route transition | instant |
| Shared-element morph | instant |
| Intro timelines | skipped, content visible |
| NumberFlow | final value immediately |
| Confetti, Lottie | skipped |
| Scan effect, skeleton sweep | static |
| Toasts, dialogs, sheets | opacity only, 100ms |
| Theme reveal | instant swap |
| Lenis | off |
| Swipe, drag, pinch | still work (they're input, not decoration) |

### 17.4 Testing
- Playwright: run every route with `reducedMotion: 'reduce'` and with CPU throttle; assert no layout shift (CLS < 0.05) and that primary actions are clickable within 100ms of navigation.
- Visual snapshots after `animations: 'disabled'`.
- Manual: iPhone Safari + low-end Android pass for sheets, swipe, pull-to-refresh, toasts, tab-bar hide.
- Lighthouse mobile: Performance ≥ 90 on Overview and Receipts.

---

## STEP 18 — Animation inventory (single source of truth)

| Screen | Animation | Tool | Tier | Duration |
|:--|:--|:--|:--|:--|
| Global | Route lateral fade | Motion | T2 | 80/180ms |
| Global | List → detail morph | View Transitions | T4 | 340ms |
| Global | Theme circular reveal | View Transitions | T4 | 520ms |
| Global | Toasts | Sonner + CSS | T2 | native |
| Global | Modal → bottom drawer (mobile) | Vaul | T2 | native |
| Shell | Sidebar collapse | Motion | T2 | spring |
| Shell | Active nav glide | Motion `layoutId` | T1 | spring |
| Shell | Palette open + selection glide | Motion | T2 | spring |
| Shell (mobile) | Tab bar hide/show, active glide | Motion | T2 | spring |
| Overview | Intro timeline | GSAP | T3 | ≤900ms once |
| Overview | KPI rolling digits | NumberFlow | T3 | 700ms |
| Overview | KPI border spotlight | CSS | T3 | — |
| Overview | Range pill + chart morph | Motion + Recharts | T3 | 600ms |
| Receipts | First-load stagger, FLIP reorder | Motion | T3 | 25ms/row |
| Receipts | Bulk bar slide, count roll | Motion + NumberFlow | T2 | spring |
| Receipts | Row delete + undo | Motion + Sonner | T2 | 180ms |
| Receipts (mobile) | Swipe actions, pull-to-refresh | Motion drag | T2 | spring |
| Capture | Drag-over, border beam | CSS + Magic UI | T3 | — |
| Capture | Step progress, check draw | Motion SVG | T3 | 220ms |
| Capture | Document scan sweep | CSS | T3 | 1.8s loop (while processing only) |
| Capture | Field auto-fill reveal | Motion `animate` | T3 | 45ms stagger |
| Capture | Save → check → toast | Motion + Sonner | T2 | 180ms |
| Capture | First-receipt confetti | canvas-confetti | T4 | once ever |
| Detail | Doc zoom/pan/pinch | Motion gestures | T2 | spring |
| Detail | Edit-mode swap, save bar | Motion | T2 | spring |
| Warranties | Cover bar fill, timeline draw | Motion | T3 | 500–700ms once |
| Warranties | Days-left roll | NumberFlow | T3 | 700ms |
| Charts | Draw-in, tooltip spring, hover dim | Recharts + Motion | T3 | 800ms |
| Forms | Press, switch, checkbox draw, copy morph, shake | Motion + CSS | T1 | 100–240ms |
| Auth | Panel build-in, spotlight | GSAP + CSS | T3 | ~2s once |
| Scroll | Progress line, header shadow, reveals | Motion | T2 | — |

---

## STEP 19 — Rollout order

| # | Stage | Contents | Exit check |
|:--|:--|:--|:--|
| 1 | Foundation | Steps 1, 2 (tokens, `MotionConfig`, `LazyMotion`, tier hook, CSS) | Reduced-motion and tier switch work |
| 2 | Primitives | Step 13 (micro), Step 11 (dialogs, Vaul) | Every control has press/focus/loading states |
| 3 | Toasts | Step 12 | Catalogue implemented, mobile top-anchored |
| 4 | Shell | Steps 3, 4 | Route transitions, sidebar, palette, tab bar |
| 5 | Data | Steps 5, 6, 10 | Dashboard intro, NumberFlow, tables, charts |
| 6 | Capture | Step 7 | Full upload → review → save choreography |
| 7 | Detail & warranties | Steps 8, 9 | Morph, viewer gestures, timelines |
| 8 | Auth & scroll | Steps 14, 15 | Brand panel, Lenis (desktop only) |
| 9 | Mobile pass | Step 16 | Real-device test on iOS + Android |
| 10 | Gates | Step 17 | Perf budgets, a11y, reduced-motion tests green |

---

## Final checklist

- [ ] Only `transform` / `opacity` / `clip-path` animated (named exceptions documented)
- [ ] `MotionConfig reducedMotion="user"` set; every T3/T4 effect gated by `useMotionTier`
- [ ] GSAP, Lottie, confetti, Lenis, NumberFlow loaded lazily
- [ ] Numbers animate only on KPI tiles and days-left; tables and detail are static
- [ ] Confetti fires once per account
- [ ] Hover effects wrapped in `(hover: hover) and (pointer: fine)`
- [ ] All modals become Vaul drawers under 640px
- [ ] Inputs are 16px on mobile; safe-area insets applied; `100dvh` used
- [ ] Toasts: top on mobile, bottom-right on desktop, errors persist, undo has countdown
- [ ] Intro animations play once per session and never block interaction
- [ ] 4× CPU-throttled profile holds ≥ 50fps on T3/T4 effects
- [ ] axe clean; keyboard and screen-reader behaviour unchanged by animation
