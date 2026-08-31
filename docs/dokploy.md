# Dokploy

Deploy RelayHorizon as a **Compose** service. The old idle Application has no Git repo or Postgres and should stay unused.

## Create the service

1. Connect GitHub `frankbootmaker/freeresend`.
2. Use `docker-compose.yml`. Default services: `postgres`, `web`, `db-backup`.
3. Do **not** enable the `smtp` or `dev` profiles on first deploy. Public **587/465** stay off until you deliberately expose SMTP submission.
4. Attach the public hostname with Let's Encrypt to **`web:3000`**.
5. Keep `postgres` on the Compose project network only. Do not attach it to a shared Dokploy or Traefik network (duplicate DNS aliases break auth).
6. If compose fails on `env_file`, delete the `env_file` blocks — Dokploy injects env in the UI. Those blocks are `required: false` so a missing `.env.local` is fine.

See [docker.md](docker.md) for service roles.

## Environment

Set these in the Dokploy compose environment (used both for interpolation and the containers). Do not copy `.env.local` defaults into production.

| Variable | Production |
| --- | --- |
| `NEXTAUTH_URL` | Public HTTPS origin, no trailing slash |
| `NEXTAUTH_SECRET` | Long random string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First platform admin (`POST /api/setup`) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | URL-safe password; must match across `postgres`, `web`, and `db-backup` |
| `SKIP_DNS_VERIFICATION` | **Unset** |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Required if egress is SES |
| `CRON_SECRET` | Required for `POST /api/cron/ops` |
| `DATABASE_SSL` | `false` for the bundled Postgres |

`web` overrides `DATABASE_URL` to `postgres:5432` so a host-oriented URL in another env file cannot leak into the container.

Postgres is bound to `127.0.0.1:5436` on the VPS. Remove the postgres `ports` block if you want no host mapping.

## First boot

1. Deploy and wait until `postgres` is healthy, then `web`.
2. `POST https://<host>/api/setup` once. Store `mcpToken` if the response includes it.
3. Sign in at `/portal` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. **Configuration** — SES credentials or the platform SMTP relay.
5. **Health** — database, SES/SMTP, and backup sidecar heartbeat.
6. Provision one customer, publish MX/SPF/DKIM/DMARC, send a test.

Fresh volume: schema comes from `database.sql`. Existing database: apply every `database-migrate-*.sql` (all `IF NOT EXISTS`).

## After the first send

- Confirm **Health** shows a backup heartbeat (`relayhorizon_backups` is mounted on `web` and `db-backup`).
- Schedule `POST /api/cron/ops` with header `x-cron-secret: $CRON_SECRET` (hourly is enough). This rotates logs and pushes pending offsite dumps. See [operations.md](operations.md).
- For SES egress, subscribe SNS to `POST https://<host>/api/webhooks/ses` and confirm the subscription. Bounce and complaint status will not update until that is wired. The handler currently logs `SubscriptionConfirmation` and does not fetch `SubscribeURL` for you — confirm in the AWS console.
- Optional S3 offsite: Portal → Backups.

## SMTP submission later

The `smtp` profile builds the submission listener (2525 plus 587/465). Leave it off until you are ready to publish those ports and finish TLS in Portal → Configuration. HTTPS API sending does not need that profile.

## Checks

```bash
curl -fsS https://<host>/api/health
# {"status":"healthy","service":"RelayHorizon","database":"ok",...}
```

`GET /api/health` pings Postgres and returns **503** when the database is down. Portal **Health** (`GET /api/admin/health`) remains the authenticated deep check.
