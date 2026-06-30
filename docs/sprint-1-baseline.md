# Sprint 1 — Baseline Snapshot

The reference state captured at the end of Sprint 1. Every Sprint 2 change is
measured against this. Produced by running `docs/sprint-1-checklist.md` against
the live Mac mini deployment.

**Sign-off type: conditional.** All automated checks pass. Two safety-net items
are carried out of Sprint 1 as **documented exceptions** (Time Machine, prod
restore drill) — see [Exceptions](#exceptions-carried-out-of-sprint-1) below.

---

## Capture metadata

| Field | Value |
| --- | --- |
| Date / time | **2026-06-29 20:57 EDT** (2026-06-30 00:57 UTC) |
| Host | `camerons-mac-mini` (Mac mini M4, 16GB, single dev+prod host) |
| Git branch | `main` |
| Git SHA (last commit) | `a647ec2044f21d7279d484f6d2927e5cf2b5f097` — `feat(sprint-1): ai provider interface (stub)` |
| Working-tree changes at capture | Session #8 sign-off edits pending commit: `COOP-Architecture.md` (§8 Time Machine deferral), `eslint.config.mjs` (unused-vars `^_` ignore), `scripts/db-snapshot.sh` (locate `pg_dump` + no partial files), `docs/sprint-1-checklist.md`, `docs/sprint-1-baseline.md` |
| Toolchain | Docker 29.5.3, Node v25.7.0, pnpm 11.9.0, Tailscale 1.98.8, libpq/pg_dump 18.4 |

---

## Verification summary

| # | Category | Result |
| --- | --- | --- |
| 1 | Repo & build | ✅ PASS |
| 2 | Containers | ✅ PASS |
| 3 | Database & schema | ✅ PASS |
| 4 | Auth & sessions | ✅ PASS |
| 5 | Remote access | ✅ PASS (automated); 3 manual attestations pending |
| 6 | Backups & restore | ⚠️ PASS **except** Time Machine (deferred) + restore drill (pending) |
| 7 | AI interface | ✅ PASS |

Two fixes were made during sign-off (both non-feature):

- **eslint zero-warnings restored** — `@typescript-eslint/no-unused-vars` now
  ignores `^_`-prefixed args, so the Session #7 stub's `_req` params no longer
  warn. `pnpm lint` is clean again.
- **`db:snapshot` repaired** — the host had no `pg_dump`; installed `libpq`
  (pg18 client, dumps the pg16 servers fine) and hardened
  `scripts/db-snapshot.sh` to locate `pg_dump` and never leave an empty
  `.sql.gz` behind on failure.

---

## Required baseline outputs

### `prisma migrate status`

**DEV** (`localhost:5433/coop_dev`):

```
2 migrations found in prisma/migrations
Database schema is up to date!
```

**PROD** (internal `db:5432/coop`, run via the `migrate` service inside the compose network):

```
2 migrations found in prisma/migrations
Database schema is up to date!
```

Applied migrations (both DBs): `20260626131116_init`, `20260626131140_embedding_ann_index`.

### `docker compose -f docker/docker-compose.yml ps` (PROD)

```
NAME              IMAGE                    SERVICE   STATUS                 PORTS
coop-prod-app-1   coop-prod-app            app       Up About an hour       127.0.0.1:3000->3000/tcp
coop-prod-db-1    pgvector/pgvector:pg16   db        Up 2 hours (healthy)   5432/tcp
```

App is loopback-bound (`127.0.0.1:3000`). Prod db exposes **no host port**
(`5432/tcp`, internal network only — `HostConfig.PortBindings={}`).

### `docker compose -f docker/docker-compose.dev.yml ps` (DEV)

```
NAME                IMAGE                    SERVICE   STATUS                    PORTS
coop-dev-dev-db-1   pgvector/pgvector:pg16   dev-db    Up 30 minutes (healthy)   127.0.0.1:5433->5432/tcp
```

### `docker system df` (baseline disk usage)

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          5         2         8.356GB   1.618GB (19%)
Containers      3         3         45.06kB   0B (0%)
Local Volumes   2         2         117.5MB   0B (0%)
Build Cache     78        0         6.882GB   6.042GB
```

> **Watch this over time.** Build cache (6.88GB) + reclaimable image layers
> (1.62GB) already total ~8.5GB of churn — the expected main source of disk
> pressure per Architecture §6. When it grows, reclaim with
> `docker image prune -f` and `docker builder prune -f` (see README Maintenance).
> Data volumes are tiny (117.5MB).

### `/api/health` over Tailscale (PROD, the phone's path)

`GET https://camerons-mac-mini.tail93b21c.ts.net/api/health` (Tailscale Serve →
`127.0.0.1:3000`):

