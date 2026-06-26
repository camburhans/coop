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
