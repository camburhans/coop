# C.O.O.P. — Kiro Implementation Guide: Sprint 2
## Productivity + Dashboard Shell: "Midnight & Gilt" Design System, Command Console, Projects & Tasks, Live Panels, ⌘K Voice

---

## Overview

Sprint 1 gave you a secure, recoverable, locally-deployed skeleton with the full data model and nothing to look at. Sprint 2 is where C.O.O.P. becomes a thing you actually open every morning. By the end of it, the command-console shell is real, the Productivity module (Projects + Tasks) is end-to-end, the dashboard panels are wired to live data, and the ⌘K command bar — the soul of the interface — exists as a real component.

The North Star for this sprint is concrete: **the owner runs actual projects and tasks in C.O.O.P. daily, on the phone over Tailscale, from a dashboard that answers "what do I need to do" at a glance.**

The visual direction is locked and prototyped: **"Midnight & Gilt" — an illuminated instrument. Warm near-black base, gold as the single signature accent, deep indigo reserved for C.O.O.P.'s own voice (AI/system cues), and the three pillars — Finance (stewardship), Priorities (mission), Scripture (foundation) — framed like an illuminated manuscript rendered as a JARVIS console.** The prototype (`coop.css`, `coop.js`, the Command Center HTML) is the reference you mine. Sprint 2 ports the **static** layer of that prototype; the **motion** layer (ambient gold drift, particle field, breathing pulses, entrance animations, the typewriter response) is ported in Sprint 5, by design. Sprint 2's interface must be fully usable as still, calm gilded glass — motion is added on top later and must never become a dependency (principles #1 and #2).

**What you're building:**
- A **design system as code**: the "Midnight & Gilt" tokens (see the new `design.md`), typography (**Sora** UI + **Spline Sans Mono** metadata + **Newsreader** serif for scripture), and gilded-glass panel primitives — implemented once as Tailwind theme extensions + CSS custom properties and reused everywhere
- The **command-console shell**: a fixed left status rail (gold sigil, icon nav, indigo presence, live clock), a sticky top command bar (C.O.O.P.'s spoken greeting + live date/weather + the ⌘K "Ask C.O.O.P." field + quick-prompt chips), and a responsive 12-column panel grid
- The **Productivity module**, end-to-end: a service layer over the existing Prisma schema, zod-validated Route Handlers, and a `/productivity` UI to run Projects and Tasks (priority/energy driven, dates optional) — this replaces the prototype's "Productivity" standby screen with the real thing
- The **live dashboard panels** (four, not six): **Priorities · Mission** reading real ranked tasks (the lead panel), **Scripture · Foundation** reading the current verse (Newsreader serif, gold dropcap, recall indicator), **Today's Calendar** reading real `CalendarEvent` rows, and the **Finance · Stewardship** hero rendered as a first-class static placeholder until Sprint 3. There is **no standalone Intelligence Briefing panel** — C.O.O.P.'s briefing surfaces through the command-bar response toast
- The **⌘K command bar / palette** as a real, load-bearing component: keyboard-driven navigation, quick-add task/project, the quick-prompt chips, and an "Ask C.O.O.P." path whose response surfaces in the indigo toast — **stubbed** this sprint (the reasoning behind it is wired in Sprint 4)
- **Zustand** for the small amount of genuine client state (palette open/close, and `motionEnabled` / `particlesEnabled` prefs that map to the `no-motion` / `no-particles` body-class hooks the prototype's CSS already uses)
- A **dev seed script** so the dashboard has real-shaped content to build against, plus empty/loading/error states so the app is honest when there's no data

**What this sprint does NOT include:**
- The **motion layer**: no Framer Motion, no particle field, no ambient gold drift, no breathing pulses, no entrance animations, no typewriter reveal (all Sprint 5 — the prototype's animated CSS/JS is the reference then)
- **Finance features**: accounts, transactions, net worth, CSV import — the Finance · Stewardship panel is a styled static placeholder this sprint (Sprint 3)
- **Any real AI**: no embeddings, no retrieval, no completions. The "Ask C.O.O.P." path and the `ai-note` annotations threaded through panels are **static placeholders** (Sprint 4)
- **Schema changes**: the unified data model from Sprint 1 is complete and locked. Sprint 2 adds no new tables or columns
- **Calendar input / Google Calendar**: the calendar panel *reads* `CalendarEvent` rows but there is no event-creation UI and no external integration in V1 yet
- Multi-user anything, Plaid, native iOS — same V1 exclusions as Sprint 1

This is the first sprint that produces data worth keeping. Treat the promotion to prod (Session #8) with the same seriousness as the Sprint 1 restore drill: the moment you start typing real tasks into the prod app is the moment the Sprint 1 backup system earns its keep.

> **Note on the architecture doc:** `COOP-Architecture.md` is at v1.2 and its §9 still lists the older blue/violet "command console" palette and a six-panel layout including an Intelligence Briefing. The prototype supersedes that. The new `.kiro/steering/design.md` below is the **current visual contract** — gold/indigo "Midnight & Gilt", four panels, briefing-via-command-bar. Bump the architecture doc to v1.3 to match when convenient; until then, `design.md` wins on anything visual.

---

## Prerequisites

- [ ] `sprint-1-complete` tag exists and `docs/sprint-1-baseline.md` shows all green (repo builds, prod + dev stacks healthy, auth works, backups + restore drill done, phone reaches prod over Tailscale)
- [ ] Architecture doc re-read for **§4 (data model)** and **§6 (two-environment single-host model)**. For visuals, defer to `design.md` (below), not §9.
- [ ] The **design prototype** (`coop.css`, `coop.js`, `C_O_O_P__Command_Center.html`) saved somewhere referenceable (design reference only — its hardcoded data, inline mock answers, and motion code are not copied wholesale; Sprint 2 mines its static visual language, Sprint 5 mines its motion)
- [ ] `pnpm dev:db:up` runs and the dev Postgres (port 5433) is healthy — all Sprint 2 development happens here
- [ ] You can run `pnpm dev` (port 3001) and reach the unlock page locally
- [ ] Fonts: **Sora**, **Spline Sans Mono**, and **Newsreader** (italic, for scripture) via `next/font/google` — self-hosted at build, no runtime network. These three are the locked families; do not add others.
- [ ] Confirm Node 20+, pnpm, Docker Desktop still set to start at login

> **Environment discipline (unchanged from Sprint 1):** Every task, project, verse, and panel you build this sprint is developed against the **dev** database (port 5433, via `.env`). Production stays untouched until you deliberately promote in Session #8. Run `pnpm db:snapshot` before any migration — though Sprint 2 should require **zero** migrations, since the schema is already complete.

> **Static-vs-motion boundary (read this twice):** Sprint 2 builds the gilded *look* — warm glass, gold gradient borders, gold accent glows as static box-shadows, the layout, the tokens. Sprint 2 builds **no movement**. The prototype's ambient drift, particles, `breathe`, `rise`, `shimmer`, and typewriter all belong to Sprint 5. The test from principle #2 applies now: the whole interface must be fully usable as completely still glass. The one thing that legitimately updates is the live clock — it's an instrument readout, not decoration.

> **The data model is locked.** The polymorphic `Link` table and every entity in §4 shipped in Sprint 1. Sprint 2 reads from and writes to that schema; it does not change it. If you ever feel you need a new column to make Sprint 2 work, that is a signal to re-check the approach, not to migrate.

---

## Steering File Setup

Sprint 1 created `product.md`, `tech.md`, `structure.md`, and `conventions.md` under `.kiro/steering/`. Sprint 2 **updates** those and **adds one new file** — `design.md`, the Midnight & Gilt visual contract — so it's in Kiro's context on every prompt. Make these edits before Session #1.

### Update `.kiro/steering/product.md`

```markdown
## V1 sprint plan
- Sprint 1: Foundation — repo, Docker, Postgres+pgvector, full Prisma
  schema, auth, Tailscale, backups. (COMPLETE — tag sprint-1-complete)
- Sprint 2 (current): Productivity + dashboard shell. "Midnight & Gilt"
  design system as code, command-console shell, Projects + Tasks
  end-to-end, four live/placeholder panels, ⌘K command bar. Static
  gilded glass only — NO motion (that is Sprint 5).
- Sprint 3: Finance (manual + CSV) — replaces the Finance placeholder.
- Sprint 4: AI layer (embeddings, RAG) — powers "Ask C.O.O.P." + ai-notes.
- Sprint 5: Visual polish — ports the prototype's MOTION layer (ambient
  gold drift, particle field, breathing pulses, entrance animations,
  typewriter response). The motion layer lives here and nowhere earlier.

## The three pillars (the system's spine)
Finance = stewardship. Priorities = mission. Scripture = foundation.
Calendar and system status are secondary. Every design and product
decision serves surfacing these three at a glance.
```

### Update `.kiro/steering/tech.md`

```markdown
## Sprint 2 activations / clarifications
- State: Zustand is NOW in use (Sprint 2+). Use it ONLY for genuine
  client state: command-bar/palette open state, and UI prefs
  `motionEnabled` + `particlesEnabled` (both default true). Reflect those
  prefs onto the document body as the classes `no-motion` / `no-particles`
  — these are the exact hooks the prototype's CSS uses, so Sprint 5's
  motion drops in without rework. Do NOT put server data in Zustand.
- Motion: Framer Motion stays DEFERRED to Sprint 5. Sprint 2 ships static
  gilded glass with zero animation. Do not install framer-motion yet.
- Data access pattern (locked for Sprint 2):
  * Reads: Server Components import service functions from
    src/lib/productivity/ (and src/lib/verse/) directly.
  * Mutations: client components POST/PATCH/DELETE to Route Handlers
    under src/app/api/, which call the same service layer; then
    router.refresh() to revalidate. No Server Actions in V1 — Route
    Handlers only. Keep one pattern.
- Validation: zod schemas for all mutation input, in src/lib/validation/.
- Glow intensity: expose a `--glow-mult` CSS var (default 1) that scales
  all accent glows, matching the prototype. A future settings surface can
  tune it; Sprint 2 just defines it.
```

### Update `.kiro/steering/structure.md`

```markdown
## Sprint 2 additions to src/
src/
├── app/
│   └── (app)/
│       ├── layout.tsx           # the command-console shell wrapper
│       ├── page.tsx             # the dashboard (replaces the S1 placeholder)
│       ├── productivity/page.tsx        # Projects + Tasks (the real module)
│       ├── finance/page.tsx             # standby screen until Sprint 3
│       ├── knowledge/page.tsx           # standby screen until later
│       └── ai/page.tsx                  # standby screen until Sprint 4
│   └── api/
│       ├── projects/route.ts            # list/create
│       ├── projects/[id]/route.ts       # get/update/delete
│       ├── tasks/route.ts               # list/create
│       ├── tasks/[id]/route.ts          # get/update/delete
│       └── verse/current/route.ts       # get/set current verse
├── components/
│   ├── ui/        # Panel, Sigil, Label, PriorityBar, EnergyTag, StatusDot,
│   │              #   AiNote, RecallMeter…
│   ├── shell/     # StatusRail, CommandBar, Greeting, LiveClock, PanelGrid,
│   │              #   BottomNav, Standby, ResponseToast
│   ├── panels/    # PrioritiesPanel, VersePanel, CalendarPanel,
│   │              #   FinancePlaceholder
│   ├── productivity/  # ProjectList, ProjectCard, TaskList, TaskRow, forms
│   └── command/   # CommandPalette and its items
├── lib/
│   ├── productivity/  # services: projects.ts, tasks.ts (server-only)
│   ├── verse/         # service: verse.ts (server-only)
│   └── validation/    # zod input schemas
├── stores/        # zustand (client): command-palette, ui-prefs
└── styles/        # globals.css (tokens as CSS vars), fonts wiring
```

### Update `.kiro/steering/conventions.md`

```markdown
## Components & UI (Sprint 2+)
- Server Components by default; "use client" only for interactivity.
- Styling via Tailwind utilities mapped to the design.md tokens. NEVER
  hardcode hex colors in components — use the token classes/vars. A color
  you "need" that isn't a token is a design.md decision, not an inline.
- Gilded glass uses the shared <Panel> primitive — never re-implement the
  blur / gold gradient border / shadow per component.
- Mono (Spline Sans Mono) for ALL metadata, labels, timestamps, tags,
  status readouts. Sora for UI + display figures. Newsreader (serif,
  italic) ONLY for scripture/verse text.
- Indigo is reserved for C.O.O.P.'s "voice": the presence dot, the
  calendar "now" marker, ai-note annotations, the response toast. Gold is
  the signature accent for everything else. Don't mix these roles.
- Empty, loading, and error states are required for any data-backed view.
- Everything keyboard-reachable; ⌘K and all forms work without a mouse.
```

### Create `.kiro/steering/design.md` (NEW — the visual contract)

```markdown
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
```

> Commit the steering changes on their own before any code:
> ```bash
> git add .kiro/steering/
> git commit -m "docs(sprint-2): steering + design.md — Midnight & Gilt visual contract"
> ```

---

## Session #1: Design System as Code (Midnight & Gilt)

### What You're Building

The Midnight & Gilt contract turned into real, reusable code: three fonts wired through `next/font`, all tokens as CSS custom properties + Tailwind theme, the static ambient layer, and the gilded-glass primitives every later session composes from. No panels with data, no shell layout yet — just the materials and the glass.

> **Boundary:** static only. Warm glass, gold gradient borders, gold halos (box-shadow) are fine — they're CSS, not motion. The ambient glow divs exist but do not drift; no particles spawn; nothing breathes. Do not install framer-motion.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (the token table and effects — the contract)
- coop.css                   (the prototype — mine its STATIC styling: the
                              :root tokens, .panel, .panel::before gold
                              border, rail/cmdbar surfaces. IGNORE its
                              @keyframes / animation / particle rules — those
                              are Sprint 5.)
- .kiro/steering/tech.md
- .kiro/steering/conventions.md
- tailwind.config.ts
- src/app/layout.tsx

## Task 1: Wire three fonts via next/font

In the root layout, load via next/font/google with display:'swap':
- Sora (200,300,400,500,600) → --font-sora
- Spline Sans Mono (300,400,500) → --font-mono
- Newsreader, italic, (300,400,500) → --font-serif
Apply all three CSS-var classes app-wide. Body default: Sora, weight 300.
Load NO other families.

## Task 2: Tokens + base as CSS custom properties

Create src/styles/globals.css (import in root layout). Define EVERY token
from design.md under :root with the exact values, plus:
  --glow-gold: color-mix(in srgb, var(--gold) 50%, transparent);
  --glow-indigo: color-mix(in srgb, var(--indigo) 50%, transparent);
  --glow-mult: 1;
  --radius: 20px;
Set the document base:
  background: radial-gradient(1200px 800px at 68% -10%, var(--bg-2),
             var(--bg) 60%);
  color: var(--text); font-family: var(--font-sora); font-weight: 300;
Add body-class hooks that exist but do nothing yet (Sprint 5 fills them):
  body.no-motion … {}   /* will kill animations */
  body.no-particles #particles { display:none }

## Task 3: Map tokens into Tailwind

Extend tailwind.config.ts theme to expose tokens as utilities, each
pointing at the CSS var (single source of truth in globals.css):
- colors: bg, 'bg-2', panel, 'panel-deep', border, 'border-hover', text,
  'text-soft', 'text-faint', gold, 'gold-hi', indigo, good, warn, alert
- fontFamily: sans → var(--font-sora); mono → var(--font-mono);
  serif → var(--font-serif)
- borderRadius: panel → var(--radius)
Do not hardcode hex in the config — reference the vars.

## Task 4: Static ambient layer

Create src/components/shell/ambient.tsx (Server Component): the fixed
background divs from the prototype — three gold glow halos, a faint masked
gold grid texture, a vignette, and an empty #particles container — styled
EXACTLY as static (no animation, no particles spawned). They sit at z-index
0 behind everything. This is the canvas Sprint 5 animates.

## Task 5: The <Panel> primitive (gilded glass)

Create src/components/ui/panel.tsx (Server Component):
- 20px radius, backdrop-filter blur(22px), fill var(--panel), deep shadow +
  faint warm inset highlight.
- The 1px GOLD gradient border via the ::before mask technique from
  coop.css (.panel::before): 135deg gold 30% → transparent 38–62% →
  gold-hi 22%, opacity calc(0.7 * var(--glow-mult)).
- Hover: border → border-hover + a low gold halo box-shadow.
- Props: { label?: string; meta?: string; className?; children }. When
  `label` is set, render the mono panel-head (label in mono uppercase
  tracked-out text-soft; optional `meta` in mono text-faint on the right).
- NO transitions/animations (the prototype's `rise` is Sprint 5).

## Task 6: Supporting primitives (all static)

In src/components/ui/:
- sigil.tsx — the gold gradient monogram "C" (linear-gradient gold-hi→gold,
  inset highlight, gold halo) + a static sigil-ring outline.
- label.tsx — mono, uppercase, tracked, text-faint/soft caption.
- priority-bar.tsx — 3px vertical bar; color by priority: LOW→gold (base),
  MEDIUM→warn, HIGH/CRITICAL→alert; gold/warn/alert halo via --glow-mult.
- energy-tag.tsx — mono pill; HIGH→good, MEDIUM→warn, LOW→text-faint.
- status-dot.tsx — small INDIGO dot (C.O.O.P. presence). Static (the
  "breathe" pulse is Sprint 5).
- ai-note.tsx — an indigo ✦ glyph + text block, separated by a top border;
  this is where C.O.O.P.'s threaded voice annotations render. In Sprint 2
  it just renders whatever text it's given (static placeholder copy).
- recall-meter.tsx — a big gold-gradient % + mono label + a gold track/fill
  bar (fill width static, no animation). For the verse panel.

## Task 7: A tokens preview route (throwaway, dev-only)

Create src/app/(app)/_design/page.tsx rendering one of every primitive, a
sample <Panel> with an ai-note, the three fonts (incl. a Newsreader verse
line with a gold dropcap), and a swatch of every token. Dev-only; behind
auth; may be deleted at sprint end.

## Task 8: Verify + show me

- pnpm lint && pnpm build pass.
- Show globals.css, the tailwind theme extension, and panel.tsx.
- pnpm dev → /_design shows gilded glass, the gold border, the three fonts,
  indigo accents, and all swatches.

Do NOT install framer-motion or add any animation/transition/keyframe.
Do NOT spawn particles or animate the ambient layer — static only.
Do NOT wire any database data — primitives are static.
Do NOT hardcode colors anywhere outside globals.css.
```

### What to Verify

- [ ] Sora, Spline Sans Mono, and **Newsreader** all render (check a heading, a mono label, and a serif verse line)
- [ ] Every Midnight & Gilt token exists as a CSS var **and** a Tailwind utility, values matching `design.md` exactly
- [ ] `<Panel>` shows warm glass + the **gold** gradient border + shadow + a mono panel-head
- [ ] Indigo is used only for the presence dot / ai-note glyph; gold everywhere else
- [ ] The ambient layer renders but is completely still; `#particles` is empty
- [ ] `/_design` renders all primitives behind auth at port 3001
- [ ] `pnpm build` passes; **no** `framer-motion` in `package.json`; no hardcoded hex outside `globals.css`

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): midnight & gilt design system — tokens, fonts, gilded glass primitives"
```

---

## Session #2: The Command-Console Shell

### What You're Building

The frame that wraps every authenticated screen: the gold-sigil left rail, the sticky command bar (C.O.O.P.'s greeting + live date/weather/clock + the ⌘K field + quick-prompt chips), the responsive 12-column grid, the mobile bottom nav, and the standby screens for not-yet-built modules. Dashboard panels are **static placeholders** here — real data arrives in Session #5. This replaces the Sprint 1 "C.O.O.P. is online." landing.

> **Environment note:** still all on dev (3001). The live clock is the one client component that updates; everything else is Server Components + CSS.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (layout skeleton + responsive spans)
- C_O_O_P__Command_Center.html  (the prototype DOM — mine its structure and
                              labels: rail nav, command bar, panel-head
                              labels, standby screen, bottom nav. Do NOT copy
                              its hardcoded panel data.)
- coop.css                   (rail/cmdbar/grid/standby/bottomnav STATIC
                              styling)
- src/components/ui/panel.tsx, sigil.tsx, status-dot.tsx
- src/app/(app)/layout.tsx, src/app/(app)/page.tsx

## Task 1: The (app) shell layout

Create/replace src/app/(app)/layout.tsx as the command-console frame:
<Ambient /> (static), <StatusRail />, <CommandBar />, and a <main> region
for page content. CSS grid: 92px rail column + 1fr; rows auto (command bar)
+ 1fr (main). Background is the body radial. Server Component.

## Task 2: StatusRail

src/components/shell/status-rail.tsx:
- Fixed ~92px, gold-bordered right edge, blurred warm surface.
- Top: <Sigil/> + ring, then mono "C.O.O.P." id (tracked, text-faint).
- Nav: 5 icon buttons (lucide-react icons, static) with mono micro-labels —
  DASH (/), FOCUS (/productivity), FINANCE (/finance), KNOW (/knowledge),
  A.I. (/ai). Active item: gold-hi text, gilded fill, a gold left edge bar.
- Bottom: <SystemStatus/> (next task).
- Hidden ≤760px.

## Task 3: SystemStatus + LiveClock

src/components/shell/system-status.tsx:
- An INDIGO presence dot (<StatusDot/>) + mono "READY".
- <LiveClock/> — a small "use client" component, mono, updating each second
  (HH:MM). The only ticking element in Sprint 2.

## Task 4: CommandBar (the soul)

src/components/shell/command-bar.tsx (sticky, blurred warm surface, gold
bottom border):
- <Greeting/> (Server Component): time-aware greeting in C.O.O.P.'s voice —
  "Good morning/afternoon/evening, {name}." with a softer voice clause after
  it (text-soft). The name is a single config value (the prototype uses the
  owner's name). Before 5: "Still up"; 22+: "Late shift".
- A mono status cluster: date (e.g. "Monday, June 15") · weather (a static
  mock like "72° Sunny" with the temp in gold-hi — real weather is a later
  concern) · "HH:MM LOCAL" · an indigo dot + "C.O.O.P. READY".
- The ⌘K field: a gold ✦ spark icon on the left, placeholder "Speak to
  C.O.O.P. — say 'catch me up'…", a "⌘K" hint chip on the right. On focus:
  border → border-hover + a static gold glow (no spark rotation — that's
  Sprint 5). In THIS session the field does nothing on submit (real palette
  is Session #6).
- A row of quick-prompt chips (mono pills): "Catch me up", "How are my
  finances?", "What needs my attention?", "What's on today?". Visual only
  here; wired in Session #6.

## Task 5: PanelGrid, Standby, BottomNav

- src/components/shell/panel-grid.tsx: 12-col grid (max-width ~1520px,
  centered, gap ~22px) with the design.md spans (Priorities 1/​span7
  rows1–2; Calendar 8/​span5 rows1–2; Finance 1/​span7 row3; Verse 8/​span5
  row3). Apply the ≤1180px two-up and ≤760px single-column rules.
- src/components/shell/standby.tsx: the "MODULE STANDBY" screen from the
  prototype (indigo dot, mono label, module name in Sora-200, a sub-line, a
  static shimmer bar — NO animation, "C.O.O.P. IS PROVISIONING THIS
  SURFACE"). Use it for the /finance, /knowledge, /ai pages (create those
  pages as simple standby screens). /productivity becomes the REAL module in
  Session #4 — for now it can show standby too.
- src/components/shell/bottom-nav.tsx: fixed glass bottom nav shown only
  ≤760px — HOME/FOCUS/FINANCE/KNOW/A.I., mirroring the rail.

## Task 6: Dashboard page with PLACEHOLDER panels

Replace src/app/(app)/page.tsx. Inside <PanelGrid>, four <Panel> placeholders
matching the layout:
1. Priorities · Mission (lead, top-left) — placeholder ranked rows.
2. Today's Calendar (top-right) — placeholder timeline.
3. Finance · Stewardship (floor-left, HERO-WEIGHT) — a big gold-gradient
   net-worth figure (Sora-200), a static sparkline SVG, account chips, an
   "AWAITING SPRINT 3" mono tag. First-class even as a placeholder.
4. Scripture · Foundation (floor-right) — a Newsreader verse line with a
   gold dropcap + a static recall meter.
Each placeholder should look real but read clearly as not-yet-wired (mono
"PLACEHOLDER" / "AWAITING SPRINT N").

## Task 7: Verify + show me

- pnpm build passes.
- pnpm dev: the console renders — gold rail + sigil, command bar with live
  clock + greeting + quick chips, and the four gilded panels in the right
  positions (Priorities leads, Finance hero-weight on the floor).
- Resize: ≤1180px two-up; ≤760px rail → bottom nav, single column.
- /finance, /knowledge, /ai show the standby screen.

Do NOT wire any database data — panels are static placeholders.
Do NOT build the real command palette (Session #6) — the field is inert.
Do NOT add animations; the live clock is the only updating element.
Do NOT animate the standby shimmer or the ambient layer.
```

### What to Verify

- [ ] Console renders: gold sigil rail + command bar + four gilded panels, Priorities leading top-left and the Finance hero on the floor row
- [ ] Live clock ticks; greeting changes with time of day and speaks in C.O.O.P.'s voice
- [ ] Quick-prompt chips render (inert for now); ⌘K field focuses with a static gold glow
- [ ] Active nav item shows the gold treatment as you move between routes; `/finance`, `/knowledge`, `/ai` show standby
- [ ] ≤1180px → two-up; ≤760px → rail replaced by glass bottom nav, single column
- [ ] `pnpm build` passes; nothing animates

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): command-console shell — gold rail, command bar, grid, standby, bottom nav"
```

---

## Session #3: Productivity Data Layer (Service Layer + Validated Route Handlers)

### What You're Building

The backend for Projects and Tasks, built **before** any productivity UI (foundation first). A `server-only` service layer is the single place Prisma is touched for these entities; zod schemas validate all input; Route Handlers expose create/read/update/delete. No screens this session — you prove it with a smoke script.

> **Environment note:** dev DB only (5433). No migration is needed — `Project` and `Task` already exist from Sprint 1. If Prisma reports drift, stop and reconcile; do not "fix" it with a new migration.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 4: Project + Task; tasks are priority/energy
  driven, dates optional)
- .kiro/steering/tech.md   (services + Route Handlers, NO server actions)
- .kiro/steering/conventions.md
- prisma/schema.prisma
- src/lib/db/client.ts

## Task 1: Validation schemas

src/lib/validation/project.ts and task.ts (zod), mirroring the Prisma enums:
- projectCreateSchema: name (1..120), description optional, status (default
  ACTIVE), priority (default MEDIUM), dueDate optional (ISO date or null).
- projectUpdateSchema: partial of the above.
- taskCreateSchema: title (1..200), projectId optional (uuid|null), status
  (default TODO), priority (default MEDIUM), energy (default MEDIUM), dueDate
  optional, notes optional.
- taskUpdateSchema: partial. Export inferred TS types.

## Task 2: Project service — src/lib/productivity/projects.ts ('server-only')

- listProjects(opts?): ordered active-first, then priority critical→low,
  then updatedAt desc; include a task count per project.
- getProject(id), createProject(input), updateProject(id, input),
  deleteProject(id) — on delete, set child tasks' projectId to NULL (do NOT
  cascade-delete tasks). Validate via the zod schemas.

## Task 3: Task service — src/lib/productivity/tasks.ts ('server-only')

- listTasks(opts?): filter by projectId/status/energy; default rank ("what
  should I do now"):
    1) status TODO & IN_PROGRESS first; DONE/BLOCKED last
    2) priority CRITICAL→HIGH→MEDIUM→LOW
    3) dueDate sooner first, nulls last
    4) energy as final tiebreak
  Expose rankTasks() so the dashboard Priorities panel and the productivity
  page share ONE ranking definition.
- getTask, createTask, updateTask, deleteTask, completeTask(id)->DONE,
  reopen(id)->TODO.

## Task 4: Route Handlers (JSON; zod-validate bodies; 400/404/200/201)

- src/app/api/projects/route.ts         GET list, POST create
- src/app/api/projects/[id]/route.ts    GET, PATCH, DELETE
- src/app/api/tasks/route.ts            GET (?projectId=&status=&energy=),
                                        POST
- src/app/api/tasks/[id]/route.ts       GET, PATCH, DELETE
Confirm the Sprint 1 middleware matcher already protects /api/projects and
/api/tasks (everything except /unlock, /api/auth/*, /api/health).

## Task 5: A service-layer smoke script

scripts/productivity-smoke.ts (tsx), against the DEV DB, exercising the
SERVICE layer (not HTTP): create a project; create 3 tasks (mixed
priority/energy, one due-dated, one done); list and ASSERT the rank order;
update + complete a task; delete a task; delete the project and assert
remaining tasks went projectId=null (not deleted); clean up.
Add "prod:smoke": "tsx scripts/productivity-smoke.ts". GUARD it: refuse to
run unless DATABASE_URL contains "5433" or "coop_dev".

## Task 6: Run + show me

- pnpm prod:smoke (dev) — show output + asserted ranking.
- Show projects.ts, tasks.ts, one Route Handler in full.

Do NOT build any UI this session.
Do NOT use Server Actions — Route Handlers only.
Do NOT point any script at prod (enforce the 5433 guard).
Do NOT add or alter any Prisma model — the schema is complete.
Do NOT call the AI layer.
```

### What to Verify

- [ ] `pnpm prod:smoke` (dev) passes and prints the expected ranking order
- [ ] `rankTasks()` is the single shared ranking used by services and (later) the panel
- [ ] Deleting a project **nulls** child tasks' `projectId` rather than deleting them
- [ ] Invalid POST bodies return 400 with a readable zod error
- [ ] `/api/projects` and `/api/tasks` require a session
- [ ] The smoke script refuses any non-dev `DATABASE_URL`
- [ ] No migration created; `prisma migrate status` still up-to-date

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): productivity data layer — services, zod validation, route handlers"
```

---

## Session #4: Productivity UI — Projects & Tasks

### What You're Building

The real `/productivity` module — replacing its standby screen. Project list with task counts, a task list ranked by the shared `rankTasks()`, create/edit forms with priority/energy/status controls, inline complete/reopen toggles. This is the core "run it daily" surface of Sprint 2, styled in Midnight & Gilt.

> **Pattern (tech.md):** Server Components read via the service layer; client components mutate via the Session #3 Route Handlers, then `router.refresh()`. Zustand only for tiny local UI state (e.g. which row is editing).

### Prompt

```
Read these files:
- COOP-Architecture.md (section 4: Project/Task; priority/energy tenet)
- .kiro/steering/design.md   (style the module in Midnight & Gilt)
- .kiro/steering/tech.md     (data-access pattern)
- src/lib/productivity/projects.ts, tasks.ts
- src/components/ui/   (Panel, PriorityBar, EnergyTag, etc.)

## Task 1: Productivity page (Server Component)

Replace src/app/(app)/productivity/page.tsx (no longer standby): async,
reads projects (with counts) + top-ranked open tasks via the service layer.
Two regions inside <Panel>s — Projects and Tasks — responsive (stack on
mobile). Renders <ProjectList> and <TaskList>.

## Task 2: Project components (src/components/productivity/)

- project-list.tsx (server) → <ProjectCard>s.
- project-card.tsx (server) — name (Sora), status + <PriorityBar>, task
  count (mono), due date if present (mono). Clicking filters the task list
  via ?projectId= (server-rendered, no client state).
- project-form.tsx ("use client") — create/edit: name, description, status,
  priority, dueDate. POST/PATCH the projects Route Handlers; router.refresh()
  on success; inline zod errors.

## Task 3: Task components

- task-list.tsx (server) — ranked tasks (optionally ?projectId=), as
  <TaskRow>s in rank order. Empty state: "Nothing queued. Add a task."
- task-row.tsx ("use client" for the toggle) — rank number (mono),
  <PriorityBar>, title (Sora) + meta (mono), <EnergyTag>, due (mono, alert
  if overdue), a complete/reopen toggle (PATCH /api/tasks/[id] →
  router.refresh()). Completed rows render muted.
- task-form.tsx ("use client") — title, project (optional select + "No
  project"), status, priority, energy, dueDate, notes. Route Handlers;
  inline errors; router.refresh().

## Task 4: Add buttons + edit/delete

"New Project" / "New Task" affordances opening the forms (a conditionally
rendered <Panel> or lightweight modal — NO animation). Edit affordances
pre-fill. Deletes confirm (window.confirm is fine in V1).

## Task 5: Rail wiring

Confirm the rail's FOCUS/Productivity item routes here and shows the active
gold treatment (it should from Session #2).

## Task 6: Verify (dev) + show me

Create a project (0 count) → tasks with mixed priority/energy, some dated,
one assigned → confirm order matches rankTasks() → complete a task (mutes,
drops) → reopen → edit project + task → delete a project and confirm its
tasks survive with no project. Show task-row.tsx and task-form.tsx.

Do NOT touch finance, calendar, or verse this session.
Do NOT add the command palette (Session #6).
Do NOT introduce Server Actions — mutate via Route Handlers.
Do NOT add motion; conditional rendering is not animation.
Do NOT duplicate ranking — import rankTasks() from the task service.
```

### What to Verify

- [ ] Create / edit / complete-reopen / delete projects and tasks entirely from the UI
- [ ] Task order matches the shared `rankTasks()` (e.g. a critical dateless task beats a low task due tomorrow)
- [ ] Project filter via `?projectId=` works (server-rendered)
- [ ] Overdue dates show the alert treatment; completed tasks render muted
- [ ] Empty states show for no projects / no open tasks
- [ ] Deleting a project leaves its tasks intact with `projectId = null`
- [ ] `pnpm build` passes; no `framer-motion`; no Server Actions

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): productivity UI — projects + tasks, create/edit/complete/delete"
```

---

## Session #5: Wiring the Dashboard Panels to Live Data

### What You're Building

The dashboard stops faking it. **Priorities · Mission** reads real ranked tasks (the lead panel); **Scripture · Foundation** reads and can set the current verse (Newsreader serif, gold dropcap, recall meter); **Today's Calendar** reads real `CalendarEvent` rows with a graceful empty state. The **Finance · Stewardship** hero stays a first-class static placeholder (Sprint 3). The `ai-note` annotations threaded through panels render **static placeholder copy** (Sprint 4 fills them with real reasoning). There is no Intelligence Briefing panel — that role belongs to the command-bar response toast (Session #6).

> **Scope discipline:** finance is a placeholder this sprint — no real numbers (there are none until Sprint 3). The `ai-note` text is static — no AI call. Both must still look first-class.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (panel spans, indigo voice, serif scripture)
- C_O_O_P__Command_Center.html  (the prototype panels — mine their structure
                              & labels: panel-head labels, finance figure +
                              accounts + bills, priorities rows, the verse
                              with dropcap + recall, the calendar timeline +
                              now marker, the ai-note. Do NOT copy the mock
                              numbers.)
- src/lib/productivity/tasks.ts   (rankTasks — reuse it)
- src/components/ui/   (AiNote, RecallMeter, PriorityBar, EnergyTag, etc.)
- src/components/panels/   (the Session #2 placeholders)

## Task 1: Verse service + route

src/lib/verse/verse.ts ('server-only'):
- getCurrentVerse(): the Verse with is_current=true (or null).
- setCurrentVerse({reference, text}): in a transaction, unset is_current on
  all, then set the given one current (enforce "only one current" here, §4).
src/app/api/verse/current/route.ts: GET current; PUT (zod: reference 1..120,
text 1..1000).

## Task 2: Priorities · Mission panel (LIVE — the lead)

Replace priorities-panel.tsx: async Server Component reading the top ~5 open
tasks via rankTasks(). Each row: rank number (mono), <PriorityBar>, title
(Sora) + meta (mono), <EnergyTag>. Footer: an <AiNote> with STATIC
placeholder copy (e.g. "C.O.O.P.'s read on your day arrives in Sprint 4.")
in indigo, and a mono link "OPEN FOCUS →" to /productivity. Empty: "All
clear. Nothing queued." Reuse the SAME ranking as the productivity page.

## Task 3: Scripture · Foundation panel (LIVE)

Replace verse-panel.tsx: async Server Component reading getCurrentVerse().
- verse-ref in gold mono (tracked); verse text in Newsreader serif italic
  with a gold-gradient dropcap on the first letter.
- A <RecallMeter> (gold % + mono label + static gold fill bar). The recall
  VALUE can be a simple stored/placeholder figure for now — full memorization
  logic is the owner's later method (§4); do not build streak logic.
- Footer <AiNote> static placeholder ("I'll cue your recall — Sprint 4.").
- A minimal "Set verse" affordance ("use client") that PUTs to
  /api/verse/current and router.refresh() (two fields: reference, text).
- Empty: "No verse set." + the set affordance.

## Task 4: Today's Calendar panel (LIVE-capable, empty by default)

Replace calendar-panel.tsx: async Server Component reading CalendarEvent
rows where starts_at is today (server local day), ordered by time.
- A "next commitment in …" countdown line (mono, computed from the events).
- A vertical timeline (the prototype's cal-rail): each event = time (mono) +
  title (Sora) + meta (mono). The current/ongoing event gets the INDIGO
  "now" node + a "NOW" tag (static — no breathe). Empty: "No events today."
- NO event-creation UI in V1 (Google Calendar + manual entry are later) —
  the panel reflects whatever the seed (Session #7) puts in the table.

## Task 5: Finance · Stewardship — first-class placeholder (HERO-WEIGHT)

Keep finance-placeholder.tsx as the floor-left hero-weight panel: panel-head
"FINANCE · STEWARDSHIP", a big gold-gradient net-worth figure, a static
delta + budget-chip, a static sparkline SVG, account chips, a recent-spend
list, an upcoming-bills line, and an <AiNote> — all STATIC with an "AWAITING
SPRINT 3" mono tag. Wire NO data. Make it look finished.

## Task 6: Assemble + verify

Dashboard composes: command-bar greeting (live) + the grid (Priorities live
lead, Calendar live/empty, Finance placeholder hero, Verse live). On dev:
create tasks → they appear ranked in Priorities and update on refresh after
completion; set a verse → it appears in serif with the dropcap. Calendar is
empty until the Session #7 seed. pnpm build passes. Show priorities-panel,
verse-panel, calendar-panel.

Do NOT wire finance to real numbers (Sprint 3).
Do NOT make ai-notes call AI (Sprint 4) — static copy only.
Do NOT build a calendar event-creation UI — read-only reflection.
Do NOT re-implement ranking — import rankTasks().
Do NOT add motion (the "now" node is a static indigo dot).
```

### What to Verify

- [ ] Priorities (lead panel) shows real ranked tasks and refreshes after a completion; order matches `/productivity`
- [ ] Verse renders in Newsreader serif italic with a gold dropcap; setting a verse persists; only one `is_current` ever
- [ ] Calendar renders today's events as a timeline with an indigo "now" node (after the seed) and a clean empty state otherwise
- [ ] Finance is the hero-weight placeholder and looks first-class; `ai-note`s show static indigo copy and make **no** AI call
- [ ] No Intelligence Briefing panel exists; that role is reserved for the command-bar toast
- [ ] `pnpm build` passes

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): live panels — priorities (lead), scripture, calendar; finance placeholder"
```

---

## Session #6: The ⌘K Command Bar (C.O.O.P.'s Voice)

### What You're Building

The command bar becomes load-bearing — it's the primary input and, in Sprint 4, the seat of the AI. For Sprint 2 it does four things: keyboard-driven **navigation**, **quick-add** (task/project without leaving the dashboard), the **quick-prompt chips**, and an **"Ask C.O.O.P." path whose response surfaces in the indigo toast — explicitly stubbed** (no provider call; a friendly "reasoning comes online in Sprint 4"). Building it now means Sprint 4 has nowhere to argue about where the voice lives.

> **Hard guardrail:** do not call the AI provider or import from `lib/ai/` beyond knowing it exists. The "Ask" path and the toast text are static stubs. The typewriter reveal from the prototype is Sprint 5 — render the toast text directly in Sprint 2.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (command bar = the soul; indigo response toast)
- coop.js                    (the prototype's command behavior — mine the
                              UX shape: ⌘K focus, quick prompts, the response
                              toast. Its mock ANSWERS and the typewriter are
                              NOT copied — answers are stubbed, typewriter is
                              Sprint 5.)
- .kiro/steering/tech.md     (zustand for palette + ui-prefs)
- src/components/shell/command-bar.tsx, response-toast.tsx (create)
- src/lib/productivity/tasks.ts, projects.ts

## Task 1: Stores

- src/stores/command-palette.ts ('use client', zustand): isOpen, query;
  open/close/toggle/setQuery. No server data.
- src/stores/ui-prefs.ts ('use client', zustand): motionEnabled (true),
  particlesEnabled (true), toggles. A small client component in the (app)
  layout reflects these onto <body> as classes no-motion / no-particles
  (the prototype's hooks). Nothing consumes them visually yet (Sprint 5).

## Task 2: Global ⌘K + the response toast

- A "use client" key listener in the (app) layout: ⌘K / Ctrl+K toggles the
  palette, Escape closes. The command-bar field also calls open().
- src/components/shell/response-toast.tsx ("use client"): the fixed,
  indigo-accented toast ("C.O.O.P. ▸ RESPONSE" header + text). Renders text
  directly (NO typewriter). Auto-dismiss after a few seconds. This is where
  every "Ask C.O.O.P." answer lands.

## Task 3: CommandPalette

src/components/command/command-palette.tsx ("use client"): a centered gilded
overlay (<Panel> styling, dimmed backdrop, NO animated transition), an input
bound to the store (autofocus on open), and a filtered results list:
- NAVIGATE: Dashboard, Productivity (FOCUS), Finance, Knowledge, A.I. Core,
  "Lock app" (POST /api/auth/lock), "Toggle motion", "Toggle particles".
- CREATE: "New task…", "New project…" → switch the palette into a tiny
  inline quick-add form.
- ASK: if the query matches no command, show "Ask C.O.O.P: '<query>'".
Arrow keys move selection, Enter activates, Escape closes — fully usable
without a mouse.

## Task 4: Quick-add + quick-prompts + stubbed Ask

- Quick-add task: title required; priority/energy default MEDIUM; optional
  project → POST /api/tasks → close → router.refresh() (Priorities updates).
  Same for quick-add project → /api/projects.
- Wire the command-bar quick-prompt chips ("Catch me up", "How are my
  finances?", "What needs my attention?", "What's on today?") and the ASK
  path to the response toast with a STATIC stub:
  "C.O.O.P.'s reasoning comes online in Sprint 4. For now I can navigate and
  capture tasks." Do NOT call any AI. Do NOT import a provider.

## Task 5: Verify + show me

- ⌘K opens/Escape closes from anywhere in (app).
- "prod" highlights Productivity; Enter navigates. "Lock app" locks.
- "New task" quick-add creates a task that shows in Priorities after refresh.
- A quick-prompt chip and the ASK path show the exact stub in the indigo
  toast; NO network call to AI (check Network tab).
- "Toggle motion"/"Toggle particles" add/remove the body classes (inspect
  the DOM). Show command-palette.tsx and ui-prefs.ts.

Do NOT call or import the AI provider — Ask is a static stub.
Do NOT implement semantic search — simple string filtering only.
Do NOT add the typewriter or any open/close animation (Sprint 5).
Do NOT store task/project data in zustand.
```

### What to Verify

- [ ] ⌘K / Ctrl+K toggles the palette anywhere in `(app)`; Escape closes; full keyboard nav works
- [ ] Navigation routes correctly; "Lock app" locks
- [ ] Quick-add task/project creates real rows; the dashboard reflects them after refresh
- [ ] Quick-prompt chips and the "Ask C.O.O.P." path show the stub in the **indigo response toast** and make **no** AI/provider call
- [ ] "Toggle motion"/"Toggle particles" flip the `no-motion` / `no-particles` body classes; defaults are on
- [ ] `pnpm build` passes; no typewriter, no transitions

Commit:
```bash
git add -A
git commit -m "feat(sprint-2): ⌘K command bar — nav, quick-add, quick-prompts, stubbed Ask + response toast"
```

---

## Session #7: Dev Seed + Daily-Use Hardening

### What You're Building

A dev seed so the dashboard has realistic content to build and demo against, plus the unglamorous robustness work that separates "demo" from "I use this every morning": honest empty states, loading/error boundaries, and a mobile pass. Nothing here touches prod.

> **Safety:** the seed writes data. It must refuse to run against anything but the dev database — same discipline as the Sprint 1 smoke script.

### Prompt

```
Read these files:
- .kiro/steering/structure.md
- src/lib/productivity/projects.ts, tasks.ts
- src/lib/verse/verse.ts
- prisma/schema.prisma   (CalendarEvent fields)

## Task 1: Dev seed script

scripts/seed-dev.ts (tsx). It must:
- Refuse to run unless DATABASE_URL contains "5433" or "coop_dev" (hard
  guard; print + exit non-zero otherwise).
- Support --reset (wipe the seeded entities first) so it's idempotent-ish.
- Insert a realistic spread:
  * 3–4 projects across statuses/priorities (an active high-priority one, a
    paused one, a done one).
  * ~10 tasks across them + a couple standalone; mixed priority/energy; a few
    dated (one overdue, one today, one future); one or two DONE.
  * 2–3 CalendarEvent rows for TODAY at different times (so the timeline
    renders, with one ongoing for the "now" node) + one tomorrow.
  * one current Verse (reference + text) — e.g. a short, public-domain KJV
    passage so the serif panel has real text.
Add scripts: "db:seed": "tsx scripts/seed-dev.ts",
  "db:seed:reset": "tsx scripts/seed-dev.ts --reset".

## Task 2: Loading + error states

Add loading.tsx and error.tsx for the (app) group and /productivity — calm
gilded-glass placeholder blocks and a quiet error panel. STATIC (no shimmer
animation; a muted block is fine).

## Task 3: Honest empty / first-run state

With an empty dev DB, confirm the dashboard reads as intentional: Priorities
"All clear", Calendar "No events today", Verse "No verse set" + set
affordance, Finance placeholder as designed. Nothing renders blank or throws.

## Task 4: Mobile pass (dev)

At ≤760px (and, if handy, the real phone hitting the dev machine on the LAN —
NOT prod yet): rail → glass bottom nav; panels stack (Priorities, Calendar,
Finance, Verse); the ⌘K field + palette usable on touch; forms tappable and
not overflowing; the response toast docks to the bottom. Fix breakage.
(Real phone-over-Tailscale testing is Session #8, against prod.)

## Task 5: Tidy

Remove or gate the /_design preview from Session #1. Run pnpm lint && build;
fix warnings.

## Task 6: Show me

- pnpm db:seed:reset → describe the populated dashboard.
- Confirm the seed guard blocks a non-dev DATABASE_URL.

Do NOT seed or write to production — the 5433/coop_dev guard is mandatory.
Do NOT add animated skeletons/spinners (static only; motion is Sprint 5).
Do NOT add new features — seed + robustness only.
```

### What to Verify

- [ ] `pnpm db:seed:reset` populates the dev DB; the dashboard comes alive (ranked priorities, today's calendar timeline with a "now" node, a serif verse)
- [ ] The seed script **refuses** a non-dev `DATABASE_URL`
- [ ] Every panel + `/productivity` has honest empty states; nothing blank or crashing on no data
- [ ] `loading.tsx` / `error.tsx` render calm static states
- [ ] Mobile layout (bottom nav, single column, usable palette/forms, docked toast) holds at ≤760px
- [ ] `pnpm lint && pnpm build` clean

Commit:
```bash
git add -A
git commit -m "chore(sprint-2): dev seed + empty/loading/error states + mobile hardening"
```

---

## Session #8: E2E Smoke Test, Promote to Production, Sprint 2 Sign-Off

### What You're Building

Confirmation that the whole Sprint 2 surface works together, then the deliberate **promotion to production** — because this is the sprint where you start entering real data you intend to keep. Mirror the Sprint 1 rigor: checklist, verify against the running system, promote, capture a baseline, tag.

> **This is the "real data starts now" gate.** Before promoting, confirm the Sprint 1 nightly prod `pg_dump` is still landing in iCloud. The first real task you type into prod is protected only if that net is live.

### Prompt

```
Read these files:
- README.md
- docs/operating-model.md
- docs/restore.md
- scripts/deploy.sh
- docs/sprint-1-baseline.md

## Task 1: Generate docs/sprint-2-checklist.md

Consolidate every verification step from Sessions #1–#7 into one runnable
checklist, grouped by: Design system & shell · Productivity (data + UI) ·
Dashboard panels (live + placeholder) · Command bar / palette · Seed,
empty/error, mobile · Build & lint. For each item, the exact command/URL/
interaction. Mark dev-only vs. must-also-pass-on-prod.

## Task 2: Verify against the running DEV system

Run every checklist item against dev (3001, seeded dev DB). Report
PASS/FAIL. For any FAIL: stop, report, do not auto-fix — diagnose together.

## Task 3: Pre-promotion safety checks

Confirm + report:
- prisma migrate status up-to-date; Sprint 2 added NO new migrations.
- The Sprint 1 nightly backup launchd job is still installed; the last prod
  backup file is recent (ls the iCloud backup dir).
- docker/.env (prod) points at the prod db, NOT the dev DB.
- Run a fresh pre-promotion prod snapshot (deploy.sh's backup step or
  `docker compose --profile backup run --rm backup`).

## Task 4: Promote to production

Run scripts/deploy.sh: pull → snapshot prod → build prod image → `prisma
migrate deploy` against prod (a NO-OP this sprint — confirm it reports
nothing to apply) → restart prod → status + logs. Report output.
IMPORTANT: do NOT run the dev seed against prod. Production starts EMPTY of
seed data — only the real projects/tasks/verse you enter yourself.

## Task 5: Capture docs/sprint-2-baseline.md

- Date/time, git SHA, sprint-2 tag.
- prisma migrate status (dev + prod — both up-to-date, schema unchanged).
- docker compose -f docker/docker-compose.yml ps (prod healthy).
- docker system df (compare vs the Sprint 1 baseline).
- /api/health from the phone over Tailscale (prod, 3000).
- Confirmation the dashboard, /productivity, and ⌘K work on the phone over
  Tailscale against PROD.
- Confirmation prod holds only real, hand-entered data (no seed).
- Confirmation the nightly prod backup is active + a fresh pre-promotion
  snapshot exists.

## Task 6: Report

Summarize what shipped, what is intentionally still placeholder (Finance →
Sprint 3; ai-notes + Ask C.O.O.P. → Sprint 4; motion → Sprint 5), and
anything to watch heading into Sprint 3.

Do NOT start any Sprint 3 work (no accounts/transactions/CSV).
Do NOT seed production.
Do NOT introduce feature code in this session.
```

### What to Verify

- [ ] Every item in `sprint-2-checklist.md` shows PASS on dev
- [ ] `scripts/deploy.sh` promoted cleanly; `prisma migrate deploy` reported **no** pending migrations
- [ ] Production reachable on the phone over Tailscale (port 3000); dashboard, `/productivity`, and ⌘K all work there
- [ ] You created at least one **real** project + task on the prod app from your phone; the Priorities lead panel reflects it
- [ ] `docs/sprint-2-baseline.md` committed with real values
- [ ] Nightly prod backup confirmed active; fresh pre-promotion snapshot exists
- [ ] Production contains only your real data — the dev seed never touched it

Commit:
```bash
git add -A
git commit -m "chore(sprint-2): e2e smoke test, prod promotion, baseline captured"
git tag sprint-2-complete
git push origin main --tags
```

---

## What "Done" Looks Like for Sprint 2

✅ **Midnight & Gilt as code**: tokens live as CSS vars + Tailwind theme (single source of truth), **Sora + Spline Sans Mono + Newsreader** wired via `next/font`, and gilded-glass primitives (`Panel` with gold gradient border, `Sigil`, `PriorityBar`, `EnergyTag`, indigo `StatusDot`, `AiNote`, `RecallMeter`). No hardcoded colors. No motion. A static ambient layer waiting for Sprint 5.

✅ **Command-console shell**: gold-sigil left rail (icon nav + indigo presence + live clock), the command bar "soul" (C.O.O.P.'s spoken greeting + date/weather/clock + ⌘K field + quick-prompt chips), a responsive 12-col grid, mobile bottom nav, and standby screens for Finance/Knowledge/A.I.

✅ **Productivity, end-to-end**: `server-only` services over the locked schema, zod-validated Route Handlers (no Server Actions), and a real `/productivity` module. One shared `rankTasks()` defines "what should I do" everywhere.

✅ **Four live/placeholder panels**: **Priorities · Mission** (live, the lead), **Scripture · Foundation** (live — Newsreader serif, gold dropcap, recall meter), **Today's Calendar** (live `CalendarEvent` timeline with indigo "now" node), and **Finance · Stewardship** (first-class static placeholder, Sprint 3). `ai-note` annotations render static indigo placeholders. **No Intelligence Briefing panel** — C.O.O.P.'s briefing lives in the command-bar toast.

✅ **⌘K command bar**: real — keyboard nav, quick-add, quick-prompt chips, and a deliberately **stubbed** "Ask C.O.O.P." answering in the indigo response toast (no AI call). `motionEnabled` / `particlesEnabled` prefs map to the `no-motion` / `no-particles` body hooks for Sprint 5.

✅ **Daily-usable**: dev seed (dev-DB-guarded), honest empty/loading/error states, mobile pass. **Promoted to production** and verified on the phone over Tailscale, holding only real hand-entered data.

✅ **Boundaries held**: no migrations, no finance numbers, no AI calls, no motion. `docs/sprint-2-baseline.md` committed; `sprint-2-complete` tagged and pushed.

---

## Session Summary

| Session | Focus | Approx Time |
|---------|-------|-------------|
| #1 | Midnight & Gilt design system (tokens, 3 fonts, gilded primitives) | 50–65 min |
| #2 | Command-console shell (gold rail, command bar, grid, standby) | 60–80 min |
| #3 | **Productivity data layer (services, zod, route handlers)** | 60–75 min |
| #4 | **Productivity UI (projects + tasks, end-to-end)** | 75–90 min |
| #5 | Live panels (priorities lead, scripture, calendar) | 60–80 min |
| #6 | ⌘K command bar (nav, quick-add, quick-prompts, stubbed Ask + toast) | 50–65 min |
| #7 | Dev seed + empty/error states + mobile hardening | 40–55 min |
| #8 | E2E smoke test + **prod promotion** + baseline | 30–45 min |
| **Total** | | **~7.5–9.5 hours** |

The two sessions most worth slowing down on are **#3 and #4** — the productivity service layer and its UI are the actual point of the sprint, and `rankTasks()` is the small decision that quietly shapes how the whole system feels each morning. The session most worth not rushing is **#8** — promotion is when real, irreplaceable data starts accumulating, so confirm the backup net before the first real task.

---

## Heading Into Sprint 3

When `sprint-2-complete` is tagged and you've run real projects and tasks in prod from your phone for a few days, Sprint 3 picks up by:
- Building the **Finance · Stewardship module**: `Account` + `Transaction` services + UI over the existing schema (manual entry first), net-worth computation, and **CSV import**
- Replacing the **Finance placeholder** with the real stewardship panel: the gold-gradient net-worth figure from real balances, a sparkline from real transactions, account chips, recent spend, the upcoming-bills line, and the on-track/watch/over budget chip
- Reusing exactly the patterns proven this sprint — the service + Route-Handler shape, the gilded primitives, the panel and `ai-note` conventions — so finance is additive, not novel
- Leaving the **AI layer** (embeddings, retrieval, the real "Ask C.O.O.P." + the `ai-note` reasoning) for Sprint 4, and the **motion layer** (porting the prototype's ambient drift, particles, breathing, entrance animations, typewriter) for Sprint 5

Do not start Sprint 3 until C.O.O.P. has survived real daily use as a productivity tool — the whole premise is that each sprint ships something you actually rely on before the next begins.
