---
inclusion: always
---

# Design System — "Midnight & Gilt" (illuminated instrument)

The locked visual contract, prototyped in coop.css / coop.js / the Command
Center HTML. Implement ONCE as CSS custom properties + Tailwind theme in
src/styles/globals.css. Do NOT reinvent values per component. Centralizing
means a palette change is one edit. This SUPERSEDES the v1.2 architecture
§9 palette.

## Philosophy
Gilded, warm, faith-forward. JARVIS by way of an illuminated manuscript.
A calm daily instrument, not a showpiece. Three pillars: Finance
(stewardship), Priorities (mission), Scripture (foundation). Gold is the
signature; indigo is C.O.O.P.'s own voice; serif is reserved for scripture.
Static in Sprint 2; motion (Sprint 5) must remain optional.

## Color tokens (exact)
| Token         | Value                    | Role                              |
|---------------|--------------------------|-----------------------------------|
| bg            | #0b0a09                  | Base (warm near-black)            |
| bg-2          | #110d0a                  | Secondary background              |
| panel         | rgba(26,23,18,0.55)      | Gilded glass panel fill           |
| panel-deep    | rgba(18,15,11,0.50)      | Inset fill (inputs, chips, acct)  |
| border        | rgba(210,170,90,0.12)    | Panel/edge border (rest)          |
| border-hover  | rgba(222,186,112,0.30)   | Border (focus/hover)              |
| text          | #f1ebdd                  | Primary text (warm off-white)     |
| text-soft     | #b6ab96                  | Secondary text                    |
| text-faint    | #7c715c                  | Tertiary / metadata text          |
| gold          | #d8a94b                  | Signature accent                  |
| gold-hi       | #f0cd84                  | Highlight gold (gradients/glints) |
| indigo        | #5663c9                  | C.O.O.P.'s voice — AI/system cue  |
| good          | #5fbf91                  | Positive / high-energy / on-track |
| warn          | #e0934e                  | Caution / medium                  |
| alert         | #d8556b                  | High priority / over budget       |
Derived: --glow-gold / --glow-indigo via color-mix(... 50%, transparent).
Base bg is a radial warm gradient:
  radial-gradient(1200px 800px at 68% -10%, var(--bg-2), var(--bg) 60%).
--glow-mult (default 1) scales every accent glow. --radius: 20px.

## Typography
- Sora (200–600) — UI + display. Big figures use weight 200; body 300.
  Wire via next/font as --font-sora; Tailwind font-sans.
- Spline Sans Mono (300–500) — ALL metadata, labels, timestamps, tags,
  status. --font-mono; Tailwind font-mono. The mono sells the "instrument".
- Newsreader (italic, 300–500) — scripture/verse text ONLY. --font-serif;
  Tailwind font-serif. Pair with a gold-gradient dropcap.

## Surfaces & effects (STATIC in Sprint 2)
- Panels: 20px radius, backdrop-filter blur(22px), fill var(--panel), a 1px
  GOLD gradient border via mask technique (135deg: gold 30% → transparent →
  gold-hi 22%), deep drop shadow + faint warm inset highlight. Hover lifts
  the border to border-hover + a low gold halo.
- Accent glows are low-opacity gold halos (box-shadow), never solid neon,
  all scaled by --glow-mult.
- Priority bar: base = gold; .med = warn; .high = alert (3px vertical bar).
- Energy tag: .hi = good (green, high energy is positive); .md = warn;
  .lo = text-faint. (Mono pill.)
- Status/presence dot + "now" marker + ai-note glyph (✦) + response toast
  = indigo.

## Motion (Sprint 5 ONLY — do NOT build in Sprint 2)
Ambient gold glow halos drifting (80–110s), 26-particle gold/indigo field
rising, faint masked gold grid + vignette, panel rise-in (staggered via
--d), sigil-ring pulse, presence/now-node "breathe", recall-fill, shimmer,
cmd-spark rotate on focus, response typewriter. ALL gated by BOTH
prefers-reduced-motion AND the body classes .no-motion / .no-particles.
In Sprint 2: define the body-class hooks + --glow-mult, ship the static
ambient layer divs (no animation), and add NOTHING that moves.

