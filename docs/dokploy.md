# Dokploy

The existing Dokploy **Application** for FreeResend is idle and has no Git repo or Postgres. Iteration 1 should deploy as a **Compose** service:

1. Connect GitHub `frankbootmaker/freeresend`
2. Use `docker-compose.yml` (`web` + `postgres`)
3. Set env from `.env.local.example` (strong `NEXTAUTH_SECRET`, real `ADMIN_*`)
4. Attach a domain with Let's Encrypt on `web:3000`
5. Do not publish 587/465 until the SMTP submission gateway exists

See [docker.md](docker.md) for service roles.
