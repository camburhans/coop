# C.O.O.P. — Kiro Implementation Guide: Sprint 1
## Foundation: Repo, Containers, Database, Schema, Auth, Remote Access, Backups

---

## Overview

Sprint 1 builds the entire foundation C.O.O.P. will stand on for years. No features. No dashboard. No AI. The goal is a secure, recoverable, locally-deployed application skeleton with the full unified data model in place and remote phone access working.

If Sprint 1 is done well, every later sprint becomes additive. If it's done sloppily, every later sprint pays a tax.

**What you're building:**
- A Next.js 15 (App Router) + TypeScript repo, linted and formatted
- A **two-environment setup on a single machine** (the Mac mini is both dev and prod): production app + production Postgres in Docker, plus a separate development Postgres — so dev work never touches real data
- A Docker Compose stack: prod app + prod Postgres (with `pgvector`) + a dev Postgres + nightly backup job
- The complete Prisma schema for every entity in the architecture (Projects, Tasks, Accounts, Transactions, Notes, CalendarEvents, Reminders, Verses, Links, Embeddings)
- A single-passcode app auth layer (httpOnly cookie session)
- Tailscale-based phone access to the production app
- Automated nightly `pg_dump` of the **production** database to iCloud Drive, plus Time Machine + Git as the other two backup layers, plus an on-demand `db:snapshot` before migrations
- A `/health` route and a minimal authenticated landing page proving the whole stack is alive end-to-end

**What this sprint does NOT include:**
- The dashboard UI (Sprint 2)
- Any productivity/finance/AI features (Sprints 2–4)
- Visual polish, particles, glass styling (Sprint 5)
- Multi-user anything — this is single-user forever in V1
- Plaid, Google Calendar, Apple Health, or any external integrations

This sprint is mostly infrastructure and schema. Most sessions are short but ordering matters — do not skip ahead.

---

## Prerequisites

- [ ] Architecture doc (`COOP-Architecture.md`) committed to repo root, read once end-to-end (note §6: single-host dev+prod, two environments)
- [ ] Mockup HTML saved somewhere referenceable (not in repo — design reference only)
- [ ] Mac mini set up and on the local network — this is the one machine where you both develop and run production
- [ ] Tailscale account created (free tier is fine for one user)
- [ ] Node 20+ installed on the Mac mini
- [ ] Docker Desktop installed on the Mac mini (set to start at login)
- [ ] GitHub account with a private repo created (empty) for C.O.O.P.
- [ ] An AI API key obtained but **not yet used** (Gemini Flash recommended per architecture §5; sits unused until Sprint 4)
- [ ] iCloud Drive enabled on the Mac mini (production backups land here)
- [ ] A strong passcode chosen for the app (stored in a password manager, not your head)

> **Single-host reminder:** You develop and serve production on the same Mac mini. The entire point of the two-environment setup below is that your dev work runs against a *separate, disposable* database (port 5433) while production runs untouched (port 3000, internal-only DB). Different ports, different databases, different env files — same machine.

> **Storage note:** Keep Docker (images + volumes) on the Mac mini's **internal SSD** for now. C.O.O.P.'s own footprint is small (~5–10GB initially), but Docker's image/build-cache churn grows over time — run `docker system prune` every few weeks to keep your ~80–90GB of free space healthy. The 2TB external media drive is **ExFAT** and must **not** hold the database volume — ExFAT lacks the locking/permissions Postgres needs and risks corruption. If disk pressure ever appears, the fix is a dedicated **APFS** drive left permanently attached, with Docker Desktop's disk image relocated to it (a settings change, no code impact) — deferred until `docker system df` shows real strain.

---

## Steering File Setup

Before any sessions, create the steering files that govern Kiro's behavior across this sprint. These mirror the architecture doc's principles in a form Kiro reads on every prompt.

### Create `.kiro/steering/product.md`

```markdown
---
inclusion: always
---

# C.O.O.P. — Product Context

C.O.O.P. (Cognitive Operations & Optimization Platform) is a private,
single-user life operating system. One owner, one Mac mini, remote phone
access via Tailscale.

**North Star:** Show me what I need to do, show me how the different areas
of my life are looking, and keep me organized.

## Core principles (do not violate)
1. Foundation first — data layer, services, AI layer, THEN cinematic UI.
2. Functional without animation — UI must work with all motion disabled.
3. Calm on the hundredth view — daily-use tool, not a showpiece.
4. Local-first, private by default.
5. One unified data model — every domain connects via a generic Link table.
6. Tight V1 scope — no Plaid, no Google Calendar, no native mobile, no
   heavy 3D, no agentic automation in V1.
7. Swap-ability over lock-in — external dependencies (especially AI)
   sit behind clean interfaces.

## V1 sprint plan
- Sprint 1 (current): Foundation — repo, Docker, Postgres+pgvector,
  full Prisma schema, auth, Tailscale, backups.
- Sprint 2: Productivity + dashboard shell.
- Sprint 3: Finance (manual + CSV).
- Sprint 4: AI layer (embeddings, RAG, semantic search).
- Sprint 5: Visual polish (glass aesthetic, particle system, transitions).
```

### Create `.kiro/steering/tech.md`

```markdown
---
inclusion: always
---

# Technology Stack

## Locked choices (do not propose alternatives)
- Framework: Next.js 15 (App Router) + TypeScript (strict mode)
- Styling: Tailwind CSS
- Motion: Framer Motion (Sprint 5+, not Sprint 1)
- Backend: Next.js API routes / Route Handlers — single backend, no FastAPI
- Database: PostgreSQL 16 with the pgvector extension
- ORM: Prisma
- State: Zustand (client-only, Sprint 2+)
- AI: External API (Gemini Flash default) behind a provider-agnostic
  interface in `lib/ai/` — wired in Sprint 4, not Sprint 1
- Containerization: Docker Compose
- Remote access: Tailscale
- Auth (V1): single passcode → httpOnly cookie session

## Explicitly out of V1
- FastAPI / separate backend
- Three.js / R3F / WebGL
- Local LLMs (Ollama)
- Plaid / bank integrations
- Native iOS

## Environments (single host: the Mac mini is dev AND prod)
- Production: dockerized app on port 3000, Postgres on the internal
  docker network (no host port), volume coop_db_data, env file docker/.env.
  Always running (restart: unless-stopped).
- Development: native `pnpm dev` on port 3001, separate dockerized Postgres
  on host port 5433, volume coop_dev_db_data, env file .env. Run only while
  actively coding.
- Dev NEVER touches the production database. This is the hard rule.
- Promotion: develop against dev DB → commit → push → deploy script
  rebuilds prod container and runs `prisma migrate deploy` against prod DB.

## Versions
- Node 20+
- pnpm preferred (npm acceptable)
- Postgres 16 with pgvector extension
```

