# Dokploy

Deploy RelayHorizon as a **Compose** service (not an Application). Create a new project, then add one Compose service.

## Create the service

1. Connect GitHub `frankbootmaker/relayhorizon` (`main` for production, `development` for the development instance).
2. Use `docker-compose.yml`. Default services: `postgres`, `web`, `db-backup`.
3. Do **not** enable the `smtp` or `dev` profiles on first deploy. Public **587/465** stay off until you deliberately expose SMTP submission.
4. Attach the public hostname with Let's Encrypt to **`web:3000`** (container port). Host publish is **3001** (`WEB_HOST_PORT`) so it does not collide with other stacks on 3000. Traefik must use **3000**, not the host publish port. `web` builds the `production` stage (`node server.js`); do not leave the image target unset or Compose will not serve HTTP.
5. Keep `postgres` on the Compose project network only. Do not attach it to a shared Dokploy or Traefik network (duplicate DNS aliases break auth).
6. If compose fails on `env_file`, delete the `env_file` blocks — Dokploy injects env in the UI. Those blocks are `required: false` so a missing `.env.local` is fine.

See [docker.md](docker.md) for service roles.

## Environment

Set these in the Dokploy compose environment. Compose writes them to `.env` (interpolation) and `web` loads that file so Next.js sees `ADMIN_*`, `NEXTAUTH_*`, and SES keys. Do not copy `.env.local` defaults into production.

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
| `WEB_HOST_PORT` | Host bind for `web` (default **3001**). Leave at 3001 when 3000 is already taken. Traefik still uses container **3000**. |

`web` overrides `DATABASE_URL` to `postgres:5432` so a host-oriented URL in another env file cannot leak into the container.

Postgres is bound to `127.0.0.1:5436` on the VPS. Remove the postgres `ports` block if you want no host mapping.

## First boot

1. Deploy and wait until `postgres` is healthy, then `web`.
2. `POST https://<host>/api/setup` once (again after you change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in Dokploy). Store `mcpToken` if the response includes it. Env vars do not become the login until this runs.
3. Sign in at `/portal` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Do not wrap the values in quotes in the Compose environment.
4. **Configuration** — **System domain** (use the current web host, publish DNS, set `noreply@…`), then SES credentials or the platform SMTP relay. Optional **OIDC** (Authentik or another IdP): paste issuer/client credentials, callback URL `/api/auth/oidc/callback`, and an optional sign-in button label. Enable JIT only if a first IdP sign-in should create a local user.
5. **Health** — database, SES/SMTP, and backup sidecar heartbeat.
6. Provision one customer, publish MX/SPF/DKIM/DMARC, send a test.

Fresh volume: schema comes from `database.sql`. Existing database: apply every `database-migrate-*.sql` (all `IF NOT EXISTS`), including `database-migrate-oidc.sql`, `database-migrate-oidc-button-label.sql`, `database-migrate-user-profile.sql`, `database-migrate-password-reset.sql`, `database-migrate-user-locale.sql`, `database-migrate-accepted-terms.sql`, `database-migrate-sending-caps.sql`, `database-migrate-sending-tier.sql`, and `database-migrate-sending-freeze.sql`.

## After the first send

- Confirm **Health** shows a backup heartbeat (`relayhorizon_backups` is mounted on `web` and `db-backup`).
- Schedule `POST /api/cron/ops` with header `x-cron-secret: $CRON_SECRET` (hourly is enough). This rotates logs and pushes pending offsite dumps. See [operations.md](operations.md).
- For SES egress, subscribe SNS to `POST https://<host>/api/webhooks/ses` and confirm the subscription. Bounce and complaint status will not update until that is wired. The handler currently logs `SubscriptionConfirmation` and does not fetch `SubscribeURL` for you — confirm in the AWS console.
- Optional S3 offsite: Portal → Backups.

## SMTP submission later

The `smtp` profile builds the submission listener. Leave it off until you are ready to publish ports and finish inbound TLS in Portal → Configuration. HTTPS API sending does not need that profile.

Dokploy must start Compose with `--profile smtp` (the default command does not). The process listens on `0.0.0.0` inside the container; Docker then publishes:

- **2525** as `127.0.0.1:2525` — VPS localhost only
- **587** on all interfaces — public STARTTLS submission
- **465** on all interfaces — implicit TLS, only if Configuration includes 465

Traefik fronts HTTPS on the hostname, not SMTP. Open **587** (and **465** if you enable it) on the VPS firewall. Clients use the public host, port 587, username `relayhorizon`, password = API key.

## Checks

```bash
curl -fsS https://<host>/api/health
# {"status":"healthy","service":"RelayHorizon","database":"ok",...}
```

`GET /api/health` pings Postgres and returns **503** when the database is down. Portal **Health** (`GET /api/admin/health`) remains the authenticated deep check.
