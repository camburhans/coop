# =============================================================================
# Backup container for the PROD Postgres database.
#
# Based on postgres:16-alpine purely to get a `pg_dump` whose MAJOR version
# matches the prod server (pgvector/pgvector:pg16 → Postgres 16). A pg_dump
# older than the server refuses to run; matching the major version avoids that.
#
# This image is NOT a long-lived service. It runs one backup and exits (see the
# `backup` profile + launchd job). bash + tzdata are added so backup.sh can use
# bash features and the container can resolve a human-local TZ for timestamps.
# =============================================================================
FROM postgres:16-alpine

RUN apk add --no-cache bash tzdata

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

CMD ["/backup.sh"]