### Create `.kiro/steering/structure.md`

```markdown
---
inclusion: always
---

# Repo Structure

coop/
├── .kiro/steering/      # this directory
├── docker/
│   ├── docker-compose.yml       # PRODUCTION stack (app + prod db + backup)
│   ├── docker-compose.dev.yml   # DEV database only (separate Postgres)
│   ├── Dockerfile.app
│   ├── .env.production.example  # template for docker/.env (prod, gitignored)
│   └── backup/
│       ├── Dockerfile
│       └── backup.sh
├── prisma/
│   ├── schema.prisma    # full unified data model (Sprint 1)
│   └── migrations/
├── scripts/
│   ├── deploy.sh                # promote prod on this host
│   ├── db-snapshot.sh           # on-demand dump before migrations
│   └── install-backup-job.sh    # launchd nightly prod backup
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # unauthenticated routes (unlock page)
│   │   ├── (app)/       # authenticated routes (dashboard + modules)
│   │   ├── api/
│   │   │   ├── health/
│   │   │   └── auth/
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── auth/        # session + passcode logic
│   │   ├── db/          # Prisma client singleton
│   │   ├── ai/          # provider-agnostic interface (stub in Sprint 1)
│   │   └── env.ts       # validated env loader
│   ├── types/           # shared types
│   └── middleware.ts    # route protection
├── .env                 # DEV env (gitignored) — points at dev DB on 5433
├── .env.example         # template documenting dev env shape
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md

## Environment conventions
- DEV: `.env` → DATABASE_URL points at localhost:5433 (dev Postgres),
  app runs natively via `pnpm dev` on port 3001
- PROD: `docker/.env` → DATABASE_URL points at the db service on the
  internal docker network, app runs in Docker on port 3000
- The two env files must NEVER point at the same database
- All env vars validated via lib/env.ts using zod
- Prisma client imported only via lib/db/client.ts (singleton)
- No secrets in repo — both .env files gitignored, *.example documents shape
- Server-only logic uses 'server-only' import to prevent client leakage
- Route groups: (auth) bypasses middleware, (app) is protected
```

### Create `.kiro/steering/conventions.md`

