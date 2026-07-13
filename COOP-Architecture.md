# C.O.O.P. — Technical Architecture

**Cognitive Operations & Optimization Platform**

*Version 1.3 — Architecture Specification*
*Status: Productivity + dashboard shell live (Sprint 2 complete), design system implemented ("Midnight & Gilt"), single-host dev+prod model, pre-Sprint 3 (Finance)*

---

## 1. Overview

C.O.O.P. is a private, single-user life operating system: a centralized data engine that organizes, visualizes, and reasons across the major areas of one person's life, presented through a calm, cinematic command-center interface.

It is explicitly **not** a portfolio site, a productivity-app clone, a finance-app clone, or a second-brain clone. It is a unified life-data layer with an intelligent interface wrapped around it.

**North Star:** *Show me what I need to do, show me how the different areas of my life are looking, and keep me organized.*

**Primary user:** One person (the owner). Architected cleanly enough to evolve into a product later, but V1 makes no multi-tenant compromises.

---

## 2. Core Principles

These principles govern every downstream decision. When a tradeoff is unclear, defer to these.

1. **Foundation first.** Build the data layer, services, and AI/memory layer before the cinematic UI. Visuals wrap around solid architecture; they never substitute for it.
2. **Functional without animation.** The entire interface must remain fully usable with every animation and particle effect disabled. Motion is an enhancement, never a dependency.
3. **Calm on the hundredth view.** This is a daily-use tool, not a showpiece. Optimize for low-friction repeated use, not first-impression spectacle.
4. **Local-first, private by default.** Data lives on the owner's hardware. Cloud is used only where it earns its place.
5. **One unified data model.** Every domain (projects, finance, notes, calendar) shares a connected schema. Cross-domain connection is the whole point of the system.
6. **Tight V1 scope.** No full automation, no agentic workflows, no Plaid, no native mobile, no heavy 3D — in V1. These are deliberately deferred.
7. **Swap-ability over lock-in.** External dependencies (especially the AI provider) sit behind clean interfaces so they can be replaced without a rewrite.

---

## 3. Technology Stack

The stack is intentionally consolidated. A solo developer working a couple hours most nights, with AI assistance, moves fastest with one application, one deploy, and minimal moving parts.

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js + React | Single full-stack framework; server and client in one codebase. |
| Styling | Tailwind CSS | Fast, consistent, pairs well with a glass/dark design system. |
| Motion | Framer Motion | Declarative animation; easy to disable globally for principle #2. |
| Backend | Next.js API routes | One backend, one deploy. No separate FastAPI service in V1. |
| Database | PostgreSQL (Docker) | Relational integrity for the unified model; JSON columns where flexibility is needed. |
| ORM | Prisma | Type-safe schema, painless migrations — critical for an evolving data model. |
| State | Zustand | Lightweight client state without Redux overhead. |
| AI | Cheap external API behind a provider-agnostic interface | Sidesteps the 16GB local-LLM ceiling; far better reasoning than a local 7–8B model. |
| Embeddings | External embedding endpoint (same interface) | Cheap, fast, good enough for semantic search. |
| Visuals | CSS glassmorphism + one restrained particle canvas | The Jarvis feel at ~5% of the cost of WebGL. No Three.js in V1. |
| Containerization | Docker Compose | Reproducible local deploy on the Mac mini. |
| Remote access | Tailscale | Secure phone access without exposing anything to the public internet. |
| App auth | Single passcode/password | Network is private via Tailscale; this protects an unlocked device. |

### Explicitly deferred (not in V1)

- **FastAPI / separate backend** — revisit only if Next.js API routes cause real pain.
- **Three.js / React Three Fiber / WebGL** — V2 polish at the earliest. Hardware (16GB) and daily-use calm both argue against it now.
- **Local LLMs (Ollama)** — replaced by cheap API. The provider-agnostic interface keeps this reversible.
- **Plaid / bank integrations** — Sprint 3 ships manual entry only. CSV import and any bank connector are deferred to a later sprint; both arrive behind a single pluggable import-source interface when they do, so neither is a schema change.
- **Native iOS** — responsive web over Tailscale covers mobile for V1.

### Hardware context

