# RelayHorizon docs

Multi-tenant **outbound** email platform (fork of [eibrahim/freeresend](https://github.com/eibrahim/freeresend)), branded **RelayHorizon** by Nethorizon. Incoming mailboxes and MX are out of scope.

The product was previously called OutPost. It was renamed to avoid colliding with Authentik Outposts. Compatibility slugs (`outpost` SMTP username, DKIM selector, `outpost-prod` SES configuration set) stay as they are.

## Read in this order

1. [Progress summary](progress-summary.md) — what is built as of 29 August 2026
2. [Architecture](architecture.md)
3. [Tenancy](tenancy.md)
4. [Sending](sending.md)
5. [API](api.md)
6. [MCP](mcp.md)
7. [Docker](docker.md)
8. [Operations](operations.md) — platform logs, dump/restore, S3 offsite
9. [Admin guide](admin-guide.md)
10. [Security](security.md)

Dokploy Compose deploy: [dokploy.md](dokploy.md). Public SMTP 587/465 is optional (`smtp` profile) — HTTPS API sending does not need it.
