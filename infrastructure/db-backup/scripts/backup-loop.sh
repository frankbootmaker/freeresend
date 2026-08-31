#!/usr/bin/env bash
# Long-running scheduler for Compose/Dokploy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/db-ops-common.sh
source "${SCRIPT_DIR}/lib/db-ops-common.sh"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RUN_ON_START="${BACKUP_RUN_ON_START:-1}"
POLL_SECONDS=60
HEARTBEAT_FILE="${BACKUP_DIR}/scheduler-heartbeat.json"

db_ops_fix_backup_perms "$BACKUP_DIR"

write_heartbeat() {
  local status="${1:-idle}"
  local detail="${2:-}"
  db_ops_stamp_write "$HEARTBEAT_FILE" "scheduler_heartbeat" "$status" "$detail"
  db_ops_fix_backup_perms "$BACKUP_DIR"
}

seconds_since_success() {
  local stamp="${BACKUP_DIR}/last-success.json"
  if [[ ! -f "$stamp" ]]; then
    echo ""
    return 0
  fi
  local then_epoch now_epoch
  then_epoch="$(stat -c %Y "$stamp" 2>/dev/null || true)"
  now_epoch="$(date -u +%s)"
  if [[ -z "$then_epoch" || ! "$then_epoch" =~ ^[0-9]+$ ]]; then
    echo ""
    return 0
  fi
  echo $((now_epoch - then_epoch))
}

run_once() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting scheduled backup…"
  write_heartbeat "running" "backup_in_progress"
  if BACKUP_DIR="$BACKUP_DIR" BACKUP_RUN_ROTATE=1 \
    "${SCRIPT_DIR}/backup-db.sh"; then
    db_ops_fix_backup_perms "$BACKUP_DIR"
    write_heartbeat "ok" "last_cycle_ok"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup cycle done"
    return 0
  fi
  db_ops_stamp_write "${BACKUP_DIR}/last-failure.json" "backup_failure" "" "unknown"
  db_ops_fix_backup_perms "$BACKUP_DIR"
  write_heartbeat "error" "last_cycle_failed"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup cycle failed" >&2
  return 1
}

if [[ -n "${POSTGRES_HOST:-}" ]]; then
  echo "Waiting for Postgres at ${POSTGRES_HOST}:${POSTGRES_PORT:-5432}…"
  for _ in $(seq 1 60); do
    if PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_isready \
      -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" \
      -U "${POSTGRES_USER:-freeresend}" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

write_heartbeat "starting" "boot"
db_ops_load_schedule "$BACKUP_DIR"
if [[ "$RUN_ON_START" == "1" ]]; then
  if [[ "$SCHEDULE_ENABLED" == "true" || "$SCHEDULE_ENABLED" == "1" ]]; then
    run_once || echo "Initial backup failed; will retry when due." >&2
  else
    echo "Scheduled backups disabled (${SCHEDULE_SOURCE}); skipping run-on-start."
    write_heartbeat "disabled" "$SCHEDULE_SOURCE"
  fi
fi

while true; do
  db_ops_load_schedule "$BACKUP_DIR"

  if [[ "$SCHEDULE_ENABLED" != "true" && "$SCHEDULE_ENABLED" != "1" ]]; then
    write_heartbeat "disabled" "$SCHEDULE_SOURCE"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backups disabled; polling every ${POLL_SECONDS}s"
    sleep "$POLL_SECONDS"
    continue
  fi

  age="$(seconds_since_success)"
  due=0
  if [[ -z "$age" ]]; then
    due=1
  elif [[ "$age" -ge "$SCHEDULE_INTERVAL" ]]; then
    due=1
  else
    remaining=$((SCHEDULE_INTERVAL - age))
    write_heartbeat "waiting" "next_in_${remaining}s"
  fi

  if [[ "$due" == "1" ]]; then
    run_once || echo "Scheduled backup failed; will retry after next poll." >&2
  fi

  sleep "$POLL_SECONDS"
done