Host is a 2024 Mac mini, M4, 16GB unified memory, 256GB SSD. Comfortably runs the Next.js app + Postgres + Docker. The 16GB ceiling is the key reason AI reasoning lives in an external API rather than a local model, and a reason to keep V1 visuals restrained.

---

## 4. The Unified Data Model

This is the most important and riskiest part of the architecture. Getting the entities and relationships right now prevents painful migrations later. The model is deliberately concrete.

### Design tenets

- Every meaningful entity has a stable `id`, `created_at`, and `updated_at`.
- Entities are **embeddable**: anything that holds text the AI should reason over gets a corresponding row in a shared `embeddings` table, rather than a vector column scattered across every table.
- **Links are first-class.** A generic linking mechanism lets any entity relate to any other (a transaction tied to a project, a note tied to a task), which is what makes cross-domain queries possible.
- Tasks are **priority/energy driven**, with dates optional — matching how the owner actually works.

### Core entities

**Project**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | e.g. "AuctionRick", "75 Hard tracker" |
| description | text | optional |
| status | enum | `active`, `paused`, `done`, `archived` |
| priority | enum | `low`, `medium`, `high`, `critical` |
| due_date | date | nullable — dates are optional |
| created_at / updated_at | timestamptz | |

**Task**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| project_id | uuid | nullable FK → Project (tasks can be standalone) |
| title | text | |
| status | enum | `todo`, `in_progress`, `done`, `blocked` |
| priority | enum | `low`, `medium`, `high`, `critical` |
| energy | enum | `low`, `medium`, `high` — drives "what can I do right now" |
| due_date | date | nullable |
| notes | text | optional |
| created_at / updated_at | timestamptz | |

**Account** (finance)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | e.g. "Checking", "Brokerage" |
| type | enum | `cash`, `checking`, `savings`, `investment`, `credit`, `loan`, `asset` |
| balance | numeric(14,2) | current balance (asset) or amount owed (liability) |
| is_liability | boolean | true for credit/loan |
| created_at / updated_at | timestamptz | |

**Transaction**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| account_id | uuid | FK → Account |
| amount | numeric(14,2) | signed: negative = outflow |
| category | text | manual categorization (free text or controlled list) |
| description | text | |
| occurred_on | date | |
| source | enum | `manual`, `csv_import`. Sprint 3 is **manual-only**; `csv_import` (and any future connector) lands later behind a pluggable import-source interface — an adapter add, not a schema change. |
| created_at / updated_at | timestamptz | |

**Note**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | |
| body | text | markdown |
| source | enum | `native`, `apple_notes_import` |
| created_at / updated_at | timestamptz | |

**CalendarEvent**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz | nullable |
| all_day | boolean | |
| location | text | optional |
| created_at / updated_at | timestamptz | |

**Reminder**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| title | text | |
| due_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| priority | enum | `low`, `medium`, `high` |
| created_at / updated_at | timestamptz | |

**Verse** (memorization)
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| reference | text | e.g. "Philippians 4:6" |
| text | text | manually entered |
| is_current | boolean | the one shown on the dashboard |
| created_at / updated_at | timestamptz | |

*Self-contained and minimal by design — the owner's own memorization method will extend this later.*

### Cross-domain linking

**Link** — the connective tissue of the system.
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| from_type | text | entity type, e.g. `transaction` |
| from_id | uuid | |
| to_type | text | entity type, e.g. `project` |
| to_id | uuid | |
| relation | text | optional label, e.g. `expense_of`, `note_for` |
| created_at | timestamptz | |

This polymorphic link table lets any entity connect to any other without a web of foreign keys. It is what makes "show all spending and notes related to AuctionRick" a single query pattern.

### Embeddings (AI memory)

**Embedding**
| Field | Type | Notes |
|---|---|---|
| id | uuid | PK |
| source_type | text | which entity this vector represents |
| source_id | uuid | |
| content | text | the text that was embedded (for grounding/citation) |
| vector | vector | pgvector column |
| created_at | timestamptz | |

Use the **pgvector** Postgres extension so vectors live alongside the relational data — no separate vector database in V1. One embeddings table indexes content across every domain, which is what powers cross-module semantic search.

### Relationship summary

- Project **1 — many** Task
- Account **1 — many** Transaction
- Any entity **— many** Link **— many** any entity (polymorphic)
- Any text-bearing entity **1 — 1+** Embedding
- Verse: one row flagged `is_current` surfaces on the dashboard

