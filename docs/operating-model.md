# Operating Model — Day-to-Day on One Machine

C.O.O.P. develops and runs production on the **same Mac mini**. Dev and prod are
kept apart not by separate machines but by distinct ports, databases, and env
files. This doc covers what daily life looks like under that arrangement.

See `COOP-Architecture.md` §6–7 for the why; this is the operational how.

## The two environments, side by side

|              | Production                                  | Development                              |
| ------------ | ------------------------------------------- | ---------------------------------------- |
| App          | Docker, port **3000** (127.0.0.1)           | Native `pnpm dev`, port **3001**         |
| Database     | Postgres in Docker, internal network only   | Postgres in Docker, host port **5433**   |
| Env file     | `docker/.env`                               | `.env`                                   |
| Compose proj | `coop-prod`                                 | `coop-dev`                               |
| Data         | Real life data — protected                  | Fake/throwaway — disposable              |
| Lifecycle    | Detached, always on                         | Up only while actively coding            |

Dev and prod run **simultaneously** — different ports, different databases, no
overlap. Opening the app every morning hits prod on 3000; building a feature
happens on 3001 at the same time without disturbing it.

## Production: always on

Production runs detached at all times.

```bash
pnpm prod:up        # start prod detached (docker compose ... up -d)
pnpm prod:logs      # follow prod logs
pnpm prod:down      # stop prod (rarely needed)
```

The prod stack uses `restart: unless-stopped`, so once it's up it stays up —
through crashes and reboots — until you explicitly stop it.

## Development: only while coding

```bash
pnpm dev:db:up      # 1. ensure the dev database (port 5433) is running
pnpm dev            # 2. run the dev server on port 3001
# ... code, test ...
pnpm dev:db:down    # (optional) stop the dev db when done for the day
```

The dev database is disposable. If it gets into a bad state, nuke it — this
carries zero risk to prod:

```bash
pnpm dev:db:reset   # drop the dev volume and recreate it
```

## Promoting changes to production

When a change is tested in dev, promote it with the deploy script:

```bash
./scripts/deploy.sh
```

It pulls latest, snapshots the prod DB (safety; becomes a real pre-migration
backup once the backup service lands in Session #6), rebuilds the prod image,
runs `prisma migrate deploy` against the **prod** database, restarts prod, and
prints status + recent logs. The promotion boundary is deliberate: "where I
experiment" and "what I rely on" are never the same database.

## Hard rules

- **NEVER point the dev `.env` at the prod database.** Dev's `DATABASE_URL` must
  always be the localhost:5433 dev Postgres. The whole two-database split exists
  so a stray `deleteMany()` or schema experiment can never touch real data.
- The two env files (`.env` and `docker/.env`) must never share credentials or a
  database. They are kept apart on purpose.

## Memory (the 16GB ceiling)

Dev and prod share 16GB of unified memory. Idle, they coexist comfortably — prod
(app + one Postgres) and the dev Postgres are all idle-light. The real pressure
comes from heavy dev **builds** (plus editor + browser) running while you also
rely on prod. Avoid kicking off heavy dev builds during moments you need prod to
be responsive; otherwise the two run side by side without trouble.

## Boot persistence (surviving a reboot)

Production must come back automatically after the Mac mini reboots. This is
handled entirely by Docker Desktop + compose restart policies — no custom
service files needed:

- **Set Docker Desktop to "Start at login"** (Docker Desktop → Settings →
  General → *Start Docker Desktop when you sign in*). This ensures the Docker
  engine itself is running after a reboot.
- The prod compose stack uses **`restart: unless-stopped`**, so once Docker is
  up, prod's `app` and `db` containers restart on their own and prod is back
  without manual intervention.
- The dev database also uses `restart: unless-stopped`. This is harmless — it
  simply comes back idle and costs almost nothing when you're not coding. (Stop
  it with `pnpm dev:db:down` if you'd rather it not auto-start.)

> **Do NOT configure launchd or systemd unit files for the app.** Docker
> Desktop's auto-start plus `restart: unless-stopped` is the complete and
> intended boot-persistence mechanism for V1. Custom service files are
> unnecessary complexity.
