# Docker

## Services

- `postgres` — loopback **5436** (container 5432) so it does not collide with other local databases; init from `database.sql`
- `web` — loopback **3000**, production Next standalone image (mounts `/backups`); healthcheck hits `/api/health`
- `db-backup` — scheduled `pg_dump -Fc` onto volume `relayhorizon_backups`
- `smtp` — profile `smtp`, submission listener on **2525** (and 587/465 when you publish them)
- `mailhog` — profile `dev`, SMTP 1025, UI 8025

Password and database name come from `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (defaults `freeresend`). Compose interpolates those from a project `.env` or the Dokploy environment — not `.env.local`. Use a URL-safe password and set the same values on `postgres`, `web`, and `db-backup`.

Keep `postgres` on the Compose project network only. Do not attach it to a shared Dokploy/Traefik network (duplicate DNS aliases break auth).

Vercel cannot host the sidecar or `/backups` volume — use the hosted Postgres backup product there. Compose/Dokploy is the supported ops path. See [operations.md](operations.md) and [dokploy.md](dokploy.md).

## Local development (recommended)

```bash
cp .env.local.example .env.local
docker compose up -d postgres
# wait until healthy
npm install
npm run dev
curl -X POST http://localhost:3000/api/setup
```

Open http://localhost:3000 — login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. If the Next app is on **3001**, use that origin instead.

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

Fill `.env.local` (and a project `.env` if you override `POSTGRES_PASSWORD`), then:

```bash
docker compose up --build -d postgres web db-backup
curl -fsS http://127.0.0.1:3000/api/health
```