---

## 5. AI Architecture

The AI layer is what turns C.O.O.P. from a dashboard into an operating system. V1 targets **Level 2**: semantic search, summaries, contextual retrieval, grounded responses, and cross-module querying. (Level 3 — proactive insights and pattern detection — is V2.)

### Provider-agnostic interface

All AI calls go through a single internal interface with two methods conceptually: `embed(text)` and `complete(prompt, context)`. The concrete provider (the cheap API chosen) sits behind it. Swapping providers, or routing hard queries to a stronger model later, is a config change — never a rewrite. This directly serves principle #7.

### RAG pipeline (V1)

1. **Ingest** — when an entity is created or updated, its text is embedded and stored in the `Embedding` table.
2. **Retrieve** — a user query is embedded, then matched against stored vectors via pgvector similarity search.
3. **Ground** — the top matching content rows are passed as context to the completion call.
4. **Respond** — the model answers using only retrieved context, with the source content available for grounding.

### Target V1 queries

- "What projects are falling behind?"
- "Summarize my priorities."
- "What major expenses hit this month?"
- "What have I focused on recently?"
- "Show all notes related to AuctionRick."

### Deferred to V2 (Level 3)

Strategic recommendations, behavioral pattern analysis, neglected-goal detection, project health scoring, AI-generated weekly reviews, proactive insights.

---

## 6. Infrastructure & Deployment

### Single-host model: the Mac mini is both dev and prod

The Mac mini is simultaneously the **development machine** and the **production host**. There is no separate laptop pushing to a remote server — code is written, run, and served on the same box. This is a deliberate, supported setup, but it imposes one hard rule: **development must never touch production data.** The separation below exists entirely to enforce that rule.

### Two environments, one machine

Dev and prod run the *same code* — the separation is achieved by distinct ports, distinct databases, and distinct env files, not distinct images or repos.

| | Production | Development |
|---|---|---|
| Purpose | The always-on app you open every morning | Where you build and experiment |
| App | Dockerized, `restart: unless-stopped`, port **3000** | Native `pnpm dev`, port **3001** |
| Database | Postgres in Docker, **internal network only** (no host port) | Postgres in Docker, host port **5433** (for Prisma Studio/tooling) |
| DB volume | `coop_db_data` | `coop_dev_db_data` |
| Env file | `docker/.env` (never committed) | `.env` (never committed) |
| Data | Real life data — protected | Fake/throwaway — disposable |
| Lifecycle | Runs detached, always | Started only while actively coding, then stopped |

**Why two databases is the whole point:** developing against the production database means every schema experiment, test script, or stray `deleteMany()` is played with live ammunition. A separate dev database makes destructive experimentation free. The resource cost is near-zero — an idle Postgres is ~50–150MB RAM and a few MB of disk for fake data; the Postgres image itself is shared, not duplicated.

### Resource note (16GB ceiling)

Because dev and prod share 16GB of unified memory, the prod stack is kept lean (app + one Postgres, both idle-light). The second, dev Postgres adds only a mostly-idle process. Real memory pressure comes from the dev server + editor + browser during active coding — none of which are duplicated. Avoid running heavy dev *builds* while relying on prod; otherwise the two coexist comfortably.

### The promotion boundary

The flow from experiment to live:

1. Develop and test against the **dev** database (port 3001 / DB 5433).
2. Run `pnpm db:snapshot` before any migration (cheap insurance even in dev).
3. Commit and `git push`.
4. Run the deploy script, which rebuilds the **prod** container and runs `prisma migrate deploy` against the **prod** database.

The boundary is deliberate: "where I experiment" and "what I rely on" are never the same database, even though they live on the same machine.

### Remote access

Tailscale provides an encrypted private network so the owner's **phone** reaches the prod app by the Mac mini's Tailscale address (port 3000) — nothing is exposed to the public internet. Since dev and prod are the same machine, Tailscale is purely about phone access to prod, not about reaching a remote box.

### Storage

All C.O.O.P. data lives on the Mac mini's **internal SSD**, stored in Docker named volumes (`coop_db_data` for prod, `coop_dev_db_data` for dev). At single-user scale the data itself is small — megabytes growing slowly, with embeddings the only mildly space-hungry component (tens to low-hundreds of MB over a long time). Real disk pressure comes not from the data but from Docker's accumulating images, build cache, and dangling layers; periodic `docker system prune` keeps this in check.

