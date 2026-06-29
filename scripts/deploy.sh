#!/bin/bash
set -euo pipefail
echo "→ pulling latest"
git pull
echo "→ snapshotting prod DB before migrate (safety)"
docker compose -f docker/docker-compose.yml --profile backup run --rm backup || true
echo "→ building prod image"
docker compose -f docker/docker-compose.yml build
echo "→ applying migrations to PROD db"
docker compose -f docker/docker-compose.yml --profile migrate run --rm migrate
echo "→ restarting prod services"
docker compose -f docker/docker-compose.yml up -d
echo "→ status"
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs --tail=30 app
