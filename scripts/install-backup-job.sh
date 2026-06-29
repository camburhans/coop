#!/bin/bash
# =============================================================================
# install-backup-job.sh — install the nightly prod-backup launchd job.
#
# Generates ~/Library/LaunchAgents/com.coop.backup.plist, which runs every
# night at 02:30 local time:
#
#     cd <repo>/docker && docker compose --profile backup run --rm backup
#
# then (re)loads it with launchctl and prints the next scheduled run.
#
# This is the production scheduler for Architecture §8, layer 1 (nightly
# pg_dump). It is a HOST-level launchd job, NOT a long-lived container — the
# backup service itself is gated behind the compose `backup` profile and exits
# after each run. (See operating-model.md: launchd is explicitly avoided for the
# always-on app; it is, however, the right tool for a periodic cron-like job.)
#
# Run it once on the Mac mini:
#     ./scripts/install-backup-job.sh
# =============================================================================
set -euo pipefail

LABEL="com.coop.backup"
RUN_HOUR=2
RUN_MIN=30

# --- Resolve absolute repo root (this script lives in <repo>/scripts) --------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$REPO/docker"

if [[ ! -f "$DOCKER_DIR/docker-compose.yml" ]]; then
  echo "ERROR: $DOCKER_DIR/docker-compose.yml not found — is this the repo?" >&2
  exit 1
fi

# --- Locate the docker binary (launchd has a minimal PATH) -------------------
DOCKER_BIN="$(command -v docker || true)"
if [[ -z "$DOCKER_BIN" ]]; then
  echo "ERROR: 'docker' not found on PATH. Start Docker Desktop / install docker first." >&2
  exit 1
fi
DOCKER_PATH_DIR="$(dirname "$DOCKER_BIN")"

PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/$LABEL.log"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"

# The actual work, run via bash -lc so PATH includes the docker dir. We cd into
# the docker dir and use the relative compose file so the compose project is
# `coop-prod` (matches `name:` in docker-compose.yml) regardless of cwd.
RUN_CMD="cd '$DOCKER_DIR' && exec docker compose --profile backup run --rm backup"

echo "→ writing $PLIST"
cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>

    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-lc</string>
        <string>$RUN_CMD</string>
    </array>

    <!-- Nightly at $(printf '%02d:%02d' "$RUN_HOUR" "$RUN_MIN") local time. -->
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>$RUN_HOUR</integer>
        <key>Minute</key>
        <integer>$RUN_MIN</integer>
    </dict>

    <!-- Ensure the docker CLI is reachable under launchd's minimal PATH. -->
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$DOCKER_PATH_DIR:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>

    <key>WorkingDirectory</key>
    <string>$DOCKER_DIR</string>

    <key>RunAtLoad</key>
    <false/>

    <key>StandardOutPath</key>
    <string>$LOG</string>
    <key>StandardErrorPath</key>
    <string>$LOG</string>
</dict>
</plist>
PLIST_EOF

# --- (Re)load the job --------------------------------------------------------
# Unload any prior version first so edits take effect; ignore errors if it was
# never loaded.
echo "→ (re)loading launchd job"
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load -w "$PLIST"

# --- Compute the next scheduled run ------------------------------------------
# If it's still before HH:MM today, the next run is today; otherwise tomorrow.
now_h=$(date +%H)
now_m=$(date +%M)
now_min=$((10#$now_h * 60 + 10#$now_m))
target_min=$((RUN_HOUR * 60 + RUN_MIN))
if (( now_min < target_min )); then
  NEXT="$(date -v${RUN_HOUR}H -v${RUN_MIN}M -v0S '+%a %Y-%m-%d %H:%M %Z')"
else
  NEXT="$(date -v+1d -v${RUN_HOUR}H -v${RUN_MIN}M -v0S '+%a %Y-%m-%d %H:%M %Z')"
fi

echo
echo "✓ Installed launchd job '$LABEL'."
echo "  plist:        $PLIST"
echo "  command:      $RUN_CMD"
echo "  log:          $LOG"
echo "  schedule:     nightly at $(printf '%02d:%02d' "$RUN_HOUR" "$RUN_MIN") local"
echo "  NEXT RUN:     $NEXT"
echo
echo "Verify it is registered with:"
echo "  launchctl list | grep $LABEL"
echo "Trigger a run right now (does not affect the schedule) with:"
echo "  launchctl start $LABEL    # then tail $LOG"