```markdown
---
inclusion: always
---

# Code Conventions

## TypeScript
- strict: true in tsconfig (noImplicitAny, strictNullChecks, etc.)
- No `any`. No `as unknown as X` escape hatches.
- Prefer types from Prisma client over hand-rolled duplicates.

## Naming
- Files: kebab-case (auth-session.ts, not authSession.ts)
- React components: PascalCase exports from kebab-case files
- DB tables (Prisma model): PascalCase singular (Project, not projects)
- DB columns: snake_case via @map where needed for SQL ergonomics

## Imports
- Absolute imports via `@/*` alias (configured in tsconfig)
- Group: external, then @/lib, then @/components, then relative
- No deep imports across feature boundaries

## Server vs client
- Server Components by default
- "use client" only where needed (interactivity, hooks, browser APIs)
- Server-only modules: `import 'server-only'` at top

## Commits
- Conventional commits: feat:, fix:, chore:, docs:, refactor:
- One logical change per commit
- Reference sprint in message: "feat(sprint-1): ..."
```

---

## Session #1: Repo Bootstrap

### What You're Building

A clean Next.js + TypeScript repo with linting, formatting, env validation, and the directory skeleton from `structure.md`. No features yet. The goal is "fresh repo that builds and lints cleanly."

### Prompt

```
Read these files:
- COOP-Architecture.md (sections 3, 6, 7)
- .kiro/steering/product.md
- .kiro/steering/tech.md
- .kiro/steering/structure.md
- .kiro/steering/conventions.md

## Task 1: Initialize Next.js project

Initialize a new Next.js 15 project in the current directory with:
- TypeScript (strict mode)
- App Router
- Tailwind CSS
- ESLint
- src/ directory
- @/* import alias
- pnpm (or npm — use whichever lockfile already exists; if neither, pnpm)

Do NOT use create-next-app's experimental flags or RSC fetch wrappers
beyond defaults. Keep it boring.

## Task 2: Tighten tsconfig

Ensure tsconfig.json has:
- "strict": true
- "noUncheckedIndexedAccess": true
- "noImplicitOverride": true
- "forceConsistentCasingInFileNames": true

## Task 3: Add Prettier

Install prettier + prettier-plugin-tailwindcss.
Add .prettierrc with:
- singleQuote: true
- semi: true
- trailingComma: "all"
- printWidth: 100
- plugins: ["prettier-plugin-tailwindcss"]

Add a "format" script to package.json: "prettier --write ."

## Task 4: Create directory skeleton

Create these empty directories with .gitkeep where empty:
- src/lib/auth
- src/lib/db
- src/lib/ai
- src/types
- src/app/(auth)
- src/app/(app)
- src/app/api/health
- src/app/api/auth
- docker
- docker/backup
- prisma

## Task 5: Create lib/env.ts

Install zod. Create src/lib/env.ts that validates these env vars
and throws clearly on missing/invalid values:

- DATABASE_URL: string, url
- APP_PASSCODE: string, min 8 chars
- SESSION_SECRET: string, min 32 chars
- AI_API_KEY: string, optional (not used until Sprint 4)
- NODE_ENV: 'development' | 'production' | 'test'

Export a typed `env` object. Use 'server-only' at the top so this never
ships to the client. The same loader serves both environments — which
env file is loaded (.env for dev, docker/.env for prod) determines the
values. The loader does not care which environment it's in.

## Task 6: Create .env.example (DEV template)

Document the shape of all required env vars for the DEVELOPMENT
environment. Critically, DATABASE_URL must point at the dev Postgres:

DATABASE_URL="postgresql://coop:devpassword@localhost:5433/coop_dev"
APP_PASSCODE="dev-passcode-change-me"
SESSION_SECRET="dev-secret-at-least-32-characters-long-xxxxx"
AI_API_KEY=""            # optional in Sprint 1 — leave empty
NODE_ENV="development"

Add a clear comment block at the top:
"This is the DEVELOPMENT env. The dev app runs on port 3001 against the
dev Postgres on port 5433. Production uses docker/.env (created in
Session #5) and must NEVER share a database with dev."

## Task 7: Dev dev-server port

Set the dev server to run on port 3001 so it never collides with the
production container on 3000. Update the package.json dev script:
"dev": "next dev -p 3001"

## Task 8: .gitignore

Ensure .env, .env.local, docker/.env, /backups, .DS_Store, and standard
Next.js artifacts are ignored. BOTH env files must be gitignored.

## Task 9: README.md

Write a brief README with:
- One-paragraph project description (use product.md's North Star)
- A short "Two environments on one machine" note: dev = `pnpm dev` on
  3001 against dev Postgres (5433); prod = Docker on 3000. They never
  share a database.
- Prerequisites (Node 20+, Docker, pnpm)
- Quick start: copy .env.example to .env, fill in, pnpm install, start
  the dev database (Session #2), pnpm dev
- A note that Docker setup arrives in Session #2

## Task 10: Verify

Run:
- pnpm install
- pnpm lint
- pnpm build

Report any errors. The build should succeed even with no real pages
beyond the default Next.js home.

Do NOT add any business logic.
Do NOT touch Prisma yet — that's Session #3.
Do NOT install AI SDKs yet.
```

### What to Verify

- [ ] `pnpm dev` starts and serves the default Next.js page on **port 3001**
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm build` succeeds
- [ ] `src/lib/env.ts` throws a readable error when a required var is missing (test by removing one from `.env`)
- [ ] Both `.env` and `docker/.env` are gitignored (verify with `git status` — neither should appear)
- [ ] No secrets committed

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): repo bootstrap, env validation, structure scaffold"
```

---

## Session #2: Docker — Production Stack + Dev Database

### What You're Building

Two Docker setups on the one machine: a **production** Compose stack (app + Postgres + pgvector, always on) and a separate **development** Postgres (disposable, for `pnpm dev` to point at). The prod Postgres is reachable only on the internal docker network; only the dev Postgres exposes a host port, for your tooling.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 6: Infrastructure & Deployment — note the
  two-environment, single-host model and the port/volume table)
- .kiro/steering/structure.md
- .kiro/steering/tech.md
- .env.example
- package.json
- next.config.ts

## Task 1: Dockerfile.app

Create docker/Dockerfile.app — a multi-stage build for the Next.js app:
- Stage 1 (deps): node:20-alpine, install dependencies via pnpm
- Stage 2 (builder): copy source, pnpm build
- Stage 3 (runner): node:20-alpine, copy .next/standalone + public,
  set NODE_ENV=production, expose 3000, CMD ["node", "server.js"]

Use Next.js standalone output. Update next.config.ts:
output: 'standalone'

## Task 2: PRODUCTION compose — docker/docker-compose.yml

This is the always-on production stack. Note the prod db has NO host
port — only the app (on the internal network) reaches it.

services:
  db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_USER: coop
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: coop
    volumes:
      - coop_db_data:/var/lib/postgresql/data
    # NO host port mapping — prod db is internal-network only.
    # The app reaches it by hostname `db`. This is a security and
    # safety boundary: nothing on the host can accidentally connect
    # dev tooling to the prod database.
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coop"]
      interval: 5s
      timeout: 5s
      retries: 10

  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile.app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://coop:${DB_PASSWORD}@db:5432/coop
      APP_PASSCODE: ${APP_PASSCODE}
      SESSION_SECRET: ${SESSION_SECRET}
      AI_API_KEY: ${AI_API_KEY:-}
      NODE_ENV: production
    ports:
      - "127.0.0.1:3000:3000"   # prod app on 3000, localhost-bound;
                                # Tailscale provides phone access

volumes:
  coop_db_data:

## Task 3: DEVELOPMENT database — docker/docker-compose.dev.yml

A separate, disposable Postgres for development. THIS exposes a host
port (5433) so Prisma Studio and your local `pnpm dev` can reach it.
There is no app service here — dev runs the app natively via pnpm dev.

services:
  dev-db:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_USER: coop
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: coop_dev
    volumes:
      - coop_dev_db_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5433:5432"   # dev db exposed on host port 5433
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U coop"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  coop_dev_db_data:

The dev db password is intentionally a fixed weak value (devpassword) —
it holds only throwaway data, is bound to localhost, and never leaves
the machine. Do not reuse it for prod.

## Task 4: Env additions

Update src/lib/env.ts and .env.example to include DB_PASSWORD
(min 16 chars) — note this is only consumed by the PROD compose file
to build the prod DATABASE_URL. The dev .env uses the fixed dev
connection string pointing at localhost:5433.

## Task 5: Convenience scripts

Add to package.json scripts:
- "dev:db:up": "docker compose -f docker/docker-compose.dev.yml up -d"
- "dev:db:down": "docker compose -f docker/docker-compose.dev.yml down"
- "dev:db:reset": "docker compose -f docker/docker-compose.dev.yml down -v && docker compose -f docker/docker-compose.dev.yml up -d"
- "prod:up": "docker compose -f docker/docker-compose.yml up -d"
- "prod:down": "docker compose -f docker/docker-compose.yml down"
- "prod:logs": "docker compose -f docker/docker-compose.yml logs -f"
- "prod:rebuild": "docker compose -f docker/docker-compose.yml up -d --build"

The dev:db:reset script (down -v drops the volume) is the payoff of
two environments: you can nuke and recreate the dev database any time
with zero risk to prod data.

## Task 6: pgvector extension note

Document in README that the pgvector extension is created via Prisma
migration (Session #3) in BOTH databases. For now just confirm the
image ships the extension binaries.

## Task 7: Smoke test BOTH

Bring up the dev db: `pnpm dev:db:up`. Confirm:
- `docker compose -f docker/docker-compose.dev.yml ps` shows dev-db healthy
- psql into it on 5433 returns SELECT 1

Bring up prod: `pnpm prod:up`. Confirm:
- both prod services healthy
- prod app reachable at http://localhost:3000
- prod db is NOT reachable on any host port (confirm 5432 is not bound —
  `docker compose -f docker/docker-compose.yml ps` shows no host port
  for db). This is intentional.

Report results for both stacks.

Do NOT add Prisma yet.
Do NOT create any database tables manually.
```

### What to Verify

- [ ] `pnpm dev:db:up` brings up the dev Postgres on host port **5433**
- [ ] `pnpm prod:up` brings up prod app (3000) + prod Postgres (internal only)
- [ ] Prod Postgres has **no** host port binding — verify with `docker compose ps` (this is the boundary that prevents dev tooling from reaching prod data)
- [ ] Dev Postgres is reachable on `127.0.0.1:5433`
- [ ] Both healthchecks pass within ~10 seconds
- [ ] `pnpm dev:db:reset` cleanly nukes and recreates the dev DB (try it — it's your safety habit)

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): docker — prod stack + separate dev database"
```

---

## Session #3: Prisma Schema — The Full Unified Data Model

### What You're Building

The complete schema from architecture §4, in one go. Every entity. The `Link` table (the load-bearing piece of the model). The `Embedding` table with a pgvector column. All migrations applied to the running Postgres.

This is the most important session in Sprint 1. The schema is what every other sprint reads from.

> **Environment note:** All schema development in this session runs against the **dev** database (port 5433, via your `.env`). Production gets the schema later via `prisma migrate deploy` during promotion (Session #5). Make sure `pnpm dev:db:up` is running before you start.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 4: The Unified Data Model — read it
  carefully, including the rationale and relationship summary)
- .kiro/steering/tech.md
- .kiro/steering/conventions.md
- src/lib/env.ts

## Task 1: Install Prisma

Install prisma (dev) and @prisma/client (runtime). Initialize Prisma:
- npx prisma init --datasource-provider postgresql
- Set datasource url to env("DATABASE_URL")
- Add previewFeatures = ["postgresqlExtensions"] to generator client
- Add extensions = [vector] to datasource

## Task 2: Write prisma/schema.prisma

Implement EVERY entity from architecture section 4. Do not omit fields.
Do not add fields beyond what the architecture specifies. Use UUIDs
(@default(dbgenerated("gen_random_uuid()")) or @default(uuid())).
All timestamps are @db.Timestamptz with @default(now()).

Models to create (exact names):
- Project
- Task
- Account
- Transaction
- Note
- CalendarEvent
- Reminder
- Verse
- Link            (polymorphic — fromType/fromId/toType/toId/relation)
- Embedding       (vector column for pgvector)

Enums to create:
- ProjectStatus  : ACTIVE, PAUSED, DONE, ARCHIVED
- Priority       : LOW, MEDIUM, HIGH, CRITICAL
- TaskStatus     : TODO, IN_PROGRESS, DONE, BLOCKED
- Energy         : LOW, MEDIUM, HIGH
- AccountType    : CASH, CHECKING, SAVINGS, INVESTMENT, CREDIT, LOAN, ASSET
- TransactionSource : MANUAL, CSV_IMPORT
- NoteSource     : NATIVE, APPLE_NOTES_IMPORT
- ReminderPriority : LOW, MEDIUM, HIGH

Relationships:
- Project 1 — N Task (Task.projectId nullable)
- Account 1 — N Transaction (Transaction.accountId required)
- Verse has is_current Boolean (only one should be true at a time —
  enforce at app layer, not DB constraint, to keep schema flexible)

For the Embedding model:
- Use the Unsupported("vector(1536)") type for the vector column
  (Gemini's default embedding dimension is 768; OpenAI's is 1536 —
  USE 1536 for forward-compat; we can right-size in Sprint 4 if needed)
- Add a normal index on (sourceType, sourceId)
- The actual vector ANN index will be added via a raw SQL migration
  in Task 4 — Prisma cannot natively express ivfflat/hnsw indexes

For the Link model:
- fromType: String
- fromId: String @db.Uuid
- toType: String
- toId: String @db.Uuid
- relation: String? (nullable label)
- Add indexes on (fromType, fromId) and (toType, toId)

## Task 3: First migration (against DEV database)

Ensure `pnpm dev:db:up` is running and your `.env` DATABASE_URL points
at localhost:5433/coop_dev. Then run:
- npx prisma migrate dev --name init

This should:
- Create the migration SQL in prisma/migrations/
- Apply it to the running DEV Postgres
- Generate the Prisma client

If the pgvector extension is not loaded, the migration will fail.
Add a manual migration prelude file if needed:

prisma/migrations/00000000000000_pgvector/migration.sql:
  CREATE EXTENSION IF NOT EXISTS vector;

Then re-run migrate dev. (The same migration will later be applied to
prod via `prisma migrate deploy` in Session #5 — committed migrations
are the single source of truth for both databases.)

## Task 4: Add ANN index via raw migration

Generate an empty migration:
- npx prisma migrate dev --create-only --name embedding_ann_index

Edit the SQL to add:
  CREATE INDEX IF NOT EXISTS embedding_vector_ivfflat
    ON "Embedding"
    USING ivfflat (vector vector_cosine_ops)
    WITH (lists = 100);

(ivfflat is fine for V1's scale; hnsw is an option later.)

Apply: npx prisma migrate dev (applies the new migration to dev db)

## Task 6: Snapshot script (the before-migration safety habit)

Create scripts/db-snapshot.sh (executable) that dumps whichever database
the current environment points at, into a local ./snapshots folder with
a timestamp. It reads DATABASE_URL from the environment.

#!/bin/bash
set -euo pipefail
mkdir -p ./snapshots
TS=$(date +%Y%m%d-%H%M%S)
echo "snapshotting current DATABASE_URL → ./snapshots/snap-$TS.sql.gz"
pg_dump "$DATABASE_URL" | gzip > "./snapshots/snap-$TS.sql.gz"
echo "done: $(du -h ./snapshots/snap-$TS.sql.gz | cut -f1)"

Add package.json script: "db:snapshot": "bash scripts/db-snapshot.sh"
Add ./snapshots to .gitignore.

This is your habit: run `pnpm db:snapshot` before any `prisma migrate`
in either environment. In dev it's cheap insurance; the discipline
carries over to prod where it matters.

## Task 7: Prisma client singleton

Create src/lib/db/client.ts:
- 'server-only' at top
- Standard Next.js singleton pattern (global var in dev to avoid
  hot-reload connection blowups, fresh instance in prod)
- Export `prisma`

## Task 8: Smoke insert/query test script

Create a one-off scripts/db-smoke.ts that:
- Inserts a sample Project, two Tasks linked to it, and one Link row
  (Task → Project, relation = "belongs_to" — even though FK exists,
  proves Link table works)
- Reads them back and prints
- Deletes them
- Exits

Add a "db:smoke" script: "tsx scripts/db-smoke.ts"

Run it against the DEV database. Report output.

> Safety reminder: db:smoke inserts and deletes rows. Only ever run it
> against the dev database. Once prod holds real data, never point this
> script at it.

## Task 9: Show me

- The full schema.prisma
- The list of migrations
- The smoke script output
- Confirmation that `\dt` in psql (against dev db on 5433) shows all tables

Do NOT seed any real data — this is schema only.
Do NOT modify env.ts beyond what's already there.
```

### What to Verify

- [ ] `npx prisma studio` opens (pointed at the dev DB on 5433) and shows every table
- [ ] All enums present and spelled correctly
- [ ] `Link` table has indexes on both `(fromType, fromId)` and `(toType, toId)`
- [ ] `Embedding` table has the pgvector column and the ivfflat index
- [ ] `pnpm db:smoke` inserts, reads, and deletes successfully against the dev DB
- [ ] `prisma migrate status` reports up-to-date
- [ ] No drift between schema and database
- [ ] `pnpm db:snapshot` produces a gzipped dump in `./snapshots`

**Sanity check the Link table by hand.** This polymorphic pattern is the riskiest piece of the whole model. Before committing, write one query yourself in psql (against the dev DB on 5433) that finds "all entities linked to project X regardless of type" — confirm it works the way you expect. If it feels awkward, this is the moment to revisit.

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): full unified data model — Prisma schema + pgvector"
```

---

## Session #4: Auth — Passcode + Session

### What You're Building

A single-passcode unlock screen, an httpOnly cookie session, and middleware that protects every `(app)` route. Per architecture §7, this is not defending against the open internet (Tailscale does that) — it protects the app on an unlocked device.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 7: Security)
- .kiro/steering/structure.md
- src/lib/env.ts
- src/lib/db/client.ts

## Task 1: Install dependencies

Install: jose (for signed JWT sessions), bcrypt (for passcode hashing)
Install types: @types/bcrypt

## Task 2: Passcode hashing setup

The APP_PASSCODE env var is the plaintext passcode. We hash it once
at server start and compare against that.

Create src/lib/auth/passcode.ts:
- 'server-only'
- export async function verifyPasscode(input: string): Promise<boolean>
- Use bcrypt.compare against a hash derived from env.APP_PASSCODE
- Memoize the hash at module load (one bcrypt.hash on first import)
- Use constant-time comparison (bcrypt.compare is constant-time)

## Task 3: Session token

Create src/lib/auth/session.ts:
- 'server-only'
- Use jose to sign and verify JWTs with env.SESSION_SECRET
- Functions:
  - createSessionToken(): Promise<string>  // 30-day expiry
  - verifySessionToken(token: string): Promise<boolean>
- Cookie name constant: COOP_SESSION
- Cookie options: httpOnly, sameSite: 'lax', secure: NODE_ENV==='production',
  path: '/', maxAge: 60*60*24*30

## Task 4: Auth API routes

Create src/app/api/auth/unlock/route.ts (POST):
- Reads { passcode: string } from body
- Calls verifyPasscode
- On success: creates session token, sets COOP_SESSION cookie, returns
  { ok: true }
- On failure: returns 401 { ok: false }
- Implement a simple in-memory rate limit: max 5 failed attempts per
  10 minutes per IP. After that, return 429 for the rest of the window.
  (In-memory is fine for single-user/single-instance.)

Create src/app/api/auth/lock/route.ts (POST):
- Clears COOP_SESSION cookie
- Returns { ok: true }

## Task 5: Middleware

Create src/middleware.ts:
- Read COOP_SESSION cookie
- If valid, allow request
- If missing/invalid AND request path is not in (auth) group or /api/auth/*
  or /api/health, redirect to /unlock
- matcher config: protect everything except /unlock, /api/auth/*,
  /api/health, /_next/*, /favicon.ico, static assets

## Task 6: Unlock page

Create src/app/(auth)/unlock/page.tsx:
- A minimal, intentionally plain page (Sprint 5 will style it)
- Centered card: app title, passcode input (type=password, autoFocus),
  Unlock button
- Client component that POSTs to /api/auth/unlock
- On success: router.push('/')
- On failure: show error message
- No styling polish required — function over form in Sprint 1

## Task 7: Protected landing page

Create src/app/(app)/page.tsx:
- A placeholder page that just renders "C.O.O.P. is online." and a
  Lock button that POSTs to /api/auth/lock and reloads
- Server Component
- This proves the auth flow end-to-end

## Task 8: Health route

Create src/app/api/health/route.ts:
- Returns { status: 'ok', timestamp: <ISO>, db: <true|false> }
- Pings the database with `SELECT 1` via prisma.$queryRaw
- This route bypasses auth (configured in middleware) so external
  uptime tooling can hit it

## Task 9: Manual test plan

In the README or a new docs/auth-test.md, list manual test steps:
1. Visit / unauthenticated → expect redirect to /unlock
2. Enter wrong passcode → expect error, no cookie set
3. Try 6 wrong passcodes in a row → expect 429 on the 6th
4. Enter correct passcode → expect redirect to /, cookie present
5. Visit / with valid cookie → expect "C.O.O.P. is online."
6. Click Lock → expect cookie cleared, redirect to /unlock
7. /api/health → expect 200 even when unauthenticated

Run the tests yourself. Report results.

Do NOT add OAuth, magic links, or any "remember this device" features.
Do NOT add user accounts — there is one user, ever.
```

### What to Verify

- [ ] All 7 manual test steps pass
- [ ] `COOP_SESSION` cookie is httpOnly (check DevTools → Application)
- [ ] In production build, cookie has `Secure` flag
- [ ] Rate limit triggers after 5 failures (test it — don't trust the code)
- [ ] `curl http://localhost:3001/api/health` returns JSON without a cookie (dev server port)
- [ ] Removing the cookie and visiting `/` redirects to `/unlock`

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): passcode auth + session middleware + health route"
```

---

## Session #5: Bring Up Production (Same Host) + Tailscale

### What You're Building

The production stack running on the Mac mini — the same machine you develop on — reachable from your phone via Tailscale. Since dev and prod share the box, this is not a remote deploy; it's standing up the always-on prod containers alongside your dev setup, with a clean promotion script.

This session has manual steps that Kiro cannot do for you — they're called out as **MANUAL**.

### Prompt

```
Read these files:
- COOP-Architecture.md (sections 6 and 7 — single-host model, promotion
  boundary, remote access)
- docker/docker-compose.yml
- docker/docker-compose.dev.yml
- README.md

## Task 1: Production env file template

Create docker/.env.production.example with all PROD env vars commented
and ready to be filled in as docker/.env. Include:
- DB_PASSWORD (strong, min 16 chars — generate with `openssl rand -base64 24`)
- APP_PASSCODE (the real app passcode)
- SESSION_SECRET (`openssl rand -base64 48`)
- AI_API_KEY (optional, leave empty until Sprint 4)

Add a prominent comment: this is the PRODUCTION env. It must point at the
prod database (the `db` service on the internal docker network) and must
NEVER share credentials or a database with dev (.env). docker/.env is
gitignored and lives only on this machine.

DO NOT commit a real docker/.env.

## Task 2: Promotion script

Create scripts/deploy.sh (executable). Since prod runs on the same host,
"deploy" means: promote the committed code into the running prod stack.

#!/bin/bash
set -euo pipefail
echo "→ pulling latest"
git pull
echo "→ snapshotting prod DB before migrate (safety)"
docker compose -f docker/docker-compose.yml --profile backup run --rm backup || true
echo "→ building prod image"
docker compose -f docker/docker-compose.yml build
echo "→ applying migrations to PROD db"
docker compose -f docker/docker-compose.yml run --rm app npx prisma migrate deploy
echo "→ restarting prod services"
docker compose -f docker/docker-compose.yml up -d
echo "→ status"
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs --tail=30 app

Note: the snapshot step depends on the backup service from Session #6.
Until that exists, the `|| true` lets it no-op. After Session #6 it
becomes a real pre-migration prod backup.

## Task 3: Document Tailscale setup

Create docs/tailscale-setup.md with these MANUAL steps:

1. Install Tailscale on the Mac mini: brew install --cask tailscale, sign in
2. `tailscale up`
3. Note the Mac mini's Tailscale name (e.g. coop-brain.tailnet-xxx.ts.net)
   and its Tailscale IP
4. Install Tailscale on phone, sign in to the SAME tailnet
5. From the phone, browse to http://<mac-mini-tailscale-name>:3000
   (port 3000 = production; never expose the 3001 dev server)
6. Optional: enable MagicDNS for a short hostname
7. Optional later (NOT V1): Tailscale Serve for HTTPS — document, don't enable

Security reminder: the only thing protecting prod from other devices on
your tailnet is the passcode, so keep the tailnet to YOUR devices only —
do not share nodes. Also: only the production app (3000) should ever be
reached over Tailscale. The dev server (3001) and dev db (5433) are for
local work on the machine itself.

## Task 4: Document the single-host operating model

Create docs/operating-model.md explaining day-to-day life on one machine:
- Production runs detached at all times (prod:up, restart: unless-stopped)
- To develop: ensure dev db is up (dev:db:up), run `pnpm dev` (port 3001)
- Dev and prod run simultaneously — different ports, different databases
- Promote changes with scripts/deploy.sh
- NEVER point dev .env at the prod database
- Memory: avoid heavy dev builds while relying on prod; both share 16GB

## Task 5: Boot persistence

Document: Docker Desktop set to "Start at login." The prod compose stack
uses restart: unless-stopped, so prod comes back after a reboot. The dev
db also restarts unless-stopped (harmless; it's idle when not coding).

Do NOT configure launchd/systemd unit files for the app — Docker
Desktop auto-start is enough for V1.

## Task 6: Report

List every manual step the operator must complete. Bold any that are
security-sensitive (passcode entry, env file creation, tailnet hygiene).
```

### Manual Steps for You

- [ ] Install Tailscale on Mac mini and phone, both on the same tailnet
- [ ] Generate a real `SESSION_SECRET` with `openssl rand -base64 48`
- [ ] Choose and record the real `APP_PASSCODE` (password manager)
- [ ] Generate a real `DB_PASSWORD`
- [ ] Fill in `docker/.env` (never commit it)
- [ ] Run `pnpm prod:up` (or `scripts/deploy.sh` once Session #6 exists)
- [ ] Hit `http://<mac-mini-tailscale-name>:3000/api/health` from your phone
- [ ] Unlock the production app from your phone with the passcode
- [ ] Add to phone home screen

### What to Verify

- [ ] Production app reachable from phone via Tailscale URL (port 3000)
- [ ] Prod NOT reachable from a device outside your tailnet (test by disabling Tailscale on your phone — it should fail to load)
- [ ] Dev and prod run at the same time without port conflict (`pnpm dev` on 3001 while prod serves 3000)
- [ ] Prod and dev are pointed at **different** databases (confirm prod `docker/.env` and dev `.env` have different DATABASE_URLs)
- [ ] Mac mini reboot: power-cycle and confirm prod comes back up on its own
- [ ] `/api/health` returns `db: true` from the phone

Commit (docs + script only — no secrets):
```bash
git add docs/ scripts/deploy.sh docker/.env.production.example
git commit -m "feat(sprint-1): prod bring-up script + tailscale + operating model docs"
```

---

## Session #6: Automated Backups

### What You're Building

The backup safety net from architecture §8. Nightly `pg_dump` of the **production** database to iCloud Drive, with simple rotation. This must exist BEFORE Sprint 2 creates real data. (Dev data is disposable and is not backed up — only prod.)

### Prompt

```
Read these files:
- COOP-Architecture.md (section 8: Backup & Recovery)
- docker/docker-compose.yml
- docs/operating-model.md

## Task 1: Backup container

Create docker/backup/Dockerfile:
- FROM postgres:16-alpine (so we have pg_dump matching server version)
- RUN apk add --no-cache bash tzdata
- COPY backup.sh /backup.sh
- RUN chmod +x /backup.sh
- CMD ["/backup.sh"]

Create docker/backup/backup.sh:
#!/bin/bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
DEST="/backups"
mkdir -p "$DEST"
echo "[$(date)] starting backup → $DEST/coop-$TS.sql.gz"
PGPASSWORD="$DB_PASSWORD" pg_dump -h db -U coop -d coop \
  | gzip > "$DEST/coop-$TS.sql.gz"
echo "[$(date)] backup complete: $(du -h "$DEST/coop-$TS.sql.gz" | cut -f1)"

# Rotation: keep last 14 dailies + last 12 monthlies
find "$DEST" -name "coop-*.sql.gz" -mtime +14 \
  ! -name "coop-*01-*.sql.gz" -delete
find "$DEST" -name "coop-*01-*.sql.gz" -mtime +365 -delete

echo "[$(date)] rotation complete"

## Task 2: Add backup service to compose

Add to docker-compose.yml:

  backup:
    build:
      context: ./backup
      dockerfile: Dockerfile
    depends_on:
      db:
        condition: service_healthy
    environment:
      DB_PASSWORD: ${DB_PASSWORD}
      TZ: America/Los_Angeles    # adjust to operator's timezone
    volumes:
      - ${BACKUP_DIR}:/backups
    profiles: ["backup"]

The `profiles: ["backup"]` means this service only runs when explicitly
invoked — we don't want it running as a long-lived container. We invoke
it via the host's launchd cron.

## Task 3: BACKUP_DIR env

Add BACKUP_DIR to env.example with a comment:
"Absolute path on the host where backups are written. On Mac mini,
point this at an iCloud Drive folder, e.g.
/Users/<you>/Library/Mobile Documents/com~apple~CloudDocs/coop-backups"

## Task 4: launchd job

Create scripts/install-backup-job.sh that:
- Generates ~/Library/LaunchAgents/com.coop.backup.plist
- The plist runs nightly at 02:30 local:
  cd <repo>/docker && docker compose --profile backup run --rm backup
- launchctl load the plist
- Print confirmation and the next scheduled run

## Task 5: Manual test of backup

Run once manually:
docker compose -f docker/docker-compose.yml --profile backup run --rm backup

Confirm:
- A new coop-<timestamp>.sql.gz appears in $BACKUP_DIR
- The file is non-empty and gzipped (file <path>.sql.gz)
- gunzip -c <file> | head shows SQL dump content

## Task 6: Restore drill

Write docs/restore.md with the EXACT commands to restore from a backup:

1. Stop the app:
     docker compose -f docker/docker-compose.yml stop app
2. Drop and recreate the database (DESTRUCTIVE):
     docker compose -f docker/docker-compose.yml exec db \
       psql -U coop -d postgres -c "DROP DATABASE coop;"
     docker compose -f docker/docker-compose.yml exec db \
       psql -U coop -d postgres -c "CREATE DATABASE coop;"
3. Restore:
     gunzip -c <backup-file>.sql.gz | \
       docker compose -f docker/docker-compose.yml exec -T db \
       psql -U coop -d coop
4. Re-enable pgvector if needed and reapply ANN index:
     docker compose -f docker/docker-compose.yml exec db \
       psql -U coop -d coop -c "CREATE EXTENSION IF NOT EXISTS vector;"
5. Restart app:
     docker compose -f docker/docker-compose.yml start app
6. Hit /api/health and confirm db: true

Operator must walk through this drill ONCE manually (against the
current empty DB) before Sprint 1 is considered done. A backup you
have never restored from is not a backup.

## Task 7: Report

Show:
- The backup file written during manual test
- The launchd next-run time
- Confirmation that restore.md commands are accurate
```

### Manual Steps for You

- [ ] On the Mac mini, run the manual backup once and confirm the file lands in iCloud Drive (verify iCloud syncs it up by checking iCloud on another device)
- [ ] Run `scripts/install-backup-job.sh`
- [ ] **Walk through the full restore drill against the empty DB.** This is the single most important test of Sprint 1.
- [ ] Confirm Time Machine is enabled on the Mac mini with an attached external drive
- [ ] Confirm Git push of the repo to private GitHub succeeded

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): automated nightly backups + restore docs"
```

---

## Session #7: AI Provider Interface Stub

### What You're Building

Per architecture §5 (and principle #7), the AI layer sits behind a provider-agnostic interface from day one. Sprint 1 creates the *interface and stub* only — no real API calls. Sprint 4 wires in Gemini Flash (or whatever provider) behind it.

This session is small but important: it's a structural commitment now so Sprint 4 has no "where does this live" debate.

### Prompt

```
Read these files:
- COOP-Architecture.md (section 5: AI Architecture)
- .kiro/steering/tech.md
- src/lib/env.ts

## Task 1: Define the interface

Create src/lib/ai/types.ts:

export interface EmbedRequest {
  text: string;
}
export interface EmbedResponse {
  vector: number[];
  model: string;
}

export interface CompleteRequest {
  prompt: string;
  context?: string[];   // grounding chunks from RAG retrieval
  system?: string;
}
export interface CompleteResponse {
  text: string;
  model: string;
}

export interface AIProvider {
  embed(req: EmbedRequest): Promise<EmbedResponse>;
  complete(req: CompleteRequest): Promise<CompleteResponse>;
}

## Task 2: Stub provider

Create src/lib/ai/providers/stub.ts:
- 'server-only'
- export class StubProvider implements AIProvider
- embed: throws Error("AI not configured — Sprint 4")
- complete: throws Error("AI not configured — Sprint 4")

## Task 3: Provider factory

Create src/lib/ai/index.ts:
- 'server-only'
- Reads env.AI_API_KEY (optional in Sprint 1)
- If absent, exports a StubProvider instance
- If present, also exports a StubProvider for now (Sprint 4 swaps in
  the real provider — leave a TODO comment naming the file Sprint 4
  will create: src/lib/ai/providers/gemini.ts)
- export const ai: AIProvider

## Task 4: Verify

Confirm:
- The Next.js build still succeeds
- Calling ai.embed() throws the documented error
- No real network calls happen at any point

Do NOT install any AI SDKs.
Do NOT make any HTTP calls.
Do NOT implement real embedding or completion logic.
```

### What to Verify

- [ ] `pnpm build` still passes
- [ ] `import { ai } from '@/lib/ai'` works from any server module
- [ ] A test call throws the "not configured" error rather than crashing silently

Commit:
```bash
git add -A
git commit -m "feat(sprint-1): ai provider interface (stub) — wired in sprint 4"
```

---

## Session #8: End-to-End Smoke Test + Sprint 1 Sign-Off

### What You're Building

Confirmation that the whole stack — repo, Docker, Postgres, schema, auth, Tailscale, backups, AI stub — works together. This is your "Sprint 1 is real" gate before starting Sprint 2.

### Prompt

```
Read these files:
- README.md
- docs/auth-test.md
- docs/restore.md
- docs/tailscale-setup.md
- docs/operating-model.md

## Task 1: Generate a sprint-1-checklist.md

Create docs/sprint-1-checklist.md that consolidates every verification
step from sessions 1–7 into one runnable checklist. Group by category:
- Repo & build
- Containers
- Database & schema
- Auth & sessions
- Remote access
- Backups & restore
- AI interface

For each item, include the exact command to run or the URL to hit.

## Task 2: Verify against running system

For each item in the checklist, run it against the live Mac mini
deployment (over Tailscale where applicable). Report PASS/FAIL.

For any FAIL: stop, report the failure, do not attempt to fix.
We diagnose together.

## Task 3: Capture baseline

Once all items PASS, capture and commit a baseline snapshot to
docs/sprint-1-baseline.md:
- Date/time
- Git SHA
- Output of `prisma migrate status` (against both dev and prod DBs)
- Output of `docker compose -f docker/docker-compose.yml ps` (prod stack)
- Output of `docker compose -f docker/docker-compose.dev.yml ps` (dev db)
- Output of `docker system df` (baseline disk usage to watch against over time)
- Output of `/api/health` from the phone over Tailscale (prod, port 3000)
- Confirmation that prod and dev use different databases (different DATABASE_URLs)
- Confirmation that the prod backup→restore drill was performed manually
- Confirmation that Time Machine is active

This baseline is what every Sprint 2 change is measured against.

Do NOT start any Sprint 2 work.
Do NOT introduce any feature code.
```

### What to Verify

- [ ] Every item in `sprint-1-checklist.md` shows PASS
- [ ] `sprint-1-baseline.md` is committed with real values, not placeholders
- [ ] You personally completed the restore drill (not Kiro — you)
- [ ] You can unlock the app from your phone in under 10 seconds

Commit:
```bash
git add -A
git commit -m "chore(sprint-1): end-to-end smoke test + baseline captured"
git tag sprint-1-complete
git push origin main --tags
```

---

## What "Done" Looks Like for Sprint 1

✅ **Repo**: Next.js 15 + TS strict, lint/format/build all clean, env validated at boot. Dev server on 3001, two env files (`.env` dev, `docker/.env` prod) that never share a database.

✅ **Containers**: Production Compose stack (app on 3000 + Postgres internal-only + opt-in backup) plus a separate dev Postgres on 5433. Prod services start on Mac mini reboot. Dev and prod run side by side without conflict.

✅ **Schema**: Every entity from architecture §4 implemented in Prisma. Polymorphic `Link` table indexed. `Embedding` table with pgvector column and ivfflat ANN index. Migrations applied to dev (and to prod via `migrate deploy`). Smoke insert/query/delete passes against dev.

✅ **Auth**: Passcode-protected with httpOnly cookie session. Rate-limited. Middleware protects all `(app)` routes. `/api/health` bypasses auth for uptime checks.

✅ **Remote access**: Production app (port 3000) reachable via Tailscale from phone. Not reachable from the public internet. Dev server (3001) and dev db (5433) stay local to the machine. Verified by disabling Tailscale on phone and confirming the connection fails.

✅ **Two-environment safety**: Dev work runs against a disposable database; production data is never touched by development. `pnpm db:snapshot` habit in place before migrations. `pnpm dev:db:reset` nukes dev freely.

✅ **Backups**: Nightly `pg_dump` of the **production** DB to an iCloud-synced folder, with 14-day daily + 12-month monthly rotation. Time Machine active. Code in private GitHub. **Restore drill performed once manually.**

✅ **AI interface**: Provider-agnostic interface in `lib/ai/` with stub implementation. Real provider deferred to Sprint 4 with a TODO marker.

✅ **Baseline captured**: `docs/sprint-1-baseline.md` committed; `sprint-1-complete` tag pushed.

---

## Session Summary

| Session | Focus | Approx Time |
|---------|-------|-------------|
| #1 | Repo bootstrap (Next.js, TS, lint, env, dev on 3001) | 30–45 min |
| #2 | Docker — prod stack + separate dev database | 40–55 min |
| #3 | **Prisma schema — full unified data model** | 60–90 min |
| #4 | Passcode auth + session middleware | 45–60 min |
| #5 | Prod bring-up (same host) + Tailscale (manual-heavy) | 45–60 min |
| #6 | Automated backups + **restore drill** | 45–60 min |
| #7 | AI provider interface stub | 15–20 min |
| #8 | E2E smoke test + baseline | 30–45 min |
| **Total** | | **~5.5–7.5 hours** |

The session most worth slowing down on is **#3 (schema)** — it's the load-bearing decision of the whole system and every later sprint reads from it. The session most worth not skipping is **#6 (backups + restore drill)** — a backup you've never restored from is not a backup, and Sprint 2 will start filling the database with data you actually care about.

---

## Heading Into Sprint 2

When `sprint-1-complete` is tagged and the baseline is green, Sprint 2 picks up by:
- Building the dashboard shell with the locked design system (architecture §9)
- Implementing the Productivity module (Projects + Tasks) end-to-end
- Wiring the first real panels (greeting, today's calendar placeholder, priorities, verse — finance and AI panels render as static placeholders until Sprints 3 and 4)
- Standing up the ⌘K command palette as a real component (it's now load-bearing for both navigation and Sprint 4's AI queries)

Do not start Sprint 2 until you have personally unlocked C.O.O.P. from your phone over Tailscale at least once and felt the foundation work.
