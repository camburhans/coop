#!/bin/bash
set -euo pipefail
TS=$(date +%Y%m%d-%H%M%S)
DEST="/backups"
mkdir -p "$DEST"
echo "[$(date)] starting backup → $DEST/coop-$TS.sql.gz"
PGPASSWORD="$DB_PASSWORD" pg_dump -h db -U coop -d coop \
  | gzip > "$DEST/coop-$TS.sql.gz"
echo "[$(date)] backup complete: $(du -h "$DEST/coop-$TS.sql.gz" | cut -f1)"

# Rotation: keep last 14 dailies + last 12 monthlies
find "$DEST" -name "coop-*.sql.gz" -mtime +14 \
  ! -name "coop-*01-*.sql.gz" -delete
find "$DEST" -name "coop-*01-*.sql.gz" -mtime +365 -delete

echo "[$(date)] rotation complete"
