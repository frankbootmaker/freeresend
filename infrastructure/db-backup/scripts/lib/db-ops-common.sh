# Shared helpers for DB backup scripts.
# shellcheck shell=bash

db_ops_fix_backup_perms() {
  local dir="${1:-${BACKUP_DIR:-}}"
  local uid="${BACKUP_UID:-1001}"
  local gid="${BACKUP_GID:-1001}"
  if [[ -z "$dir" ]]; then
    return 0
  fi
  mkdir -p "$dir"
  if [[ "$(id -u)" == "0" ]]; then
    chown -R "${uid}:${gid}" "$dir" 2>/dev/null || true
  fi
}

db_ops_json_str() {
  local s="${1:-}"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  printf '"%s"' "$s"
}

db_ops_stamp_write() {
  local stamp_path="$1"
  local kind="$2"
  local artifact="${3:-}"
  local schema_version="${4:-}"
  mkdir -p "$(dirname "$stamp_path")"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  {
    printf '{\n'
    printf '  "kind": %s,\n' "$(db_ops_json_str "$kind")"
    printf '  "at": %s,\n' "$(db_ops_json_str "$ts")"
    printf '  "artifact": %s,\n' "$(db_ops_json_str "$artifact")"
    printf '  "schemaVersion": %s,\n' "$(db_ops_json_str "$schema_version")"
    printf '  "hostname": %s\n' "$(db_ops_json_str "$(hostname 2>/dev/null || echo unknown)")"
    printf '}\n'
  } >"$stamp_path"
  echo "Wrote stamp ${stamp_path}"
}

db_ops_load_schedule() {
  local backup_dir="${1:-${BACKUP_DIR:-/backups}}"
  local file="${backup_dir}/schedule.json"
  local enabled="${BACKUP_ENABLED:-true}"
  local interval="${BACKUP_INTERVAL_SECONDS:-86400}"
  local source="env"

  if [[ -f "$file" ]]; then
    local raw
    raw="$(tr -d '\n' <"$file" 2>/dev/null || true)"
    if [[ -n "$raw" ]]; then
      local parsed_enabled parsed_interval
      parsed_enabled="$(printf '%s' "$raw" | sed -n 's/.*"enabled"[[:space:]]*:[[:space:]]*\(true\|false\).*/\1/p' | head -n1)"
      parsed_interval="$(printf '%s' "$raw" | sed -n 's/.*"intervalSeconds"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n1)"
      if [[ "$parsed_enabled" == "true" || "$parsed_enabled" == "false" ]]; then
        enabled="$parsed_enabled"
        source="file"
      fi
      if [[ -n "$parsed_interval" ]]; then
        interval="$parsed_interval"
        source="file"
      fi
    fi
  fi

  if [[ "$interval" -lt 60 ]]; then
    interval=60
  fi

  SCHEDULE_ENABLED="$enabled"
  SCHEDULE_INTERVAL="$interval"
  SCHEDULE_SOURCE="$source"
}
