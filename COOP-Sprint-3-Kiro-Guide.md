# C.O.O.P. — Kiro Implementation Guide: Sprint 3
## Finance · Stewardship: Reporting + Ledger, Manual Entry Over the Unified Schema

---

## Overview

Sprint 2 turned C.O.O.P. into a thing you open every morning — the Midnight & Gilt shell, the Productivity module end-to-end, the live dashboard, and the ⌘K command bar. One pillar was deliberately left as a first-class *placeholder*: **Finance · Stewardship**. Sprint 3 makes it real. By the end, the `/finance` route stops being a MODULE STANDBY and becomes a tabbed instrument — **Reporting** (read-only telemetry) and **Ledger** (manual account + transaction CRUD) shipping live — and the dashboard Finance hero reads real numbers from the same service layer.

The North Star for this sprint is concrete: **the owner keeps every account balance and financial record by hand in C.O.O.P., sees net worth and cash flow at a glance, and trusts it as the stewardship view — on the phone over Tailscale, from a dashboard that answers "how am I doing" without a single external feed.**

The scope is intentionally narrow and already decided (see `COOP-Architecture.md` §10, v1.3): **manual entry only.** Balances are maintained by hand; net worth is computed from them. Transactions are a **ledger/record** that powers cash-flow and spend-by-category views — they do **not** recompute balances (no double-entry). CSV import, holdings/positions, and budgeting envelopes are **deferred** to later sprints. This is the pattern Sprint 2 proved, applied to a second domain: a `server-only` service layer over the *existing* Prisma schema, zod-validated Route Handlers, `router.refresh()` mutations, and a UI ported from a locked prototype.

