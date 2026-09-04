# Docker

## Services

- `postgres` — loopback **5436** (container 5432) so it does not collide with other local databases; init from `database.sql`
- `web` — container **3000**, published on loopback **3001** (`WEB_HOST_PORT`) so it does not collide with other stacks; healthcheck hits `/api/health`
- `db-backup` — scheduled `pg_dump -Fc` onto volume `relayhorizon_backups`
- `smtp` — profile `smtp`. The process listens on `0.0.0.0` for `SMTP_LISTEN_PORTS` (default **2525,587**). Compose publishes **2525** on `127.0.0.1` only, **587** and **465** on all host interfaces. **465** stays silent unless Configuration includes it.
- `mailhog` — profile `dev`, SMTP 1025, UI 8025

Password and database name come from `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (defaults `relayhorizon`). Compose interpolates those from a project `.env` or the Dokploy environment — not `.env.local`. Use a URL-safe password in production and set the same values on `postgres`, `web`, and `db-backup`.

Keep `postgres` on the Compose project network only. Do not attach it to a shared Dokploy/Traefik network (duplicate DNS aliases break auth).

Vercel cannot host the sidecar or `/backups` volume — use the hosted Postgres backup product there. Compose/Dokploy is the supported ops path. See [operations.md](operations.md) and [dokploy.md](dokploy.md).

## Local development (recommended)

```bash
cp .env.local.example .env.local
docker compose up -d postgres
# wait until healthy
npm install
npm run dev
curl -X POST http://localhost:3001/api/setup
```

Open http://localhost:3001 — login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Compose publishes **3001→3000**; Next still listens on **3000** inside the container. Dokploy Traefik should target **`web:3000`**.

SMTP sink:

```bash
docker compose --profile dev up -d mailhog
```

Then set the tenant egress switch to SMTP host `localhost` port `1026` (from the host; mapped from MailHog 1025) or `mailhog` / `1025` if the Next app also runs in Compose.

SMTP submission (how apps talk *to* RelayHorizon):

```bash
npm run smtp
```

Username `relayhorizon`, password = API key. Local `npm run smtp` defaults to **2525**. Compose: `docker compose --profile smtp up -d smtp` — remote clients use **587**; **2525** is `127.0.0.1` only.

## Full Compose web

Fill `.env.local` (and a project `.env` if you override `POSTGRES_PASSWORD`), then:

```bash
docker compose up --build -d postgres web db-backup
curl -fsS http://127.0.0.1:3000/api/health
```
