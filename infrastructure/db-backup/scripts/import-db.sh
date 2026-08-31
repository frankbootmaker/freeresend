#!/usr/bin/env bash
# Destructive restore. Requires CONFIRM_IMPORT=REPLACE.
set -euo pipefail

DUMP="${1:-}"
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: CONFIRM_IMPORT=REPLACE $0 /backups/relayhorizon-….dump" >&2
  exit 1
fi
if [[ "${CONFIRM_IMPORT:-}" != "REPLACE" ]]; then
  echo "Refusing import without CONFIRM_IMPORT=REPLACE" >&2
  exit 1
fi

host="${POSTGRES_HOST:-localhost}"
port="${POSTGRES_PORT:-5432}"
user="${POSTGRES_USER:-freeresend}"
db="${POSTGRES_DB:-freeresend}"

echo "Terminating other sessions…"
PGPASSWORD="${POSTGRES_PASSWORD:-}" psql -h "$host" -p "$port" -U "$user" -d "$db" \
  -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();"

echo "Wiping public schema…"
PGPASSWORD="${POSTGRES_PASSWORD:-}" psql -h "$host" -p "$port" -U "$user" -d "$db" \
  -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restoring ${DUMP}…"
PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_restore \
  -h "$host" -p "$port" -U "$user" -d "$db" \
  --no-owner --no-acl "$DUMP"

echo "Restore complete. Restart the web process so pools recover."
