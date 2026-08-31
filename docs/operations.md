# Operations: logs and backups

## Logs

Portal **Logs** searches `email_logs` across tenants. Retention (keep days / strip bodies) is stored on `platform_settings`. **Rotate now** or `POST /api/cron/ops` with `x-cron-secret` runs purge and strip.

On Dokploy, set `CRON_SECRET` and schedule an hourly HTTPS POST to `/api/cron/ops` with header `x-cron-secret`. Without cron, use Portal → Logs → Rotate now. Offsite dump push runs on the same endpoint.

`GET /api/admin/logs/ops-export?days=7` downloads a redacted JSON snapshot (health, failed/bounced/complained rows, backup stamps). Raw `web` / `smtp` stdout stays in Dokploy.

## Backups

Dumps are `pg_dump -Fc` named `relayhorizon-….dump`. They include tenants, API keys, email logs, and `platform_settings` (SES/SMTP/ACME secrets). Treat the volume as confidential. `.env` / Dokploy env is not in the dump.

- Shared volume `relayhorizon_backups` → `/backups` on `web` and `db-backup`
- Sidecar scripts are baked into `infrastructure/db-backup/Dockerfile` (do not bind-mount git)
- Schedule and dump rotation live in `/backups/schedule.json` and `retention.json`
- Portal **Backups** can export, download, delete, and import
- Portal **Health** includes a backup check: fresh dump is OK, missing/stale dump or a missing scheduler heartbeat is a warning, a newer `last-failure` is down

Restore is a full replace. Type `REPLACE` in the portal, or:

```bash
CONFIRM_IMPORT=REPLACE POSTGRES_HOST=postgres POSTGRES_PASSWORD='…' \
  /scripts/import-db.sh /backups/relayhorizon-….dump
```

Restart `web` after a CLI restore so connection pools recover.

## S3 offsite

Optional. Configure endpoint, bucket, and keys in Portal → Backups (empty/`********` keeps stored secrets). **Test connection** uses `HeadBucket`. Successful portal exports push automatically when offsite is enabled. Cron also pushes dumps that are not yet uploaded.

## Local `npm run dev`

`BACKUP_DIR` defaults to `./backups` (gitignored). Export uses host `pg_dump` or `docker compose -p freeresend exec postgres`. Apply `database-migrate-ops.sql` on existing databases.
