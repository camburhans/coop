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

mkdir -p ./snapshots
TS=$(date +%Y%m%d-%H%M%S)
echo "snapshotting current DATABASE_URL → ./snapshots/snap-$TS.sql.gz"
pg_dump "$DATABASE_URL" | gzip > "./snapshots/snap-$TS.sql.gz"
echo "done: $(du -h ./snapshots/snap-$TS.sql.gz | cut -f1)"