## Layout (the command-center frame)
- Left status rail: fixed ~92px. Gold sigil monogram ("C") + ring, mono
  "C.O.O.P." id, vertical icon nav (DASH, FOCUS=Productivity, FINANCE,
  KNOW, A.I.), bottom: indigo presence dot + "READY" + live clock.
  Hidden ≤760px (→ bottom nav).
- Top command bar ("the soul"): sticky. C.O.O.P.'s greeting + voice clause
  on one line; a mono status cluster (date · weather · LOCAL time ·
  "C.O.O.P. READY"); the ⌘K "Ask C.O.O.P." field (gold ✦ spark, ⌘K hint);
  a row of quick-prompt chips.
- Panel grid: 12-col. Spans:
  * Priorities  grid-column 1 / span 7;  row 1 / span 2   (LEAD)
  * Calendar    grid-column 8 / span 5;  row 1 / span 2
  * Finance     grid-column 1 / span 7;  row 3            (floor, hero-weight)
  * Verse       grid-column 8 / span 5;  row 3            (floor)
  LAYOUT NOTE (locked): the dashboard leads with Priorities (top-left) and
  puts the Finance hero on the floor row. Both lead columns are 7-wide
  hero-weight panels; Finance keeps its hero treatment regardless of row.
  This Priorities-led arrangement is confirmed — build to it.
- Response toast: fixed, indigo-accented, where "Ask C.O.O.P." answers land.

## Responsive
- ≤1180px: two-up — Priorities/Calendar on row 1, Finance/Verse on row 2.
- ≤760px: rail hidden → fixed glass bottom nav (HOME/FOCUS/FINANCE/KNOW/
  A.I.); panels single column (Priorities, Calendar, Finance, Verse);
  command bar + ⌘K stay accessible; toast docks to the bottom.

## Productivity module (Sprint 2) — source of truth + Option B projection
The `/productivity` surface is built to `design-reference/productivity.{css,js}`
— that prototype is the visual + interaction source of truth. Its CSS is ported
into `src/styles/globals.css` (tokens mapped to --font-* / colour vars, motion
stripped for Sprint 2). Its layout: equal-width Projects and Tasks columns
(`.prod-grid` 1fr / 1fr, `align-items: stretch` so both panels share height),
a client-side project filter-chip row, status-tiered
project cards with a completion progress bar, priority-accented task rows, a
C.O.O.P.-voice foot note on the Tasks panel, and segmented-control create/edit
modals with a two-click inline delete confirm.

Option B (locked): the prototype's leaner model is a VIEW over the full Sprint-1
Prisma schema — we do NOT migrate the schema down. `src/components/productivity/
view.ts` holds the single, TOTAL projection:
- project status → tier: ACTIVE→active (gold), DONE→done (indigo),
  PAUSED/ARCHIVED→planned (faint).
- priority → tier: CRITICAL/HIGH→high (alert), MEDIUM→medium (warn), LOW→low (faint).
- task status → done/open (only DONE is "done").
Pills/labels show the REAL enum value; only the colour tier is projected, so any
value the DB holds (CRITICAL, IN_PROGRESS, BLOCKED, PAUSED, ARCHIVED, energy,
notes, description, project.priority) still renders and round-trips. The modal
forms surface only the prototype's fields; omitted columns take server defaults
on create and are preserved (`.partial()` PATCH) on edit. Reintroducing any of
them later is a UI change, not a migration.

Note: the dashboard Priorities panel is the Command Center surface (coop.css),
not this module — it keeps its own PriorityBar/EnergyTag treatment.

