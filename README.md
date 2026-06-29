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
disposable; prod data is real. More detail in
[`docs/operating-model.md`](docs/operating-model.md) and
`COOP-Architecture.md` §6–7.

## Prerequisites

- Node 22+ (pnpm 11 requires Node >= 22.13)
- Docker (Docker Desktop on the Mac mini)
- pnpm

## Quick start (development)

```bash
cp .env.example .env   # then fill in values
pnpm install
pnpm dev:db:up         # start the dev database (disposable Postgres on 5433)
pnpm dev               # dev server on port 3001
```

## Database images

Both databases use the `pgvector/pgvector:pg16` image, which ships the pgvector
extension binaries (Postgres 16). The image only makes the extension
*available* — `CREATE EXTENSION vector` is run by a Prisma migration, applied to
each database on its first `migrate`.

---

## Production operations

The prod stack lives in `docker/docker-compose.yml` (compose project
`coop-prod`): an `app` service on `127.0.0.1:3000` and an internal-only `db`
with no host port. A profile-gated `migrate` service applies Prisma migrations
inside the docker network (the prod db isn't reachable from the host).

### First-time setup

**1. Secrets — `docker/.env` (gitignored, lives only on this machine).**
Copy the template and fill in real values:

```bash
cp docker/.env.production.example docker/.env
openssl rand -hex 24     # DB_PASSWORD  (min 16 chars, URL-safe — see trap below)
openssl rand -base64 48  # SESSION_SECRET (min 32 chars)
```

- `APP_PASSCODE` — your real unlock passcode (min 8 chars; bcrypt-hashed at
  startup, never stored in plaintext).
- `AI_API_KEY` — leave empty until Sprint 4.

> **Compose secret traps.** Compose interpolates `docker/.env`, so a literal `$`
> in any value is read as a variable and silently blanked (you'll see
> `variable is not set. Defaulting to a blank string`), corrupting that secret —
> double it as `$$`. And because `DB_PASSWORD` is embedded in the prod
> `DATABASE_URL`, keep it URL-safe (no `$ / @ : ? # %` or spaces). Hex output
> satisfies both. Verify with
> `docker compose -f docker/docker-compose.yml config >/dev/null` — it should
> print no warnings.

**2. Build, migrate, start, verify:**

```bash
docker compose -f docker/docker-compose.yml build
pnpm prod:migrate     # apply migrations to the prod db (inside the network)
pnpm prod:up          # start db + app detached
curl -s http://localhost:3000/api/health   # expect {"status":"ok",...,"db":true}
```

> **`P1000: Authentication failed`?** Postgres only sets `POSTGRES_PASSWORD` when
> it *first* creates its data directory. If `coop_db_data` was initialized
> earlier with a different password, changing `DB_PASSWORD` has no effect. During
> first-time setup (no real data yet) reset the volume and re-run:
> `docker compose -f docker/docker-compose.yml down -v` then `pnpm prod:migrate`.
> `down -v` is destructive — never run it once prod holds data worth keeping. It
> does not touch the dev volume.

**3. Boot persistence.** Enable Docker Desktop → Settings → General →
**"Start Docker Desktop when you sign in."** Combined with the stack's
`restart: unless-stopped`, prod returns on its own after a reboot. No
launchd/systemd units needed.

**4. Remote access (phone).** The app is loopback-bound, so reach it over
Tailscale Serve, which proxies the tailnet to `127.0.0.1:3000`, keeps prod
tailnet-only, and adds HTTPS:

```bash
tailscale serve --bg 3000     # then browse to https://<mac-mini>.<tailnet>.ts.net
```

Keep the tailnet to **your devices only** — the passcode is the only thing
between a tailnet device and your prod data. Full steps in
[`docs/tailscale-setup.md`](docs/tailscale-setup.md).

### Daily workflow

```bash
pnpm dev:db:up && pnpm dev   # develop on 3001 (never touches prod data)
./scripts/deploy.sh          # promote to prod: pull → snapshot → build → migrate → restart
```

- **Never point dev `.env` at the prod database** — dev `DATABASE_URL` stays on
  `localhost:5433`.
- Avoid heavy dev builds while relying on prod — they share 16GB.
- `deploy.sh`'s pre-migrate snapshot is a no-op until the backup service exists
  (Sprint 1, Session #6); after that it becomes a real pre-migration backup with
  no change to your routine.

### Scripts

| Action                   | Command                               |
| ------------------------ | ------------------------------------- |
| Start prod (detached)    | `pnpm prod:up`                        |
| Apply prod migrations    | `pnpm prod:migrate`                   |
| Follow prod logs         | `pnpm prod:logs`                      |
| Stop prod                | `pnpm prod:down`                      |
| Rebuild + restart prod   | `pnpm prod:rebuild`                   |
| Promote dev → prod       | `./scripts/deploy.sh`                 |
| Start dev db             | `pnpm dev:db:up`                      |
| Stop dev db              | `pnpm dev:db:down`                    |
| Reset dev db (safe)      | `pnpm dev:db:reset`                   |
| Run dev server (3001)    | `pnpm dev`                            |
| Snapshot current db      | `pnpm db:snapshot`                    |
| Health check             | `curl -s localhost:3000/api/health`   |

---

## Maintenance

> **Important — reclaim Docker disk periodically.** Repeated prod builds leave
> dangling image layers and build cache behind, and on the 256GB Mac mini this
> is the main source of disk pressure (not the data itself). Every so often, or
> when `docker system df` shows strain, run:
>
> ```bash
> docker image prune -f      # remove dangling (untagged) image layers
> docker builder prune -f    # clear old build cache
> ```
>
> Both are safe: they only remove unreferenced layers/cache, never running
> containers, named volumes, or tagged images. For a deeper sweep,
> `docker system prune` also clears stopped containers and unused networks.
