#!/bin/sh
# Apply idempotent database-migrate-*.sql files, then start Next.js.
# Fresh volumes already ran database.sql; existing Dokploy volumes need these.
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required before applying migrations" >&2
  exit 1
fi

i=0
while [ "$i" -lt 20 ]; do
  if psql "$DATABASE_URL" -q -c 'SELECT 1' >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

if ! psql "$DATABASE_URL" -q -c 'SELECT 1' >/dev/null 2>&1; then
  echo "Postgres did not accept connections" >&2
  exit 1
fi

for file in /app/migrations/database-migrate-*.sql; do
  if [ ! -f "$file" ]; then
    continue
  fi
  echo "Applying $(basename "$file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done

exec node server.js