## Finance module (Sprint 3) — source of truth + Option B projection
The `/finance` surface is built to `design-reference/finance.{css,js}` — that
prototype is the visual + interaction source of truth (it replaces the MODULE
STANDBY on that route). Its CSS ports into `src/styles/globals.css` (tokens
mapped to --font-* / colour vars, motion stripped). Its shape:
- A gilded segmented **tab strip** (`.fin-tabs`) with three tabs — **REPORTING**,
  **LEDGER**, **BUDGETING**. Keyboard-reachable (arrow/Home/End roving tabindex,
  aria-selected + aria-controls); one pane visible at a time.
- **Reporting** (read-only telemetry, 12-col grid): a net-worth hero (span 7)
  with a period-selector chip row (THIS MONTH / QUARTER / YTD) + a computed
  sparkline; a cash-flow panel (span 5 — income vs spend bar + net); an
  assets-vs-liabilities account rollup (span 7) with a NET POSITION line; a
  spend-by-category bar list (span 5, top 6); and a full-width recent
  transactions list (span 12).
- **Ledger** (manual CRUD): an accounts panel (span 5) of add/edit/delete cards
  and a transactions panel (span 7) with an account filter-chip row, amount-tinted
  rows (inflow good / outflow alert), a two-click inline delete confirm, a
  latest-30 cap, and a C.O.O.P.-voice foot note.
- **Budgeting**: a static MODULE STANDBY panel only (targets/envelopes deferred —
  they need their own model; a later sprint).
- Reuses the productivity control primitives verbatim: the gilded "+" add pill,
  the edit/delete icon buttons, the filter chips, and the segmented-control
  create/edit modal (Esc closes, Enter saves). Finance colour semantics:
  good = inflow / on-track, alert = outflow / liability / negative net,
  warn = caution.

Balances are MANUAL (locked): account balances are maintained by hand and net
worth is computed from them (assets − liabilities). Transactions are a
**ledger/record** — they do NOT recompute or drive balances (no double-entry).
Cash flow, spend-by-category and the sparkline are derived from the transactions
in the selected period.

Option B (locked): the prototype's model is a VIEW over the Sprint-1 Prisma
schema — we do NOT migrate the schema down. `src/components/finance/view.ts`
holds the single, TOTAL projection between the two:
- **direction**: DB `Transaction.amount` is a single SIGNED Decimal
  (negative = outflow, per architecture §4). The prototype's `flow: "in"|"out"`
  + positive amount is a projection — read: `amount < 0 → flow "out"`,
  magnitude = `abs(amount)`; write: `flow + magnitude → signed Decimal`.
- **liability**: prototype `liability` ↔ Prisma `Account.isLiability`.
- **type**: prototype lowercase type ↔ `AccountType` enum (uppercased for the
  mono tag).
- **source**: the prototype has none; every create sets `source: MANUAL`
  (CSV_IMPORT is deferred to a later sprint, behind a pluggable
  import-source interface — an adapter add, not a schema change).
- **category**: free-text String, uppercased in the UI; round-trips as-is.

Two points where the app follows the Prisma schema over the prototype (NOT the
reverse — no migration):
- **Transactions always belong to an account.** `Transaction.accountId` is
  REQUIRED; the prototype's "UNLINKED"/orphan state is a prototype-only
  affordance and is NOT carried into the app. The Add/Edit Transaction form
  always requires an account.
- **Account deletion.** The schema is `onDelete: Cascade` (deleting an account
  deletes its transactions); the prototype orphans them instead. Sprint 3 must
  choose deliberately — recommended: GUARD deletion of an account that still
  has transactions (block + confirm) rather than silently cascading real
  financial records. Resolve in the Sprint 3 spec.

The modal forms surface only the prototype's fields; omitted columns
(created/updated, source) take service-set values on create and are preserved
(`.partial()` PATCH) on edit — same discipline as productivity. Reads happen in
Server Components via `src/lib/finance/`; mutations flow through Route Handlers
+ `router.refresh()`, with zod-validated input in `src/lib/validation/`.

Note: the dashboard Finance panel is the Command Center surface (coop.css) — it
stays a separate concern from this module and (Sprint 3) is re-pointed at the
same `src/lib/finance/` service layer this module reads.
