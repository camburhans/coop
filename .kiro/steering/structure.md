---
inclusion: always
---

# Repo Structure

coop/
├── .kiro/steering/ # this directory
├── docker/
│ ├── docker-compose.yml # PRODUCTION stack (app + prod db + backup)
│ ├── docker-compose.dev.yml # DEV database only (separate Postgres)
│ ├── Dockerfile.app
│ ├── .env.production.example # template for docker/.env (prod, gitignored)
│ └── backup/
│ ├── Dockerfile
│ └── backup.sh
├── prisma/
│ ├── schema.prisma # full unified data model (Sprint 1)
│ └── migrations/
├── scripts/
│ ├── deploy.sh # promote prod on this host
│ ├── db-snapshot.sh # on-demand dump before migrations
│ └── install-backup-job.sh # launchd nightly prod backup
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── (auth)/ # unauthenticated routes (unlock page)
│ │ ├── (app)/ # authenticated routes (dashboard + modules)
│ │ ├── api/
│ │ │ ├── health/
│ │ │ └── auth/
│ │ └── layout.tsx
│ ├── lib/
│ │ ├── auth/ # session + passcode logic
│ │ ├── db/ # Prisma client singleton
│ │ ├── ai/ # provider-agnostic interface (stub in Sprint 1)
│ │ └── env.ts # validated env loader
│ ├── types/ # shared types
│ └── proxy.ts # route protection (Next 16 renamed middleware → proxy)
├── .env # DEV env (gitignored) — points at dev DB on 5433
├── .env.example # template documenting dev env shape
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
- No secrets in repo — both .env files gitignored, \*.example documents shape
- Server-only logic uses 'server-only' import to prevent client leakage
- Route groups: (auth) bypasses proxy, (app) is protected

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