The visual direction is already locked and prototyped: `design-reference/finance.{css,js}` is the **source of truth** for the `/finance` surface, and `.kiro/steering/design.md` already carries the **"Finance module (Sprint 3)"** contract. Sprint 3 ports the **static** layer of that prototype; motion stays in Sprint 5, by design (principles #1 and #2 — functional without animation).

**What you're building:**
- The **Finance data layer**, built first (foundation before UI): a `server-only` service over the existing `Account` + `Transaction` models, zod schemas for both, and Route Handlers under `src/app/api/accounts` and `src/app/api/transactions`. Net worth, cash flow, spend-by-category, and the sparkline series are **derived in the service layer** so every surface computes them one way
- The **`src/components/finance/view.ts`** projection (Option B): the single, TOTAL mapping between the prototype's leaner model and the Sprint-1 schema — signed `Transaction.amount` ↔ `flow` + magnitude, `isLiability` ↔ `liability`, `AccountType` ↔ the prototype's lowercase type, `source: MANUAL` on every create, free-text uppercased `category`
- The **tabbed `/finance` surface**: a gilded segmented tab strip (**REPORTING · LEDGER · BUDGETING**, keyboard-reachable), the **Ledger** tab (accounts CRUD + transactions CRUD with an account filter-chip row, amount-tinted rows, two-click inline delete, a latest-30 cap, and a C.O.O.P.-voice foot note), the **Reporting** tab (net-worth hero + period selector + sparkline, cash-flow, assets-vs-liabilities rollup, spend-by-category, recent transactions), and **Budgeting** as a static standby pane
- The **dashboard Finance · Stewardship panel** wired to real data — the Sprint 2 placeholder replaced with a panel reading the same `src/lib/finance/` service layer (net worth from real balances, a real sparkline, account chips, recent spend)
- A **dev seed extension** (accounts + a spread of transactions) so Reporting has real-shaped content to build against, plus the **empty / loading / error** states every data-backed view requires, a **finance smoke** check, and a mobile pass
- The deliberate **promotion to production** (Session #6), mirroring Sprint 2's rigor — and note that `prisma migrate deploy` is a **no-op** this sprint, because there is no migration

**What this sprint does NOT include:**
- **Schema changes.** `Account` and `Transaction` shipped in Sprint 1 and are complete. Sprint 3 adds **no** tables or columns. The prototype's leaner model is a *view* over the schema (Option B via `view.ts`), never a migration down
- **CSV import.** Deferred to a later sprint, to land behind a **pluggable import-source interface** — an adapter add, not a schema change. Every transaction this sprint sets `source: MANUAL`. (The `TransactionSource.CSV_IMPORT` enum value already exists in the schema; nothing writes it yet)
- **Budgeting.** Targets/envelopes need their own model — a later sprint. The BUDGETING tab is a static MODULE STANDBY pane only
- **Holdings / positions / market data.** No tickers, no share counts, no live prices. An investment account is just a manually-maintained balance
- **Double-entry / balance automation.** Transactions are a record; they never mutate account balances. Balances are hand-entered, full stop
- **Any real AI.** The Finance `ai-note` annotations render **static placeholder copy** (Sprint 4 fills them). No embeddings, no retrieval, no provider call
- **The motion layer.** No Framer Motion, no entrance animations, no drifting glow, no breathing pulses (all Sprint 5). The finance surface ships as still gilded glass
- Plaid / bank feeds, native iOS, multi-user — same V1 exclusions as always

This sprint produces the second body of data you intend to keep — real financial records. Treat the promotion to prod (Session #6) with the same seriousness as Sprint 2's: the moment you type a real balance into the prod app is the moment the backup system earns its keep again.

> **Note on the source-of-truth docs:** `COOP-Architecture.md` is now at **v1.3** — §4 (the `Account` + `Transaction` model), §6 (single-host dev/prod discipline), and §10 (Sprint 3 scope: manual-only, CSV deferred, holdings/budgeting deferred) are current, read them. For anything **visual or interactive** on the `/finance` surface, `.kiro/steering/design.md`'s "Finance module (Sprint 3)" section and `design-reference/finance.{css,js}` win.

---

## Prerequisites

- [ ] `sprint-2-complete` tag exists and `docs/sprint-2-baseline.md` shows all green (repo builds, prod + dev stacks healthy, productivity live in prod, phone reaches prod over Tailscale, real projects/tasks entered)
- [ ] You've **run C.O.O.P. as a productivity tool in prod for a few days** — the whole premise is that each sprint ships something you rely on before the next begins
- [ ] Architecture doc re-read at **v1.3**: **§4** (`Account`/`Transaction` fields — note `amount` is a single **signed** `Decimal(14,2)`, `Account.balance` is manual, `Transaction.accountId` is **required**, `Account → Transaction` is `onDelete: Cascade`), **§6** (two-environment single-host model), **§10** (Sprint 3 scope)
- [ ] The **finance prototype** (`design-reference/finance.css`, `design-reference/finance.js`) open for reference — it's the visual + interaction source of truth. Its `localStorage` persistence, seed data, and any animation are **not** copied wholesale; Sprint 3 mines its static visual language and interaction shape
- [ ] `.kiro/steering/design.md` already contains the **"Finance module (Sprint 3)"** section (the locked contract). Confirm it's present before Session #1
- [ ] The Sprint 2 **productivity implementation** open as the pattern to mirror: `src/lib/productivity/{projects,tasks,prisma-error}.ts`, `src/lib/validation/{project,task}.ts`, `src/lib/api/http.ts`, `src/app/api/projects/**`, `src/components/productivity/{view,board,segmented,prod-modal,delete-button,filter-chips}.tsx`
- [ ] `pnpm dev:db:up` runs and the dev Postgres (port 5433) is healthy — all Sprint 3 development happens here
- [ ] You can run `pnpm dev` (port 3001) and reach the dashboard locally
- [ ] Node 22+, pnpm, Docker Desktop still set to start at login

> **Environment discipline (unchanged since Sprint 1):** every account, transaction, and derivation you build this sprint is developed against the **dev** database (port 5433, via `.env`). Production stays untouched until you deliberately promote in Session #6. Run `pnpm db:snapshot` before any migration — though Sprint 3 requires **zero** migrations, since `Account` and `Transaction` already exist.

> **The data model is locked (read this twice).** `Account` and `Transaction` shipped in Sprint 1 exactly as §4 specifies. Sprint 3 reads from and writes to that schema; it does not change it. If you ever feel you need a new column — a `flow` boolean, a `budgeted` field, a `holdings` table — that is a signal to re-check the approach (project it through `view.ts`), not to migrate. The one deliberate, decided divergence from the prototype is that the app follows the **schema**, not the prototype, on two points (transactions always require an account; account deletion is guarded) — see Session #1.

> **Manual-only, no double-entry (the hard product rule).** `Account.balance` is entered by hand. Net worth = assets − liabilities, computed from balances. `Transaction` rows are a **ledger/record** — they drive cash-flow, spend-by-category, and the sparkline for the selected period, and they **never** recompute a balance. Do not add "apply this transaction to the balance" logic anywhere. If that rule ever feels wrong, it's a future-sprint conversation, not a Sprint 3 shortcut.

---

## Steering File Setup

Sprint 2 created `design.md` and already added its **"Finance module (Sprint 3)"** section — the visual contract for this surface. Sprint 3 **updates three files** (`product.md`, `tech.md`, `structure.md`) and **confirms** `design.md`. Make these edits before Session #1 so they're in Kiro's context on every prompt.

### Update `.kiro/steering/product.md`

Mark Sprint 2 done and correct the Sprint 3 line — architecture v1.3 defers CSV, so the plan should not promise it this sprint:

```markdown
## V1 sprint plan
- Sprint 1: Foundation — repo, Docker, Postgres+pgvector, full Prisma
  schema, auth, Tailscale, backups. (COMPLETE — tag sprint-1-complete)
- Sprint 2: Productivity + dashboard shell. "Midnight & Gilt" design
  system, command console, Projects + Tasks, four panels, ⌘K. Static
  gilded glass only. (COMPLETE — tag sprint-2-complete; promoted to prod)
- Sprint 3 (current): Finance · Stewardship — replaces the Finance
  placeholder. MANUAL entry only: hand-kept balances, net worth =
  assets − liabilities, a transaction ledger driving cash-flow &
  spend-by-category. Tabbed surface: Reporting (live) + Ledger (live);
  Budgeting is standby. NO CSV (deferred, behind a pluggable
  import-source interface), NO holdings, NO budgeting model, NO motion.
- Sprint 4: AI layer (embeddings, RAG) — powers "Ask C.O.O.P." + ai-notes.
- Sprint 5: Visual polish — ports the prototype's MOTION layer.

## The three pillars (the system's spine)
Finance = stewardship. Priorities = mission. Scripture = foundation.
Calendar and system status are secondary. Every design and product
decision serves surfacing these three at a glance.
```

### Update `.kiro/steering/tech.md`

```markdown
## Sprint 3 activations / clarifications
- Data access pattern (unchanged — same as Sprint 2, applied to finance):
  * Reads: Server Components import service functions from
    src/lib/finance/ directly (accounts, transactions, and the derived
    net-worth / cash-flow / spend-by-category / sparkline figures).
  * Mutations: client components POST/PATCH/DELETE to Route Handlers
    under src/app/api/{accounts,transactions}/, which call the same
    service layer; then router.refresh(). No Server Actions.
- Reporting period selection is a URL search param (?period=month|
  quarter|ytd), read server-side, so all derivations stay in RSC. The
  tab strip's active tab is client state (useState); it toggles
  already-server-rendered panes (no per-tab fetch).
- Validation: zod schemas for accounts + transactions in
  src/lib/validation/. Signed-amount handling lives in the finance
  view projection (src/components/finance/view.ts), not scattered.
- Money: Account.balance and Transaction.amount are Prisma Decimal(14,2).
  Do arithmetic on Prisma.Decimal (or integer cents) — never coerce to a
  JS float for sums. Format for display only at the edge.
- Framer Motion stays DEFERRED to Sprint 5. Add no new runtime deps for
  finance — reuse the productivity control primitives verbatim.
```

### Update `.kiro/steering/structure.md`

```markdown
## Sprint 3 additions to src/
src/
├── app/
│   ├── (app)/finance/page.tsx        # REAL tabbed surface (replaces standby)
│   └── api/
│       ├── accounts/route.ts             # list/create
│       ├── accounts/[id]/route.ts        # get/update/delete (delete GUARDED)
│       ├── transactions/route.ts         # list (?accountId=) / create
│       └── transactions/[id]/route.ts    # get/update/delete
├── components/
│   └── finance/   # FinanceSurface (client tab shell), Tabs, Reporting,
│       │          #   Ledger, AccountsPanel, AccountCard, AccountForm,
│       │          #   TransactionsPanel, TxRow, TxForm, TxFilterChips,
│       │          #   NetWorthHero, PeriodChips, Sparkline, CashFlow,
│       │          #   SpendByCategory, AcctRollup, RecentTx, BudgetStandby,
│       │          #   view.ts (signed-amount / liability / type projection),
│       │          #   format.ts (money/date), options.ts
├── lib/
│   ├── finance/   # services (server-only): accounts.ts, transactions.ts,
│   │              #   reporting.ts (net worth / cash flow / spend / series),
│   │              #   period.ts (month|quarter|ytd bounds)
│   └── validation/ # account.ts, transaction.ts (zod)
└── (scripts/finance-smoke.ts; seed-dev.ts extended with finance)

## Sprint 3 additions to components/panels/
- finance-panel.tsx REPLACES finance-placeholder.tsx on the dashboard —
  reads src/lib/finance/ (real net worth, sparkline, accounts, spend).
```

### Confirm `.kiro/steering/design.md`

No new edit needed — `design.md` already carries the **"Finance module (Sprint 3)"** section (the tab strip, Reporting/Ledger layout, the manual-balances rule, the Option B `view.ts` mapping, and the two schema-truth rules). It is the visual + interaction source of truth for everything below; `design-reference/finance.{css,js}` is the concrete reference it points at. Re-read that section before Sessions #2–#4.

> Commit the steering changes on their own before any code:
> ```bash
> git add .kiro/steering/
> git commit -m "docs(sprint-3): steering — finance scope (manual-only, CSV deferred), structure, tech"
> ```

---

## Session #1: Finance Data Layer (Services + Validation + Route Handlers + Derivations)

### What You're Building

The backend for accounts and transactions, built **before** any finance UI (foundation first, exactly like Sprint 2's productivity data layer). A `server-only` service layer is the single place Prisma is touched for these entities; zod schemas validate all input; Route Handlers expose create/read/update/delete. Net worth, cash flow, spend-by-category, and the sparkline series are computed **here**, in the service layer, so every surface derives them one way. No screens this session — you prove it with a smoke script.

> **Environment note:** dev DB only (5433). **No migration** — `Account` and `Transaction` already exist from Sprint 1. If Prisma reports drift, stop and reconcile; do not "fix" it with a new migration.

> **Two places the app follows the schema, not the prototype (decided, §design.md):**
> 1. **Transactions always belong to an account.** `Transaction.accountId` is **required**. The prototype's "UNLINKED"/orphan transaction is a prototype-only affordance and is **not** carried into the app.
> 2. **Account deletion is guarded.** The schema is `onDelete: Cascade`, but silently cascading real financial records is the wrong default. The `deleteAccount` service **refuses** to delete an account that still has transactions (throws a conflict → the UI blocks + confirms). Deleting real ledger history is a deliberate two-step, never a side effect.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 4: Account + Transaction; section 10: Sprint 3
  scope — manual only, no double-entry, CSV deferred)
- .kiro/steering/design.md   (the "Finance module (Sprint 3)" section — the
                              view projection + the two schema-truth rules)
- .kiro/steering/tech.md     (services + Route Handlers, Decimal discipline)
- .kiro/steering/conventions.md
- prisma/schema.prisma        (Account, Transaction, AccountType,
                              TransactionSource — DO NOT change them)
- src/lib/db/client.ts
- src/lib/errors.ts, src/lib/api/http.ts
- src/lib/productivity/projects.ts, tasks.ts, prisma-error.ts  (mirror these)
- src/lib/validation/project.ts, task.ts                        (mirror these)
- src/app/api/projects/route.ts, [id]/route.ts                  (mirror these)

## Task 1: Validation schemas

src/lib/validation/account.ts and transaction.ts (zod), mirroring the Prisma
enums and the project/task schemas' shape (shared field object; defaults ONLY
on the create schema; update = .partial() of the base so a PATCH never resets
an omitted field):
- accountCreateSchema: name (1..120), type (AccountType), balance
  (coerce number → Decimal-safe; may be negative for a liability balance? NO
  — keep balance a non-negative magnitude; the isLiability flag carries the
  sign in net-worth math), isLiability (default false).
- accountUpdateSchema: partial.
- transactionCreateSchema: accountId (uuid, REQUIRED — no null), amount
  (a SIGNED number; negative = outflow, positive = inflow; non-zero),
  category (1..60, trimmed, uppercased), description (1..200, trimmed),
  occurredOn (coerce ISO date), source defaulting to MANUAL.
- transactionUpdateSchema: partial. Export inferred TS types.
NOTE: the UI speaks flow+magnitude, but the SCHEMA/service speak the single
signed amount. The flow↔signed conversion is view.ts's job (Session #2); the
service accepts the already-signed amount.

## Task 2: Account service — src/lib/finance/accounts.ts ('server-only')

- listAccounts(): all accounts, each with its transaction count; ordered
  liabilities-last then name (a stable, readable order for the ledger cards).
- getAccount(id), createAccount(input) (source is a Transaction concern, not
  here), updateAccount(id, input).
- deleteAccount(id): GUARD — if the account has ≥1 transaction, throw a
  ConflictError (do NOT cascade). Only delete when it has zero transactions.
- Validate via the zod schemas; translate Prisma errors via a shared
  prisma-error helper (reuse/mirror src/lib/productivity/prisma-error.ts;
  add P2003 handling if not present).

## Task 3: Transaction service — src/lib/finance/transactions.ts ('server-only')

- listTransactions(opts?): filter by accountId; ordered occurredOn desc then
  createdAt desc; support a limit (the Ledger caps at 30, Reporting recent at
  ~8). Return the account relation (or name) for row display.
- getTransaction, createTransaction (always sets source: MANUAL unless the
  input says otherwise — MANUAL is the only value written this sprint),
  updateTransaction (.partial()), deleteTransaction.
- Transactions NEVER touch Account.balance. No balance mutation anywhere.

## Task 4: Reporting derivations — src/lib/finance/reporting.ts + period.ts ('server-only')

src/lib/finance/period.ts: a Period type ('month'|'quarter'|'ytd') and
periodBounds(period, now) → { start, end, label } using the server's local
day (mirror the prototype's periodStart: month start, quarter start, Jan 1).
src/lib/finance/reporting.ts (all Decimal-safe):
- getNetWorth(): { assets, liabilities, net } from account BALANCES
  (assets = Σ non-liability balances; liabilities = Σ liability balances;
  net = assets − liabilities). Manual balances only — transactions are NOT
  summed into this.
- getCashFlow(period): { income, spend, net } from transactions in the
  period (income = Σ positive amounts; spend = Σ |negative amounts|;
  net = income − spend).
- getSpendByCategory(period, topN=6): outflows grouped by category, summed,
  sorted desc, capped.
- getNetWorthSeries(period): a cumulative series across the period's
  transactions anchored so the LAST point equals current net worth and the
  first = net − periodNet (mirror the prototype's spark math). This is a
  cash-flow trajectory derived from records — we do NOT store balance
  history; document that honestly in a comment.
- getRecentTransactions(limit=8): latest across all accounts.

## Task 5: ConflictError + http mapping

If src/lib/errors.ts lacks it, add a ConflictError; map it in
src/lib/api/http.ts errorResponse to HTTP 409. Keep the existing 400/404/500
mappings. This is the status the account-delete guard returns.

## Task 6: Route Handlers (JSON; zod-validate bodies; 400/404/409/200/201)

- src/app/api/accounts/route.ts         GET list, POST create
- src/app/api/accounts/[id]/route.ts    GET, PATCH, DELETE (DELETE → 409 if
                                        the account still has transactions)
- src/app/api/transactions/route.ts     GET (?accountId=), POST
- src/app/api/transactions/[id]/route.ts GET, PATCH, DELETE
Mirror the projects/tasks handlers exactly: safeParse bodies, parseId for the
[id] segment, defer to errorResponse. Confirm the Sprint 1 proxy already
protects /api/accounts and /api/transactions (everything except /unlock,
/api/auth/*, /api/health).

## Task 7: A service-layer smoke script

scripts/finance-smoke.ts (tsx), against the DEV DB, exercising the SERVICE
layer (not HTTP). Mirror scripts/productivity-smoke.ts (the dev-DB guard, the
.env load, the assert helper, best-effort cleanup in finally). It must:
- Create 2 accounts: an asset (e.g. Checking, balance 6000) and a liability
  (e.g. Rewards Card, balance 1200, isLiability true).
- ASSERT getNetWorth() = { assets: 6000, liabilities: 1200, net: 4800 }.
- Create signed transactions this month: a +payroll, a −grocery, a −utility.
- ASSERT getCashFlow('month') income/spend/net match, and that account
  BALANCES are UNCHANGED (transactions do not drive balances).
- ASSERT getSpendByCategory returns the outflow categories sorted desc.
- ASSERT deleteAccount() on an account WITH transactions throws ConflictError;
  then delete its transactions and confirm the account can now be deleted.
- Clean up everything it created.
Add "finance:smoke": "tsx --conditions=react-server scripts/finance-smoke.ts".
GUARD it: refuse to run unless DATABASE_URL contains "5433" or "coop_dev".

## Task 8: Run + show me

- pnpm finance:smoke (dev) — show output + the asserted net worth / cash flow
  / delete-guard results.
- Show accounts.ts, transactions.ts, reporting.ts, and one Route Handler.

Do NOT build any UI this session.
Do NOT use Server Actions — Route Handlers only.
Do NOT let any transaction mutate an Account.balance (no double-entry).
Do NOT write source: CSV_IMPORT — MANUAL only this sprint.
Do NOT point any script at prod (enforce the 5433/coop_dev guard).
Do NOT add or alter any Prisma model — the schema is complete.
Do NOT cascade account deletion — guard it (409 when it has transactions).
```

### What to Verify

- [ ] `pnpm finance:smoke` (dev) passes and prints the asserted net worth, cash flow, and delete-guard results
- [ ] `getNetWorth()` computes from **balances** (assets − liabilities); creating transactions does **not** change any balance
- [ ] `getCashFlow` / `getSpendByCategory` / `getNetWorthSeries` derive from transactions in the selected period and are Decimal-safe (no float drift on sums)
- [ ] `createTransaction` requires a valid `accountId` (a missing/bad one → 400) and always writes `source: MANUAL`
- [ ] `deleteAccount` on an account **with** transactions throws → the route returns **409**; an empty account deletes cleanly
- [ ] Invalid POST bodies return 400 with a readable zod error; `/api/accounts` and `/api/transactions` require a session
- [ ] The smoke script refuses any non-dev `DATABASE_URL`
- [ ] **No migration created**; `prisma migrate status` still up-to-date

Commit:
```bash
git add -A
git commit -m "feat(sprint-3): finance data layer — accounts/transactions services, derivations, route handlers"
```

---

## Session #2: The Finance Surface — Styling Port, View Projection, Tabbed Shell + Ledger

### What You're Building

The `/finance` route stops being a MODULE STANDBY. This session ports the finance styling into the design system, builds the Option B `view.ts` projection, and ships the **tabbed shell** (REPORTING · LEDGER · BUDGETING) with the **Ledger** tab fully functional — manual account and transaction CRUD. Reporting's pane is scaffolded here and filled in Session #3; Budgeting is a static standby pane. It is built to `design-reference/finance.{css,js}`, styled in Midnight & Gilt, **static** (no motion — that's Sprint 5).

> **Option B — view projection (not a schema change).** The prototype speaks a leaner model than the Sprint-1 database. `src/components/finance/view.ts` is the single, TOTAL mapping between the two:
> - **direction:** DB `Transaction.amount` is one **signed** `Decimal` (negative = outflow). The prototype's `flow: "in"|"out"` + positive magnitude is a projection — **read**: `amount < 0 → flow "out"`, `magnitude = abs(amount)`; **write**: `flow + magnitude → signed Decimal` (`out → −magnitude`).
> - **liability:** prototype `liability` ↔ Prisma `Account.isLiability`.
> - **type:** prototype lowercase type ↔ `AccountType` enum (uppercased for the mono tag).
> - **source:** the prototype has none; every create sets `source: MANUAL`.
> - **category:** free-text String, uppercased in the UI; round-trips as-is.
> The mapping is total — any value the DB holds still renders and round-trips. Forms surface only the prototype's fields; omitted columns (`createdAt`/`updatedAt`, `source`) take service-set values on create and are preserved via `.partial()` PATCH on edit.

> **Reuse, don't reinvent.** The Ledger reuses the **productivity control primitives verbatim** — the gilded "+" add pill, the edit/delete icon buttons, the filter chips, and the segmented-control create/edit modal (Esc closes, Enter saves, two-click inline delete). If a primitive needs generalizing to be shared, generalize it in place; do not fork a finance copy.

> **Pattern (tech.md):** the page is a Server Component reading the service layer; client components mutate via the Session #1 Route Handlers, then `router.refresh()`. `view.ts` converts flow+magnitude → signed amount on write and back on read. The tab strip's active tab and the transaction filter are genuine local client state — never server data.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (the "Finance module (Sprint 3)" section)
- design-reference/finance.css   (PORT its static styling: .fin-tabs/.fin-tab,
                              .fin-grid, .facct-*/.ftx-* ledger rows, the
                              modal extensions, the budgeting standby. IGNORE
                              any animation; motion is Sprint 5.)
- design-reference/finance.js    (mine the INTERACTION shape: tab roving
                              tabindex + arrows/Home/End, the account filter
                              chips, the two-click delete, the modal fields &
                              the CREDIT/LOAN→liability default. Its
                              localStorage/seed is NOT copied.)
- src/styles/globals.css     (where finance tokens/classes are ported)
- src/lib/finance/accounts.ts, transactions.ts
- src/components/productivity/{segmented,prod-modal,delete-button,filter-chips}.tsx
- src/components/productivity/{view,format,options}.ts   (mirror the shape)
- src/app/(app)/finance/page.tsx   (currently Standby — replace)

## Task 1: Port finance.css into globals.css

Add the finance surface classes to src/styles/globals.css, mapping the
prototype's raw values to the EXISTING Midnight & Gilt CSS vars and --font-*
families (mono for tags/amounts/meta, Sora for names/figures). Strip every
animation (the tabs/rows are static; hover transitions on border/background
are fine — they're CSS state, not motion). NO hardcoded hex — a colour you
"need" is a design.md token. Confirm the finance colour semantics: good =
inflow / on-track, alert = outflow / liability / negative net, warn = caution.

## Task 2: The view projection — src/components/finance/view.ts

The single, TOTAL mapping (Option B). Export:
- toFlow(amount): amount < 0 ? 'out' : 'in'; magnitude(amount): abs(amount).
- toSignedAmount(flow, magnitude): out → −magnitude, in → +magnitude
  (return Prisma.Decimal or a number the service coerces — keep it exact).
- accountTypeLabel(type): AccountType → uppercased mono tag; and the reverse
  option list (lowercase labels for the segmented control), mirroring the
  prototype's TYPES.
- isLiability passthrough + a helper for the CREDIT/LOAN → liability default.
- normalizeCategory(s): trim + uppercase.
Plus src/components/finance/format.ts (money(Decimal, dec) and fmtDate(iso),
mirroring the prototype's money()/fmtDate) and options.ts (the type list,
period labels). Pills show the REAL enum label; only colour is a tier.

## Task 3: Finance page + tabbed shell

- src/app/(app)/finance/page.tsx (Server Component, replaces Standby): async;
  reads accounts + transactions (and, from Session #3, the reporting figures)
  via the service layer; reads ?period from searchParams for Reporting.
  Renders <FinanceSurface> passing the server-rendered panes as props/children.
  `export const dynamic = 'force-dynamic'`.
- src/components/finance/finance-surface.tsx ("use client"): owns the active
  tab (useState, default LEDGER for now — Reporting once it's built in #3) and
  renders the .fin-tabs strip + the three panes (toggle `hidden`). The strip
  is keyboard-reachable: roving tabindex, ArrowLeft/Right/Up/Down + Home/End,
  aria-selected + aria-controls (mirror finance.js setTab). Panes are
  server-rendered content received as props, so switching tabs is pure
  show/hide (no refetch).
- src/components/finance/budget-standby.tsx: the static MODULE STANDBY pane
  (targets/envelopes deferred — "a later sprint"). No animation.

## Task 4: Ledger — accounts panel

src/components/finance/ledger.tsx composes the two Ledger <Panel>s in .fin-grid
(accounts span 5, transactions span 7).
- accounts-panel.tsx + account-card.tsx ("use client"): each account as a
  .facct-row card — name (Sora), type tag (mono, from accountTypeLabel), a
  LIABILITY tag when isLiability, the balance (mono; liability tinted alert),
  and edit/delete in .row-actions. A gilded "+" add pill opens the account
  modal. Empty state: "No accounts yet — every balance here is entered by
  hand." Delete uses the two-click inline confirm; if the API returns 409
  (account still has transactions), surface a calm message ("Reassign or
  delete this account's transactions first") instead of deleting.
- account-form.tsx (in the shared modal): fields name / type (segmented, wrap)
  / balance (manual) / role (asset|liability segmented). Choosing CREDIT or
  LOAN defaults role to liability (mirror finance.js). POST/PATCH →
  router.refresh().

## Task 5: Ledger — transactions panel

- transactions-panel.tsx ("use client"): a .fin-tx-panel with an account
  filter-chip row (ALL + one chip per account, each with a live count; reuse
  the productivity filter-chips), amount-tinted rows (inflow → good/"+",
  outflow → alert/"−", via view.ts), a category chip + account name in the
  meta, a two-click inline delete, and a latest-30 cap ("SHOWING LATEST 30 OF
  N — FILTER BY ACCOUNT TO NARROW"). A C.O.O.P.-voice foot note reads the
  newest entry date ("Ledger current through MON D. Balances here are manual…").
  There is NO "UNLINKED" chip — transactions always have an account.
- tx-row.tsx + tx-form.tsx: the transaction modal fields — account (a required
  <select>; if there are NO accounts, the modal shows "add an account first"
  and locks, mirroring the prototype), direction (segmented out|in), amount
  (magnitude, positive), category (free-text, uppercased, with a datalist of
  existing categories), description, date (defaults today). On save, view.ts
  folds direction+magnitude into the signed amount → POST/PATCH → router.refresh().

## Task 6: Rail wiring

Confirm the rail's FINANCE item routes to /finance and shows the active gold
treatment (it should, from Sprint 2). The standby is gone; the tabbed surface
loads.

## Task 7: Verify (dev) + show me

Add an asset account and a liability account → add transactions (an inflow and
several outflows across categories) → confirm rows are amount-tinted, the
filter chips narrow by account with live counts, the latest-30 cap note shows
past 30 → edit an account and a transaction (omitted fields preserved) →
two-click delete a transaction → try to delete an account WITH transactions
and confirm it's blocked (409 surfaced calmly) → delete its transactions, then
the account. Confirm balances never changed from transaction activity. Show
view.ts, finance-surface.tsx, transactions-panel.tsx.

Do NOT build the Reporting pane's contents this session (Session #3) — scaffold
  the tab only.
Do NOT add a budgeting model or CRUD — Budgeting is a static standby pane.
Do NOT carry the prototype's "UNLINKED" transaction state — accounts required.
Do NOT cascade account deletion — respect the 409 guard from Session #1.
Do NOT let a transaction change a balance.
Do NOT introduce Server Actions — mutate via Route Handlers.
Do NOT add motion; the prototype's transitions/fades are Sprint 5.
Do NOT hardcode colours — port to design.md tokens.
```

### What to Verify

- [ ] `/finance` renders the tabbed surface (REPORTING · LEDGER · BUDGETING); the strip is fully keyboard-operable (arrows/Home/End, `aria-selected`, `aria-controls`) and shows one pane at a time
- [ ] Ledger: create / edit / delete accounts and transactions entirely from the UI; transaction rows are amount-tinted (inflow good `+`, outflow alert `−`)
- [ ] A transaction **always** requires an account; with zero accounts the New Transaction modal prompts to add one first
- [ ] Direction + magnitude round-trips through the single signed `amount` (an outflow reads back as `−`, edits preserve sign)
- [ ] The account filter chips narrow the list with live counts; the latest-30 cap note appears past 30; C.O.O.P.'s foot note reflects the newest entry
- [ ] Deleting an account **with** transactions is blocked (the 409 is surfaced calmly); an empty account deletes via two-click confirm
- [ ] Editing preserves omitted columns (`source`, timestamps); a CRITICAL-style value the DB holds still renders (projection is total)
- [ ] Balances never change from transaction activity; Budgeting shows a static standby pane
- [ ] `pnpm build` passes; no `framer-motion`; no Server Actions; no schema migration; no hardcoded hex

Commit:
```bash
git add -A
git commit -m "feat(sprint-3): finance surface — css port, view projection, tabbed shell + ledger CRUD"
```

---

## Session #3: The Finance Surface — Reporting (read-only telemetry)

### What You're Building

The **Reporting** tab — the read-only instrument panel. Everything here is *derived* from the service layer (Session #1) and rendered in Server Components; there are no mutations. It's a 12-column grid: a net-worth hero with a period selector and a computed sparkline, a cash-flow panel, an assets-vs-liabilities account rollup with a NET POSITION line, a spend-by-category bar list, and a full-width recent-transactions list. This is where "how am I doing" gets answered at a glance.

> **Reads stay in RSC.** The period (THIS MONTH / QUARTER / YTD) is a **URL search param** (`?period=`), read server-side by `page.tsx`, so all derivations run in the service layer — no client-side finance math. The period chips are a small client component that updates the param via `router.replace`; the active tab (client `useState` from Session #2) is preserved across that soft navigation. No transaction sums happen in the browser.

> **Honesty about the sparkline.** We do not store balance history — only current balances and a transaction ledger. The sparkline is a *cash-flow trajectory* across the period (a cumulative running total anchored so its last point equals current net worth), matching the prototype. It is an honest derivation from available data, not fabricated history. Say so in a comment; don't dress it up as something it isn't.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (Reporting layout + spans + finance colour semantics)
- design-reference/finance.css   (.fin-hero/.fin-cash/.fin-acct-report/.fin-cats/
                              .fin-recent, .flow-*, .fcat-*, .frep-*, spark)
- design-reference/finance.js    (mine renderReporting/renderSpark math: net
                              worth, income/spend/net, spend-by-category top 6,
                              the running spark series, the AS OF line)
- src/lib/finance/reporting.ts, period.ts   (the derivations — reuse, don't
                              recompute in the component)
- src/components/finance/{view,format}.ts
- src/app/(app)/finance/page.tsx, finance-surface.tsx   (from Session #2)

## Task 1: Wire the period param

page.tsx reads ?period (month|quarter|ytd; default month), calls the
reporting service for that period, and passes the figures into the Reporting
pane. src/components/finance/period-chips.tsx ("use client"): the THIS MONTH /
QUARTER / YTD chips (reuse the productivity chip styling), updating ?period via
router.replace (keeps the current tab). Default FinanceSurface's active tab to
REPORTING now.

## Task 2: Net-worth hero (span 7) + sparkline

reporting/net-worth-hero.tsx (Server Component): panel-head "NET WORTH", the
big gold-gradient figure (Sora-200) from getNetWorth().net, an AS OF line
(mono: date · N accounts), a delta line (period net, good/alert toned:
"▲ +$X · THIS MONTH" / "▼ −$X"), the <PeriodChips>, and <Sparkline> from
getNetWorthSeries(period). sparkline.tsx: a static SVG polyline + fill
(gold gradient), dot tinted good/alert by period net — mirror the prototype's
renderSpark geometry, no animation. Empty: "No accounts on ledger" / "No
activity · <period>".

## Task 3: Cash-flow panel (span 5)

reporting/cash-flow.tsx (Server Component) from getCashFlow(period): INCOME
(good) and SPEND (alert) figures, a two-segment flow bar (fb-in good / fb-out
alert, widths from the income/spend split), and a NET · <period> line (toned).
Empty: "No activity yet — the ledger is quiet."

## Task 4: Assets-vs-liabilities rollup (span 7)

reporting/acct-rollup.tsx (Server Component): the ASSETS then LIABILITIES
sub-lists (.frep-row: name, type tag, balance; liabilities tinted alert),
"NONE RECORDED" per empty group, and a NET POSITION line (assets − liabilities,
toned good/alert). Meta: "ASSETS $X · LIABILITIES $Y". Reads getNetWorth()
+ listAccounts().

## Task 5: Spend-by-category (span 5) + recent transactions (span 12)

- reporting/spend-by-category.tsx (Server Component) from
  getSpendByCategory(period, 6): a .fcat-list of category name + gold-gradient
  track/fill (width ∝ largest) + amount. Meta: "N CATEGORIES · <period>".
  Empty: "No spend recorded."
- reporting/recent-tx.tsx (Server Component) from getRecentTransactions(8):
  the read-only .ftx-list (amount-tinted, category chip, account name) — reuse
  the Ledger row rendering WITHOUT the action buttons. Empty: "No transactions
  yet — record your first entry in the LEDGER tab."

## Task 6: Assemble + verify (dev)

With seed/hand-entered data: switch to REPORTING → net worth matches
assets − liabilities → change the period chips and watch cash flow,
spend-by-category, and the sparkline re-derive server-side (the tab stays on
Reporting) → assets/liabilities rollup and NET POSITION reconcile with the
Ledger → recent transactions match the latest entries. Confirm NO finance math
runs client-side (it's all server-derived). pnpm build passes. Show
net-worth-hero.tsx and one derived panel.

Do NOT recompute net worth / cash flow / categories in the component — call
  the reporting service.
Do NOT add mutations to Reporting — it is read-only telemetry.
Do NOT fabricate balance history — the sparkline is a derived trajectory,
  documented as such.
Do NOT add motion (the sparkline and bars are static).
Do NOT add budgeting figures — no budget model exists.
```

### What to Verify

- [ ] Reporting shows net worth = assets − liabilities, an AS OF line, and a period-toned delta
- [ ] The period chips (`?period=`) re-derive cash flow, spend-by-category, and the sparkline **server-side**; the active tab stays on Reporting across the change
- [ ] Cash flow shows income (good) vs spend (alert) with a proportional bar and a toned NET line
- [ ] The assets/liabilities rollup and NET POSITION reconcile exactly with the Ledger's accounts
- [ ] Spend-by-category shows the top 6 outflow categories for the period; recent transactions match the latest entries (read-only, no action buttons)
- [ ] Every Reporting sub-panel has an honest empty state (no accounts / no activity this period)
- [ ] No finance arithmetic runs in the browser; `pnpm build` passes; nothing animates

Commit:
```bash
git add -A
git commit -m "feat(sprint-3): finance reporting — net worth, cash flow, spend, sparkline, rollup"
```

---

## Session #4: The Dashboard Finance · Stewardship Panel — Real Data

### What You're Building

The dashboard hero stops faking it. The Sprint 2 `finance-placeholder.tsx` is replaced with a real **Finance · Stewardship** panel that reads the same `src/lib/finance/` service layer — real net worth from real balances, a real sparkline, real account chips, real recent spend. It keeps its hero-weight, floor-left position and its gilded treatment; only the numbers become real.

> **Scope discipline — show only what exists.** The Sprint 2 placeholder invented an "ON TRACK" budget chip and an "UPCOMING BILLS · NEXT 7 DAYS" line. There is **no budget model and no bills model** (both deferred), so the real panel must **not** claim them. Replace them with honest, available readouts: net worth, this-period **net cash flow** (income − spend, toned good/alert — this is a cash-flow signal, not a budget verdict), account chips (top accounts by balance), and recent spend for the period. Removing a fake affordance is the right call — never wire a real panel to a status it can't actually compute.

> **Same read pattern as every other panel.** This is an async Server Component reading the service layer directly (like Priorities/Scripture/Calendar in Sprint 2). No client fetch, no duplicated math — reuse `getNetWorth`, `getCashFlow`, `getNetWorthSeries`, `getRecentTransactions`, `listAccounts`.

### Prompt

```
Read these files:
- .kiro/steering/design.md   (dashboard Finance panel note: re-point at
                              src/lib/finance/; hero-weight; indigo ai-note voice)
- src/components/panels/finance-placeholder.tsx   (the panel to REPLACE — keep
                              its layout/hero treatment, swap fake → real)
- src/components/panels/priorities-panel.tsx      (the live-panel pattern)
- src/lib/finance/reporting.ts, accounts.ts
- src/components/finance/{view,format}.ts

## Task 1: Real Finance panel

Create src/components/panels/finance-panel.tsx (async Server Component),
replacing finance-placeholder.tsx in the dashboard grid (floor-left,
hero-weight, 7-wide). Reads the finance service layer:
- panel-head "FINANCE · STEWARDSHIP" (drop the "AWAITING SPRINT 3" meta).
- the big gold-gradient net-worth figure from getNetWorth().net.
- a this-month cash-flow delta line (income − spend, toned good/alert) —
  label it as cash flow, NOT a budget status.
- a real sparkline (getNetWorthSeries('month')) — reuse the Reporting
  <Sparkline>.
- account chips: the top few accounts by balance (name + balance; liability
  tinted alert), from listAccounts().
- a recent-spend line for the period (Σ outflows) — real, replacing the fake
  "recent spend" + the removed "upcoming bills" line.
- an <AiNote> with STATIC placeholder copy in indigo (e.g. "C.O.O.P.'s read on
  your stewardship arrives in Sprint 4.") and a mono link "OPEN FINANCE →" to
  /finance.

## Task 2: Empty / first-run state

With zero accounts, the panel reads intentionally: net worth "$0" or a clean
"No accounts yet" with a "Set up in FINANCE →" link — never blank, never a
crash, never fabricated numbers.

## Task 3: Swap + tidy

Point the dashboard grid at <FinancePanel>; remove finance-placeholder.tsx (or
leave it only if something else references it — it shouldn't). Confirm the
other three panels are untouched.

## Task 4: Verify (dev) + show me

Seed/enter accounts + transactions → the dashboard hero shows real net worth,
a real sparkline, real account chips, and this-period cash flow → complete a
Ledger edit and confirm the dashboard reflects it after refresh → empty the dev
DB and confirm the honest empty state. Show finance-panel.tsx.

Do NOT show a budget chip or upcoming-bills line — no such models exist.
Do NOT make the ai-note call AI (Sprint 4) — static indigo copy only.
Do NOT duplicate finance math in the panel — call the reporting service.
Do NOT add motion.
```

### What to Verify

- [ ] The dashboard Finance hero shows **real** net worth, sparkline, account chips, and this-period cash flow from `src/lib/finance/`
- [ ] No budget "ON TRACK" chip and no "upcoming bills" line (those models don't exist — the panel shows only what it can compute)
- [ ] Editing accounts/transactions in `/finance` is reflected on the dashboard after `router.refresh()`
- [ ] The `ai-note` shows static indigo copy and makes **no** AI call; "OPEN FINANCE →" links to the module
- [ ] Empty state is honest (no accounts → a clean prompt, never blank or fabricated); the other three panels are unchanged
- [ ] `finance-placeholder.tsx` is removed; `pnpm build` passes

Commit:
```bash
git add -A
git commit -m "feat(sprint-3): dashboard finance panel — real net worth, sparkline, accounts, cash flow"
```

---

## Session #5: Dev Seed Extension + Daily-Use Hardening

### What You're Building

A finance seed so Reporting has realistic content to build and demo against, plus the unglamorous robustness that separates "demo" from "I keep my money here": honest empty states, loading/error boundaries for `/finance`, a mobile pass, and a re-run of the finance smoke. Nothing here touches prod.

> **Safety:** the seed writes data. It must refuse to run against anything but the dev database — same discipline as the Sprint 1 and productivity smoke scripts. The seed is for **dev only**; production's finance data is real and hand-entered (Session #6).

### Prompt

```
Read these files:
- scripts/seed-dev.ts   (extend it — do not fork a second seed)
- src/lib/finance/accounts.ts, transactions.ts
- prisma/schema.prisma   (Account, Transaction fields)
- design-reference/finance.js   (mine the realistic household shape: a few
                              accounts + a monthly spread of categorised tx)

## Task 1: Extend the dev seed

Extend scripts/seed-dev.ts (keep the existing 5433/coop_dev guard and --reset)
to also insert a realistic single household:
- 4 accounts with MANUAL balances: an Everyday Checking + High-Yield Savings +
  Brokerage (assets) and a Rewards Card (isLiability true).
- A spread of ~40–70 transactions across the last few months (SIGNED amounts;
  a monthly payroll inflow; rent, groceries, utilities, dining, transport,
  subscriptions, the occasional dividend inflow) with real categories and
  dates ≤ today, so month/quarter/YTD periods, the sparkline, and
  spend-by-category all render. source: MANUAL. Every transaction has an
  accountId (no orphans).
- --reset wipes the seeded finance rows too (idempotent-ish).
Balances are set directly on the accounts (NOT computed from the transactions
— manual, per the product rule).

## Task 2: Loading + error states

Add loading.tsx and error.tsx for /finance (calm gilded-glass placeholder
blocks + a quiet error panel), mirroring the productivity ones. STATIC (no
shimmer animation). Confirm each Reporting/Ledger sub-view has its empty state
(no accounts, no activity this period, nothing in this filter).

## Task 3: Mobile pass (dev)

At ≤760px: the .fin-tabs strip goes full-width (equal tabs); the .fin-grid
collapses to single column (hero, cash, rollup, categories, recent stacked);
the Ledger panels stack; the account/transaction modals are tappable and don't
overflow; the filter chips wrap. Fix breakage. (Real phone-over-Tailscale
testing is Session #6, against prod.)

## Task 4: Re-run the smoke + tidy

pnpm finance:smoke (dev) still green. pnpm lint && pnpm build; fix warnings.

## Task 5: Show me

- pnpm db:seed:reset → describe the populated /finance (net worth, a few
  months of cash flow, categories, a sparkline) and the dashboard hero.
- Confirm the seed guard blocks a non-dev DATABASE_URL.

Do NOT seed or write to production — the 5433/coop_dev guard is mandatory.
Do NOT compute seeded balances from the seeded transactions (manual balances).
Do NOT add animated skeletons (static only; motion is Sprint 5).
Do NOT add new features — seed + robustness only.
```

### What to Verify

- [ ] `pnpm db:seed:reset` populates the dev DB; `/finance` comes alive (real net worth, multi-month cash flow, categories, a sparkline) and the dashboard hero reflects it
- [ ] Seeded account balances are **set directly**, not derived from the seeded transactions
- [ ] The seed script **refuses** a non-dev `DATABASE_URL`
- [ ] `/finance` has `loading.tsx` / `error.tsx`; every Reporting/Ledger view has an honest empty state; nothing blank or crashing on no data
- [ ] Mobile layout holds at ≤760px (full-width tabs, single-column grid, usable modals + chips)
- [ ] `pnpm finance:smoke` green; `pnpm lint && pnpm build` clean

Commit:
```bash
git add -A
git commit -m "chore(sprint-3): finance dev seed + empty/loading/error states + mobile hardening"
```

---

## Session #6: E2E Smoke Test, Promote to Production, Sprint 3 Sign-Off

### What You're Building

Confirmation that the whole finance surface works together, then the deliberate **promotion to production** — because this is the sprint where you start entering real financial records you intend to keep. Mirror the Sprint 1 and Sprint 2 rigor: checklist, verify against the running system, promote, capture a baseline, tag.

> **This is the "real money data starts now" gate.** Before promoting, confirm the nightly prod `pg_dump` is still landing in iCloud. The first real balance you type into prod is protected only if that net is live. And note: `prisma migrate deploy` is a **no-op** this sprint — there is no Sprint 3 migration, because the schema was complete in Sprint 1. Confirm it reports nothing to apply rather than assuming it.

### Prompt

```
Read these files:
- README.md
- docs/operating-model.md
- docs/restore.md
- scripts/deploy.sh
- docs/sprint-2-baseline.md

## Task 1: Generate docs/sprint-3-checklist.md

Consolidate every verification step from Sessions #1–#5 into one runnable
checklist, grouped by: Data layer (services/derivations/guard) · Finance
surface (tabs + Ledger CRUD) · Reporting (telemetry) · Dashboard finance panel
· Seed, empty/error, mobile · Build & lint. For each item, the exact command /
URL / interaction. Mark dev-only vs. must-also-pass-on-prod.

## Task 2: Verify against the running DEV system

Run every checklist item against dev (3001, seeded dev DB). Report PASS/FAIL.
For any FAIL: stop, report, do not auto-fix — diagnose together.

## Task 3: Pre-promotion safety checks

Confirm + report:
- prisma migrate status up-to-date; Sprint 3 added NO new migrations.
- The Sprint 1 nightly backup launchd job is still installed; the last prod
  backup file is recent (ls the iCloud backup dir).
- docker/.env (prod) points at the prod db, NOT the dev DB.
- Run a fresh pre-promotion prod snapshot (deploy.sh's backup step or
  `docker compose --profile backup run --rm backup`).

## Task 4: Promote to production

Run scripts/deploy.sh: pull → snapshot prod → build prod image → `prisma
migrate deploy` against prod (a NO-OP this sprint — confirm it reports nothing
to apply) → restart prod → status + logs. Report output.
IMPORTANT: do NOT run the dev seed against prod. Production's finance data
starts EMPTY — only the real accounts/balances/transactions you enter yourself.

## Task 5: Capture docs/sprint-3-baseline.md

- Date/time, git SHA, sprint-3 tag.
- prisma migrate status (dev + prod — both up-to-date, schema UNCHANGED since
  Sprint 1).
- docker compose -f docker/docker-compose.yml ps (prod healthy).
- docker system df (compare vs the Sprint 2 baseline).
- /api/health from the phone over Tailscale (prod, 3000).
- Confirmation the /finance surface (both tabs) + the dashboard finance panel
  work on the phone over Tailscale against PROD.
- Confirmation prod holds only real, hand-entered finance data (no seed).
- Confirmation the nightly prod backup is active + a fresh pre-promotion
  snapshot exists.

## Task 6: Report

Summarize what shipped, what is intentionally still deferred (CSV import →
later, behind a pluggable import-source interface; budgeting model → later;
holdings → later; ai-notes + Ask C.O.O.P. → Sprint 4; motion → Sprint 5), and
anything to watch heading into Sprint 4.

Do NOT start any Sprint 4 work (no embeddings/retrieval/AI).
Do NOT build CSV import or a budgeting model — both are deferred by design.
Do NOT seed production.
Do NOT introduce feature code in this session.
```

### What to Verify

- [ ] Every item in `sprint-3-checklist.md` shows PASS on dev
- [ ] `scripts/deploy.sh` promoted cleanly; `prisma migrate deploy` reported **no** pending migrations (the expected no-op)
- [ ] Production reachable on the phone over Tailscale (port 3000); `/finance` (Reporting + Ledger) and the dashboard finance panel all work there
- [ ] You created at least one **real** account + transaction on the prod app from your phone; the dashboard net worth reflects it
- [ ] `docs/sprint-3-baseline.md` committed with real values; schema confirmed unchanged since Sprint 1
- [ ] Nightly prod backup confirmed active; fresh pre-promotion snapshot exists
- [ ] Production contains only your real finance data — the dev seed never touched it

Commit:
```bash
git add -A
git commit -m "chore(sprint-3): e2e smoke test, prod promotion, baseline captured"
git tag sprint-3-complete
git push origin main --tags
```

---

## What "Done" Looks Like for Sprint 3

✅ **Finance data layer over the locked schema**: `server-only` services (`accounts.ts`, `transactions.ts`, `reporting.ts`, `period.ts`) over the Sprint-1 `Account` + `Transaction` models, zod-validated Route Handlers (no Server Actions), and derivations — net worth, cash flow, spend-by-category, sparkline series — computed **one way** in the service layer. Decimal-safe. No migration.

✅ **The Option B projection**: `src/components/finance/view.ts` is the single, TOTAL mapping — signed `amount` ↔ `flow` + magnitude, `isLiability` ↔ `liability`, `AccountType` ↔ lowercase type, `source: MANUAL` on every create, uppercased free-text `category`. The prototype's leaner model rides on the full schema; nothing was migrated down.

✅ **The tabbed `/finance` surface**: a keyboard-reachable segmented tab strip (**REPORTING · LEDGER · BUDGETING**). **Ledger** is live — manual account + transaction CRUD, an account filter-chip row, amount-tinted rows, a two-click inline delete, a latest-30 cap, and C.O.O.P.'s foot note. **Reporting** is live — net-worth hero + period selector + sparkline, cash flow, assets-vs-liabilities rollup with NET POSITION, spend-by-category, recent transactions. **Budgeting** is a static standby pane.

✅ **Two schema-truth rules held**: transactions **always** require an account (no "UNLINKED"), and account deletion is **guarded** (409 when the account still has transactions — real financial records are never silently cascaded).

✅ **Manual, no double-entry**: balances are hand-kept; net worth = assets − liabilities; transactions are a record that drives cash-flow / spend / the sparkline and **never** recompute a balance.

✅ **Dashboard Finance · Stewardship panel wired to real data**: the Sprint 2 placeholder replaced with a real hero reading the same `src/lib/finance/` layer — real net worth, sparkline, account chips, and this-period cash flow. No fabricated budget chip or bills line (those models don't exist yet). `ai-note` stays static indigo (Sprint 4).

✅ **Daily-usable**: dev seed (dev-DB-guarded) with a realistic household, honest empty/loading/error states, mobile pass, a green `finance:smoke`. **Promoted to production** and verified on the phone over Tailscale, holding only real hand-entered finance data.

✅ **Boundaries held**: no migration, no CSV, no budgeting model, no holdings, no double-entry, no AI calls, no motion, no new runtime deps. `docs/sprint-3-baseline.md` committed; `sprint-3-complete` tagged and pushed.

---

## Session Summary

| Session | Focus | Approx Time |
|---------|-------|-------------|
| #1 | **Finance data layer (services, derivations, zod, route handlers, delete guard)** | 60–80 min |
| #2 | **Finance surface (css port, view.ts, tabbed shell + Ledger CRUD)** | 75–95 min |
| #3 | Reporting (net worth, cash flow, spend, sparkline, rollup) | 60–80 min |
| #4 | Dashboard finance panel wired to real data | 40–55 min |
| #5 | Dev seed + empty/error states + mobile hardening | 40–55 min |
| #6 | E2E smoke test + **prod promotion** + baseline | 30–45 min |
| **Total** | | **~5–7 hours** |

The two sessions most worth slowing down on are **#1 and #2** — the service layer (where the manual-balances / no-double-entry rule and the delete guard actually live) and `view.ts` (the signed-amount projection that keeps the prototype's model riding cleanly on the schema). The session most worth not rushing is **#6** — promotion is when real, irreplaceable financial records start accumulating, so confirm the backup net before the first real balance.

---

## Heading Into Sprint 4

When `sprint-3-complete` is tagged and you've kept real balances and a real ledger in prod from your phone for a few days, Sprint 4 picks up by:
- Building the **AI layer** — embeddings + retrieval (pgvector, already in the schema) behind the provider-agnostic `lib/ai/` interface (Gemini Flash default) — and making the stubbed **"Ask C.O.O.P."** path answer for real in the indigo response toast
- Filling the **`ai-note` annotations** across the panels — including Finance's — with real reasoning ("your spend is up in dining this month", "net worth is drifting with the market") drawn from the finance service layer and the wider unified model
- Reusing exactly the patterns proven so far — the service + Route-Handler shape, the gilded primitives, the panel and `ai-note` conventions — so intelligence is additive, not novel
- Leaving **CSV import** (behind the pluggable import-source interface), a **budgeting model** (targets/envelopes), and **holdings** for later finance sprints, and the **motion layer** (the prototype's ambient drift, particles, breathing, entrance animations, typewriter) for Sprint 5

Do not start Sprint 4 until C.O.O.P. has survived real daily use as a stewardship tool — the whole premise is that each sprint ships something you actually rely on before the next begins.
