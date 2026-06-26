# C.O.O.P.

**Cognitive Operations & Optimization Platform** — a private, single-user life
operating system. Its North Star: show me what I need to do, show me how the
different areas of my life are looking, and keep me organized.

## Two environments on one machine

C.O.O.P. develops and runs production on the same Mac mini. The two environments
are kept apart by distinct ports, databases, and env files — never by separate
machines or repos:

- **Development** — `pnpm dev` on port **3001**, pointing at the dev Postgres on
  host port **5433** (via `.env`). Run only while actively coding.
- **Production** — Docker on port **3000**, pointing at the prod Postgres on the
  internal docker network (via `docker/.env`). Always running.

The two env files must **never** point at the same database. Dev data is
disposable; prod data is real.

## Prerequisites

- Node 20+
- Docker (Docker Desktop on the Mac mini)
- pnpm

## Quick start

```bash
# 1. Copy the dev env template and fill in values
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Start the dev database (added in Session #2)
pnpm dev:db:up

# 4. Run the dev server on port 3001
pnpm dev
```

> Docker setup (prod stack + dev database) arrives in **Session #2**. Until then,
> `pnpm dev` runs the app but has no database to connect to.
