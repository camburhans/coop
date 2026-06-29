# Restore Drill — Recovering the PROD Database from a Backup

This is the recovery half of Architecture §8. The nightly backup (see
`docker/backup/`, `scripts/install-backup-job.sh`) writes
`coop-<timestamp>.sql.gz` dumps to `$BACKUP_DIR` (an iCloud Drive folder on the
Mac mini). This document is the EXACT procedure to restore the **production**
database from one of those dumps.

> **A backup you have never restored from is not a backup.** The operator MUST
> walk through this drill ONCE manually — against the current (empty) prod DB —
> before Sprint 1 is considered done. Do it now, while there is nothing to lose.

All commands run from the **repo root** and target the prod stack
(`docker/docker-compose.yml`, project `coop-prod`). The prod `db` has no host
port, so every step reaches it *through* the compose network via
`docker compose ... exec db`.

---

## ⚠️ Step 2 is destructive

Step 2 **drops the entire prod database**. There is no undo. Only run this drill
when you intend to overwrite the current prod data with the contents of a
backup. Before starting, know which backup file you are restoring from:

```bash
ls -lt "$BACKUP_DIR"/coop-*.sql.gz | head    # newest first
```

Pick the file you want and use its full path in step 3 below (referred to as
`<backup-file>.sql.gz`).

---

## 1. Stop the app

Stop the app so nothing reads or writes `coop` while it is being replaced. (We
leave `db` running — we need it to drop, recreate, and reload the database.)

```bash
docker compose -f docker/docker-compose.yml stop app
```

## 2. Drop and recreate the database (DESTRUCTIVE)

We connect to the `postgres` maintenance database (not `coop`, since you cannot
drop a database you are connected to) and recreate `coop` empty:

```bash
docker compose -f docker/docker-compose.yml exec db \
  psql -U coop -d postgres -c "DROP DATABASE coop;"
docker compose -f docker/docker-compose.yml exec db \
  psql -U coop -d postgres -c "CREATE DATABASE coop;"
```

> If `DROP DATABASE` errors with "database is being accessed by other users",
> some connection is still open. Confirm the app is stopped (step 1), then force
> the remaining sessions closed and retry the drop:
>
> ```bash
> docker compose -f docker/docker-compose.yml exec db psql -U coop -d postgres -c \
>   "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='coop';"
> ```

## 3. Restore from the backup

Decompress the dump on the host and pipe it into `psql` inside the `db`
container. `-T` disables TTY allocation, which is required when piping into
`docker compose exec`:

```bash
gunzip -c <backup-file>.sql.gz | \
  docker compose -f docker/docker-compose.yml exec -T db \
  psql -U coop -d coop
```

Use the real path you chose in the destructive-warning section, e.g.:

```bash
gunzip -c "$BACKUP_DIR/coop-20260629-161827.sql.gz" | \
  docker compose -f docker/docker-compose.yml exec -T db \
  psql -U coop -d coop
```

## 4. Re-enable pgvector and reapply the ANN index (if needed)

The dump normally recreates the `vector` extension and the ivfflat ANN index on
its own. Run these anyway — they are idempotent (`IF NOT EXISTS`) and guarantee
the extension and index are present after a restore:

```bash
docker compose -f docker/docker-compose.yml exec db \
  psql -U coop -d coop -c "CREATE EXTENSION IF NOT EXISTS vector;"

docker compose -f docker/docker-compose.yml exec db \
  psql -U coop -d coop -c \
  "CREATE INDEX IF NOT EXISTS embedding_vector_ivfflat ON \"Embedding\" USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);"
```

(The index definition mirrors
`prisma/migrations/20260626131140_embedding_ann_index/migration.sql`.)

## 5. Restart the app

```bash
docker compose -f docker/docker-compose.yml start app
```

## 6. Verify

Hit the health endpoint and confirm `"db": true`:

```bash
curl -s http://localhost:3000/api/health
# expect: {"status":"ok","timestamp":"...","db":true}
```

`/api/health` is allowlisted (no passcode needed). `db:true` means the app
reconnected to the restored database and a trivial `SELECT 1` succeeded. Then
open the app in a browser and spot-check that your data is back.

---

## Drill sign-off

Record the first successful manual drill so the team knows recovery actually
works end to end:

- [ ] Ran steps 1–6 against the prod DB
- [ ] `/api/health` returned `"db": true`
- [ ] Date / operator: ________________________

Until this box is checked, the backup is unproven.
