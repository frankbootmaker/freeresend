# Docker

## Services

- `postgres` — host **5436** (container 5432) so it does not collide with other local databases; init from `database.sql`
- `web` — 3000, production Next standalone image (mounts `/backups`)
- `db-backup` — scheduled `pg_dump -Fc` onto volume `relayhorizon_backups`
- `smtp` — profile `smtp`, submission listener on **2525**
- `mailhog` — profile `dev`, SMTP 1025, UI 8025

Keep `postgres` on the Compose project network only. Do not attach it to a shared Dokploy/Traefik network (duplicate DNS aliases break auth).

Vercel cannot host the sidecar or `/backups` volume — use the hosted Postgres backup product there. Compose/Dokploy is the supported ops path. See [operations.md](operations.md).

## Local development (recommended)

```bash
cp .env.local.example .env.local
docker compose up -d postgres
# wait until healthy
npm install
npm run dev
curl -X POST http://localhost:3000/api/setup
```

Open http://localhost:3000 — login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

SMTP sink:

```bash
docker compose --profile dev up -d mailhog
```

Then set the tenant egress switch to SMTP host `localhost` port `1026` (from the host; mapped from MailHog 1025) or `mailhog` / `1025` if the Next app also runs in Compose.

SMTP submission (how apps talk *to* RelayHorizon):

```bash
npm run smtp
```

Username `outpost`, password = API key, port **2525**. Compose: `docker compose --profile smtp up -d smtp`.

## Full Compose web

Fill `.env.local`, then `docker compose up --build web postgres`.
