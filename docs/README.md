# RelayHorizon docs

Multi-tenant **outbound** email platform (fork of [eibrahim/freeresend](https://github.com/eibrahim/freeresend)), branded **RelayHorizon** by Nethorizon. Incoming mailboxes and MX are out of scope.

SMTP username `relayhorizon`, DKIM selector `relayhorizon`, SES configuration set `relayhorizon-prod`. API keys still use the `frs_` prefix.

## Read in this order

1. [Progress summary](progress-summary.md) — what is built as of 4 September 2026 (**v1.9.3**)
2. [Commercial operations plan](commercialize-plan.md) — policy A is live; billing, plans, and CMS remain planning
3. [Architecture](architecture.md)
4. [Tenancy](tenancy.md)
5. [Sending](sending.md)
6. [API](api.md)
7. [MCP](mcp.md)
8. [Docker](docker.md)
9. [Operations](operations.md) — platform logs, dump/restore, S3 offsite
10. [Admin guide](admin-guide.md) — also in the portal **Guide** tab; tenant **Guide** is in the sending console
11. [Security](security.md)
12. [Changelog](../CHANGELOG.md) — console version history (click **v1.9.3** in the top bar)

Dokploy Compose deploy: [dokploy.md](dokploy.md). Public SMTP 587/465 is optional (`smtp` profile) — HTTPS API sending does not need it.
