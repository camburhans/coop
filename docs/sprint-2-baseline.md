# Sprint 2 — Baseline Snapshot

The reference state captured at the promotion of Sprint 2 (Productivity +
dashboard shell, "Midnight & Gilt"). Produced by running
`docs/sprint-2-checklist.md` against the live Mac mini deployment, then
promoting to production with `scripts/deploy.sh`. Measured against
[`docs/sprint-1-baseline.md`](sprint-1-baseline.md).

**Sign-off type: conditional.** All automated checks pass on dev and prod, and
the promotion completed cleanly (`migrate deploy` was a confirmed no-op). The
remaining items are **operator attestations** that cannot be verified from
tooling (phone-over-Tailscale, visual/interaction sign-off, the iCloud backup
directory listing under macOS privacy protection) — see
[Attestations](#operator-attestations-pending) below.

---

## Capture metadata

| Field | Value |
| --- | --- |
| Date / time | **2026-07-13 09:06 EDT** (2026-07-13T13:06Z UTC) |
| Host | Mac mini (16GB, single dev+prod host) |
| Git branch | `main` |
| Git SHA (last commit) | `c2f1509e5044a89bf7e5707329155c85b8c57200` — `chore(sprint-2): dev seed + empty/loading/error states + mobile hardening` |
| Sprint 2 tag | **not yet applied** — `sprint-2-complete` to be tagged by the operator after the attestations below clear (see [Closing the sprint](#closing-the-sprint)) |
| Working-tree additions at capture | `docs/sprint-2-checklist.md`, `docs/sprint-2-baseline.md` (this file) — uncommitted |
| Toolchain | Docker 29.5.3, Node v25.7.0, pnpm 11.9.0, Tailscale 1.98.8 |

---

## Verification summary

| # | Category | Result |
| --- | --- | --- |
| 1 | Build & lint | ✅ PASS (`pnpm lint` clean, `pnpm build` compiles, TS clean) |
| 2 | Design system & shell | ✅ PASS (code-verified; visual sign-off pending) |
| 3 | Productivity (data + UI) | ✅ PASS (`prod:smoke` 16 assertions; UI code-verified) |
| 4 | Dashboard panels (live + placeholder) | ✅ PASS (priorities/verse/calendar live; finance placeholder) |
| 5 | Command bar / palette | ✅ PASS (code-verified; keyboard/visual sign-off pending) |
| 6 | Seed · empty/error · mobile | ✅ PASS (seed guarded + populates; mobile visual sign-off pending) |
| 7 | Promotion gate | ✅ PASS on tooling; phone-over-Tailscale + real-data entry pending (operator) |

No FAILs were encountered during dev verification. Sprint 2 introduced **no**
schema migration, **no** `framer-motion`, **no** Server Actions, **no** AI
calls, and no hardcoded hex outside `globals.css` — all boundaries held.

---

## Required baseline outputs

### `prisma migrate status`

**DEV** (`localhost:5433/coop_dev`):

```
2 migrations found in prisma/migrations
Database schema is up to date!
```

**PROD** (internal `db:5432/coop`, via the `migrate` service inside the compose network):

```
2 migrations found in prisma/migrations
Database schema is up to date!
```

Applied migrations (both DBs, unchanged since Sprint 1):
`20260626131116_init`, `20260626131140_embedding_ann_index`. The
`prisma/migrations/` tree was last modified by the Sprint 1 schema commit —
**Sprint 2 added zero migrations**, so the promotion's `prisma migrate deploy`
reported **`No pending migrations to apply.`** (a true no-op).

### `docker compose -f docker/docker-compose.yml ps` (PROD)

```
NAME              IMAGE                    SERVICE   STATUS                PORTS
coop-prod-app-1   coop-prod-app            app       Up About a minute     127.0.0.1:3000->3000/tcp
coop-prod-db-1    pgvector/pgvector:pg16   db        Up 3 days (healthy)   5432/tcp
```

The `app` container was recreated from the freshly built image during the
promotion; `db` was untouched (only the app image changed). App is
loopback-bound (`127.0.0.1:3000`); prod db exposes no host port
(`5432/tcp`, internal network only).

### `docker compose -f docker/docker-compose.dev.yml ps` (DEV)

```
NAME                IMAGE                    SERVICE   STATUS                PORTS
coop-dev-dev-db-1   pgvector/pgvector:pg16   dev-db    Up 3 days (healthy)   127.0.0.1:5433->5432/tcp
```

### `docker system df` (compared to Sprint 1)

```
TYPE            TOTAL     ACTIVE    SIZE       RECLAIMABLE
Images          5         2         10.69GB    1.618GB (15%)
Containers      3         3         45.06kB    0B (0%)
Local Volumes   2         2         117.5MB    0B (0%)
Build Cache     86        0         9.262GB    7.25GB
```

| Metric | Sprint 1 | Sprint 2 | Delta |
| --- | --- | --- | --- |
| Images size | 8.356GB | 10.69GB | +2.33GB |
| Build cache | 6.882GB | 9.262GB | +2.38GB |
| Local volumes | 117.5MB | 117.5MB | unchanged |

> **Watch this.** Sprint 2's repeated prod builds added ~4.7GB of image +
> cache churn. Data volumes are still tiny (117.5MB). Reclaim when it grows
> with `docker image prune -f` and `docker builder prune -f` (README §Maintenance).

### `/api/health` (PROD, loopback `127.0.0.1:3000`)

```
{"status":"ok","timestamp":"2026-07-13T13:03:57.221Z","db":true}
```

`db:true` — the freshly recreated app reconnected to the prod database.
The root path over the same origin redirects to the passcode gate
(`307 → /unlock`), and `/api/projects` unauthenticated returns `307`
(proxy-protected). The **phone-over-Tailscale** path (HTTPS via
`tailscale serve --bg 3000`) is an operator attestation below.

### Production holds only real, hand-entered data (no seed)

Immediately after promotion, the prod database is **empty of application data**:

```
projects | tasks | events | verses
       0 |     0 |      0 |      0
```

The dev seed (`scripts/seed-dev.ts`) is hard-guarded to the dev database
(`DATABASE_URL` must contain `5433` or `coop_dev`) and was **never** run against
prod. Production starts empty by design — only the real projects, tasks, and
verse the operator enters will populate it.

### Backups — nightly job active + fresh pre-promotion snapshots

- Nightly launchd job `com.coop.backup` is loaded (last exit status `0`); plist
  at `~/Library/LaunchAgents/com.coop.backup.plist`.
- Fresh prod snapshots were written to the iCloud backup dir
  (`$BACKUP_DIR = ~/Library/Mobile Documents/com~apple~CloudDocs/coop-backups`)
  via the `backup` compose profile during this session:
  `coop-20260712-102438.sql.gz`, `coop-20260712-102628.sql.gz`, and the
  deploy's pre-migrate snapshot `coop-20260713-090330.sql.gz` — each reported
  by the backup container as written + rotated (4.0K compressed; small because
  prod is still empty).
- **Note:** the backup files could not be enumerated with `ls`/`find` from the
  agent shell because macOS privacy protection (TCC / Full Disk Access) blocks
  this process from reading `~/Library/Mobile Documents`. Normal directories
  list fine (e.g. `snapshots/`), so this is an environment limitation, not a
  backup failure — the container's own success output confirms the writes.
  Operator should eyeball the folder in Finder to confirm the files are present
  and syncing to iCloud.

### Prod and dev use different databases (unchanged from Sprint 1)

| Env | `DATABASE_URL` (redacted) |
| --- | --- |
| DEV (`.env`) | `postgresql://coop:***@localhost:5433/coop_dev` |
| PROD (app container) | `postgresql://coop:***@db:5432/coop` |

Different host (`localhost` vs internal `db`), port (`5433` vs `5432`), and
database (`coop_dev` vs `coop`). The prod db has no host port at all. The
two-environment split holds.

---

## Operator attestations (pending)

Not verifiable from tooling; to be confirmed by the operator before tagging
`sprint-2-complete`:

- [ ] Open prod from the phone over Tailscale (`https://<mac-mini>.<tailnet>.ts.net`)
      and unlock with the passcode.
- [ ] On the phone against prod: the **dashboard** renders (gold rail/command
      bar/four panels), **`/productivity`** works, and **⌘K** opens and navigates.
- [ ] Create at least one **real** project + task on the prod app from the phone;
      confirm the Priorities lead panel reflects it.
- [ ] Visual/interaction sign-off (desktop): three fonts render (Sora / Spline
      Sans Mono / Newsreader serif verse), the gold gradient panel border and
      indigo-only voice accents read correctly, the live clock ticks, keyboard
      palette nav works, and the ≤760px mobile bottom-nav layout holds.
- [ ] Confirm the iCloud backup folder shows the recent `coop-*.sql.gz` dumps in
      Finder (see backup note above).

---

## Closing the sprint

Once the attestations above clear, close Sprint 2 per the guide:

```bash
git add docs/sprint-2-checklist.md docs/sprint-2-baseline.md
git commit -m "chore(sprint-2): e2e smoke test, prod promotion, baseline captured"
git tag sprint-2-complete
git push origin main --tags
```

> Left for the operator deliberately — this baseline does not auto-commit,
> tag, or push. The tag should mark a state the operator has personally
> confirmed on the phone against prod.
