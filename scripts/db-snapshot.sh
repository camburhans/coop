#!/bin/bash
set -euo pipefail

# The shell does not auto-load .env the way Next.js/Prisma do, so the snapshot
# habit (run via `pnpm db:snapshot`) needs to load it explicitly. If
# DATABASE_URL is already exported in the environment, that takes precedence.
if [[ -z "${DATABASE_URL:-}" && -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set and no .env found — aborting." >&2
  exit 1
fi

# Locate pg_dump. It may be on PATH, or installed keg-only via Homebrew's libpq
# (not symlinked into the global prefix). Check the common keg locations so the
# snapshot habit works without a global PATH change.
PG_DUMP_BIN=""
for cand in pg_dump \
  /opt/homebrew/opt/libpq/bin/pg_dump \
  /usr/local/opt/libpq/bin/pg_dump; do
  if command -v "$cand" >/dev/null 2>&1; then
    PG_DUMP_BIN="$cand"
    break
  fi
done

if [[ -z "$PG_DUMP_BIN" ]]; then
  echo "pg_dump not found on PATH or in the libpq keg." >&2
  echo "Install the Postgres client tools, e.g.: brew install libpq" >&2
  echo "(checked PATH, /opt/homebrew/opt/libpq/bin, /usr/local/opt/libpq/bin)" >&2
  exit 1
fi

mkdir -p ./snapshots
TS=$(date +%Y%m%d-%H%M%S)
OUT="./snapshots/snap-$TS.sql.gz"
echo "snapshotting current DATABASE_URL → $OUT (using $PG_DUMP_BIN)"

# Never leave a partial/empty .sql.gz behind: if the dump fails, remove the
# half-written file so a broken snapshot can't masquerade as a real backup.
if ! "$PG_DUMP_BIN" "$DATABASE_URL" | gzip > "$OUT"; then
  echo "pg_dump failed — removing partial file $OUT" >&2
  rm -f "$OUT"
  exit 1
fi

echo "done: $(du -h "$OUT" | cut -f1)"
