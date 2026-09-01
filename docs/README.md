# RelayHorizon docs

Multi-tenant **outbound** email platform (fork of [eibrahim/freeresend](https://github.com/eibrahim/freeresend)), branded **RelayHorizon** by Nethorizon. Incoming mailboxes and MX are out of scope.

SMTP username `relayhorizon`, DKIM selector `relayhorizon`, SES configuration set `relayhorizon-prod`. API keys still use the `frs_` prefix.

## Read in this order

1. [Progress summary](progress-summary.md) — what is built as of 1 September 2026
2. [Architecture](architecture.md)
3. [Tenancy](tenancy.md)
4. [Sending](sending.md)
5. [API](api.md)
6. [MCP](mcp.md)
7. [Docker](docker.md)
8. [Operations](operations.md) — platform logs, dump/restore, S3 offsite
9. [Admin guide](admin-guide.md) — also in the portal **Guide** tab; tenant **Guide** is in the sending console
10. [Security](security.md)
11. [Changelog](../CHANGELOG.md) — console version history (click **v1.9.1** in the top bar)

Dokploy Compose deploy: [dokploy.md](dokploy.md). Public SMTP 587/465 is optional (`smtp` profile) — HTTPS API sending does not need it.