```
HTTP 200
{"status":"ok","timestamp":"2026-06-30T00:48:22.992Z","db":true}
```

Root over the same tailnet path redirects to the passcode gate (`307 → /unlock`).

### Prod and dev use different databases

Passwords redacted; the point is the host/port/db differ:

| Env | `DATABASE_URL` (redacted) |
| --- | --- |
| DEV (`.env`) | `postgresql://coop:***@localhost:5433/coop_dev` |
| PROD (app container) | `postgresql://coop:***@db:5432/coop` |

Different host (`localhost` vs internal `db`), port (`5433` vs `5432`), and
database (`coop_dev` vs `coop`). The two-environment split holds: dev cannot
reach prod data (prod db has no host port at all).

---

## Exceptions carried out of Sprint 1

These two items are **not satisfied** at this baseline. Recorded as accepted,
tracked exceptions (decision: proceed to Sprint 2 without them).

### 1. Time Machine — DEFERRED (no external drive yet)

`tmutil destinationinfo` → **"No destinations configured."** `tmutil status` →
`Running = 0`. Backup layer 2 (whole-system, Architecture §8) is not active
because the Mac mini has no dedicated external drive to back up to.

- **Interim safety nets in place:** nightly `pg_dump` → iCloud Drive (offsite)
  and Git. The database — the only irreplaceable state — is covered.
- **What's missing:** whole-system (OS / config / Docker) recovery — convenience,
  not data-of-record.
- **To clear:** attach a dedicated **APFS** external drive (not the 2TB ExFAT
  media drive, per §6), enable Time Machine, let a first backup complete, then
  re-run `tmutil destinationinfo` and update this file + Architecture §8.
- Architecture §8 has been updated to mark this layer deferred.

### 2. Prod restore drill — NOT YET PERFORMED (operator-manual)

`docs/restore.md` sign-off box is unchecked. Per the drill doc, the operator
must walk through a restore once, by hand, against the (currently empty) prod
DB — it is destructive, so tooling must not run it.

- **Status:** the backup half is proven (a real `coop-<ts>.sql.gz` was written
  and validated this session — see below). The **restore** half is unproven
  until the operator completes the drill.
- **To clear:** run steps 1–6 in `docs/restore.md`, confirm `/api/health` →
  `db:true`, then check the sign-off box.

---

## Backups verified this session

- Manual prod backup via the `backup` profile wrote
  `coop-20260629-204846.sql.gz` to the iCloud folder
  `~/Library/Mobile Documents/com~apple~CloudDocs/coop-backups`.
- Validated: gzip, 2.6KB compressed → 14,059 bytes, valid `PostgreSQL database
  dump` header. (Runs `pg_dump` inside `postgres:16-alpine` — independent of the
  host's client tools.)
- Nightly launchd job `com.coop.backup` is loaded (02:30 local).
- Repo pushed to `https://github.com/camburhans/coop.git` (private — operator-attested).

---

## Manual attestations still pending (operator)

Not verifiable from tooling; to be confirmed by the operator:

- [ ] Open prod from the phone over Tailscale and unlock with the passcode (< 10s).
- [ ] Confirm prod is **not** reachable with Tailscale disabled on the phone.
- [ ] Power-cycle the Mac mini and confirm prod returns on its own
      (Docker Desktop "Start at login" + `restart: unless-stopped`).
- [ ] Time Machine (see exception 1).
- [ ] Prod restore drill (see exception 2).