**The 2TB external media drive (ExFAT) is explicitly excluded from database use.** ExFAT lacks the file locking and permissions Postgres requires and risks data corruption — the exact failure mode the backup strategy exists to prevent. It stays media-only.

**Future option (not needed now):** if internal disk headroom ever tightens, add a dedicated drive formatted **APFS**, left permanently attached to the mini, and relocate Docker Desktop's disk image to it (Settings → Resources → Advanced → Disk image location). This is a one-time settings change that touches no code or schema. It is deferred until `docker system df` shows real strain.

### Configuration

All secrets (AI API key, database credentials, app passcode, session secret) live in environment variables, never in the repo. Two env files — `.env` for dev, `docker/.env` for prod — keep the two environments from ever pointing at each other's database.

---

## 7. Security

Security in V1 is deliberately simple but real:

- **Network layer:** Tailscale. The app is unreachable except from devices on the owner's tailnet. This removes the entire class of public-internet attack surface.
- **Application layer:** a single passcode/password gate. Its job is to protect the app if a logged-in device is unlocked and unattended — not to defend against the open internet (Tailscale already does that).
- **Secrets:** environment variables only; never committed.
- **Data residency:** all personal data stays on the Mac mini and its backups. The only data leaving the device is the minimum text sent to the AI API for embeddings and completions — a known, accepted tradeoff for using a cheap external model, and reversible via the provider-agnostic interface.

---

## 8. Backup & Recovery

Built in Sprint 1, **before** there is data worth losing. Backups target the **production** database only (dev data is disposable). Three independent layers:

1. **Nightly `pg_dump`** of the prod database to a folder synced to iCloud Drive (or Backblaze B2, ~$1/mo). This is the primary safety net — recovery is restoring a single `.sql` file. _(Active.)_
2. **Time Machine** on the Mac mini to an external drive — captures the whole system, not just the database. _(Deferred — see status note below.)_
3. **Git** for all code, pushed to a private GitHub repo. _(Active.)_

Additionally, an on-demand `pnpm db:snapshot` is run before any migration in either environment — cheap insurance against a bad schema change.

> **Time Machine status — deferred (post–Sprint 1).** As of the Sprint 1
> baseline, no Time Machine destination is configured: the Mac mini does not yet
> have a dedicated external drive to back up to. Until one is available, the
> active safety nets are the nightly `pg_dump` (iCloud-synced, offsite) plus
> Git. This is an accepted, temporary gap — the database, the only irreplaceable
> state, is covered by the dumps; Time Machine adds whole-system (OS, config,
> Docker) recovery, which is convenience rather than data-of-record. When a
> dedicated external drive is attached (formatted **APFS** per §6 — the 2TB
> ExFAT media drive must not be used), enable Time Machine, then update this
> section and `docs/sprint-1-baseline.md`. Tracked as a follow-up carried out of
> Sprint 1.

**Recovery objective:** if the Mac mini fails, at most one day of **database**
data is lost, and the system is restorable from the dump + repo. (Whole-system
restore via Time Machine is added once layer 2 is active.) No real-time
replication in V1 — that is deferred indefinitely as unnecessary complexity for
a single user.

---

## 9. The Dashboard (Morning Screen)

The dashboard *is* the product. Everything else is data feeding it. It answers the North Star at a single glance.

### Layout skeleton (the command-center frame)

The visual direction is **"Midnight & Gilt" — an illuminated instrument**: a warm, gilded command console (JARVIS by way of an illuminated manuscript), not a page. Three persistent structural elements wrap the content:

- **Left status rail** (fixed, ~92px wide): a gold sigil monogram + ring, a mono "C.O.O.P." identifier, vertical icon navigation (Dashboard, Productivity, Finance, Knowledge, A.I. Core), and a system-status cluster at the bottom (an indigo presence dot + "READY" readout + live clock). Collapses to a bottom nav on mobile.
- **Top command bar** (sticky) — *the soul of the interface*: C.O.O.P.'s contextual, spoken greeting + a softer voice clause; a mono status cluster (date · weather · local time · "C.O.O.P. READY"); the ⌘K "Ask C.O.O.P." field (gold ✦ spark, glows on focus); and a row of quick-prompt chips. This bar is the primary input method and the seat of the AI layer — C.O.O.P.'s responses surface in an indigo response toast.
- **Panel grid** (12-column): the life telemetry, organized around the three pillars.

