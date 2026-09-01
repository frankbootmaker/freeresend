#!/usr/bin/env bash
# Postgres custom-format dump for RelayHorizon.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/db-ops-common.sh
source "${SCRIPT_DIR}/lib/db-ops-common.sh"

ROOT_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups}"
STAMP_PATH="${BACKUP_STAMP_PATH:-${BACKUP_DIR}/last-success.json}"
RUN_ROTATE="${BACKUP_RUN_ROTATE:-1}"

OUT="${1:-}"
if [[ -z "$OUT" ]]; then
  mkdir -p "$BACKUP_DIR"
  OUT="${BACKUP_DIR}/relayhorizon-$(date -u +%Y%m%dT%H%M%SZ).dump"
else
  mkdir -p "$(dirname "$OUT")"
fi

dump_via_host() {
  local db="${POSTGRES_DB:-relayhorizon}"
  local user="${POSTGRES_USER:-relayhorizon}"
  local host="${POSTGRES_HOST}"
  local port="${POSTGRES_PORT:-5432}"
  echo "Dumping ${user}@${host}:${port}/${db} → ${OUT}"
  PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump \
    -h "$host" -p "$port" -U "$user" -d "$db" -Fc --no-owner --no-acl \
    >"$OUT"
}

dump_via_url() {
  if ! command -v pg_dump >/dev/null 2>&1; then
    echo "pg_dump not found on PATH." >&2
    exit 1
  fi
  echo "Dumping DATABASE_URL → ${OUT}"
  pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl >"$OUT"
}

if [[ -n "${POSTGRES_HOST:-}" ]]; then
  dump_via_host
elif [[ -n "${DATABASE_URL:-}" ]]; then
  dump_via_url
else
  echo "Set DATABASE_URL or POSTGRES_HOST (+ POSTGRES_*)." >&2
  exit 1
fi

if [[ ! -s "$OUT" ]]; then
  echo "Dump file is empty: ${OUT}" >&2
  exit 1
fi

echo "Wrote ${OUT} ($(wc -c <"$OUT" | tr -d ' ') bytes)"
db_ops_stamp_write "$STAMP_PATH" "backup" "$(basename "$OUT")" "relayhorizon"
db_ops_fix_backup_perms "$BACKUP_DIR"
ln -sfn "$(basename "$OUT")" "${BACKUP_DIR}/latest.dump" 2>/dev/null || true

if [[ "$RUN_ROTATE" == "1" ]]; then
  BACKUP_DIR="$BACKUP_DIR" "${SCRIPT_DIR}/rotate-backups.sh" || {
    echo "Warning: retention rotation failed (dump still kept)." >&2
  }
fi