### The three pillars (and the panels)

The dashboard is organized around three pillars — **Finance (stewardship)**, **Priorities (mission)**, and **Scripture (foundation)** — with the calendar and system status as secondary. Four panels render on the dashboard:

1. **Priorities · Mission** — the lead panel: a ranked task list with priority bars and energy tags (low/med/high), driven by the shared task ranking. Live from Sprint 2.
2. **Today's Calendar** — a vertical day timeline with an indigo "now" marker. Reads calendar events from Sprint 2; manual/Google entry is later.
3. **Finance · Stewardship** — the hero-weight panel: net worth as a gold-gradient lead figure, a trend sparkline, account balances, recent spending, upcoming bills, and an on-track/watch/over budget signal. Real data lands in Sprint 3; a first-class static placeholder before then.
4. **Scripture · Foundation** — reference + verse set in a serif face with a gilded dropcap, plus a recall/progress indicator (the owner's memorization method extends this later). Live from Sprint 2.

The **contextual greeting** lives in the command bar, not the grid. There is **no standalone intelligence-briefing panel** — C.O.O.P.'s natural-language briefing ("the system reports to you") surfaces on demand through the command-bar response toast, wired in Sprint 4. Small indigo `ai-note` annotations thread C.O.O.P.'s voice through the panels (static placeholders until Sprint 4).

> **Layout note (locked):** the dashboard leads with **Priorities** top-left (a 7-wide × 2-tall block) and places the **Finance** hero on the floor row (also 7-wide). Both lead columns are hero-weight, and Finance keeps its hero visual treatment — the large gold-gradient net-worth figure — regardless of row. This Priorities-led arrangement is confirmed and is the locked layout.

### Design system — "Midnight & Gilt" (extracted from the locked prototype)

These tokens are the visual contract for Sprint 2 onward. Implement them once as CSS custom properties + Tailwind theme extensions; do **not** reinvent per-component. The prototype (`coop.css` / `coop.js` / the Command Center HTML) is the reference: Sprint 2 ports its *static* layer; Sprint 5 ports its *motion* layer.

**Color tokens**
| Token | Value | Role |
|---|---|---|
| `bg` | `#0b0a09` | Base background (warm near-black) |
| `bg-2` | `#110d0a` | Secondary background |
| `panel` | `rgba(26,23,18,0.55)` | Gilded glass panel fill |
| `panel-deep` | `rgba(18,15,11,0.50)` | Inset fill (inputs, chips, accounts) |
| `border` | `rgba(210,170,90,0.12)` | Panel border (rest) |
| `border-hover` | `rgba(222,186,112,0.30)` | Panel border (focus/hover) |
| `text` | `#f1ebdd` | Primary text (warm off-white) |
| `text-soft` | `#b6ab96` | Secondary text |
| `text-faint` | `#7c715c` | Tertiary/metadata text |
| `gold` | `#d8a94b` | Signature accent |
| `gold-hi` | `#f0cd84` | Highlight gold (gradients, glints) |
| `indigo` | `#5663c9` | C.O.O.P.'s voice — AI/system cue |
| `good` | `#5fbf91` | Positive / high energy / on-track |
| `warn` | `#e0934e` | Caution / medium |
| `alert` | `#d8556b` | High priority / over budget |

The base background is a warm radial gradient; `--glow-gold` / `--glow-indigo` (via `color-mix`) drive accent halos, and a single `--glow-mult` (default 1) scales all glow intensity. Panel radius is 20px.

**Typography**
- **Sora** (200–600) — UI and display. Large figures use ultra-light (200) for the cinematic feel; body text sits at 300.
- **Spline Sans Mono** (300–500) — all metadata, labels, timestamps, tags, status readouts. The monospace sells the "instrument" character.
- **Newsreader** (italic, 300–500) — reserved for scripture/verse text only, paired with a gold-gradient dropcap.

**Surfaces & effects**
- Panels: 20px radius, `backdrop-filter: blur(22px)`, warm glass fill, a 1px **gold** gradient border (gold→transparent→gold-hi via mask technique), deep drop shadow + faint warm inset highlight.
- Accent glows are *low-opacity gold halos* (box-shadow, scaled by `--glow-mult`), never solid neon.
- Roles by color: gold is the signature accent for everything; **indigo is reserved for C.O.O.P.'s voice** (presence dot, calendar "now" marker, `ai-note` glyph, response toast). Priority bars: gold (base) / warn (med) / alert (high). Energy tags: good (high) / warn (med) / faint (low).

**Motion (Sprint 5 only — all global-toggle-able, per principle #2)**
- Ambient drifting gold glow halos (~80–110s loops).
- Low-density particle field (~26 gold/indigo particles rising slowly).
- Faint masked gold grid texture + vignette.
- Panels rise/fade in on load with staggered delay.
- "Breathing" pulse on live indicators (presence dot, current-event node), a recall-bar fill, and a typewriter reveal on C.O.O.P.'s response.
- Gated by both `prefers-reduced-motion` and the `no-motion` / `no-particles` body classes (toggled via UI prefs).

**Responsive behavior**
- ≤1180px: two-up — Priorities/Calendar on the top row, Finance/Scripture on the floor.
- ≤760px: left rail hidden, replaced by a fixed glass **bottom nav**; panels stack to a single column; the command bar + ⌘K stay accessible and the response toast docks to the bottom.

**Implementation note:** the prototype is a reference, not a codebase to copy — its hardcoded data and mock answers are not reused. Sprint 2 rebuilds these as real Next.js/React components styled with Tailwind, consuming live data, porting the *static* visual language. The prototype's motion (ambient drift, particles, breathing, entrance animations, typewriter) is the reference for Sprint 5, not Sprint 2. The detailed, Kiro-facing version of this contract lives in `.kiro/steering/design.md`.

---

## 10. Build Plan (Sprints)

Agile sprints, each ending in a **demo-able, daily-usable state**. Do not start a sprint until the previous one survives real use.

**Sprint 1 — Foundation**
Repo, Docker Compose, PostgreSQL + pgvector, Prisma schema for the full unified model, app passcode auth, Tailscale access, and automated backups. No features yet — just a solid, secure, recoverable base.

**Sprint 2 — Productivity + Dashboard Shell**
Projects and tasks (priority/energy driven). The dashboard shell with real panels wired to real data. Goal: the owner runs actual projects/tasks in it daily.

**Sprint 3 — Finance**
Accounts, transactions, and net worth via **manual entry** (balances maintained by hand, including investments — no live price feeds). The module lives at a tabbed `/finance` surface: **Reporting** (read-only telemetry — net worth, cash flow, spend-by-category, account balances, recent transactions) and **Ledger** (account + transaction CRUD) ship live; a **Budgeting** tab is a standby placeholder (targets/envelopes need their own model — a later addition). The dashboard's Finance placeholder panel is replaced with a real panel reading the same service layer. CSV import is deferred to a later sprint (see §3). Reads happen in Server Components via a new `src/lib/finance/` service layer; mutations flow through Route Handlers + `router.refresh()`, with zod-validated input. Goal: usable for real spending, not a demo.

**Sprint 4 — AI Layer**
Embeddings on existing data, pgvector retrieval, RAG pipeline, semantic search and summaries, cross-module Q&A. Now reasoning over real accumulated data.

**Sprint 5 — Polish**
The full glass aesthetic, the particle system, cinematic-but-calm transitions. Last, not first — by design.

---

## 11. Out of Scope for V1 (Tracked for V2+)

Recorded so the vision isn't lost while V1 stays tight: Level 3 proactive AI; rich knowledge system / journals / Bible-study graph; Google Calendar integration; health & fitness layer; digital-presence layer (GitHub/social stats); advanced holographic/WebGL UI; native iOS app; Plaid/bank integrations; investment holdings & live price tracking (V1 investment balances are maintained manually). Budgeting (targets/envelopes) is planned but unscheduled — it needs its own data model and gets a standby placeholder in the Finance module until a dedicated sprint picks it up.

---

*End of architecture specification. This is a living document — version it in the repo and revise as sprints reveal reality.*
