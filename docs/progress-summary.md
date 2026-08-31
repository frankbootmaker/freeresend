# RelayHorizon — what is built (29 August 2026)

Snapshot of the product as it stands in this repository. **RelayHorizon** is a self-hosted, multi-tenant **outbound** email platform: a fork of [FreeResend](https://github.com/eibrahim/freeresend), branded RelayHorizon by Nethorizon. Incoming mailboxes and inbound MX are out of scope.

The product was previously called OutPost. It was renamed so it is not confused with Authentik Outposts. Compatibility slugs stay as they are: SMTP username `outpost`, default DKIM selector `outpost`, SES configuration-set fallback `outpost-prod`.

This note is a status summary. Operational detail lives in the rest of [docs](README.md).

## Product in one paragraph

Operators provision **tenants** (customers). Each tenant sends mail through a Resend-compatible HTTPS API and/or an SMTP submission listener. Mail leaves via **Amazon SES** or an **SMTP relay**. Sending stays blocked until the domain’s MX, SPF, DKIM, and DMARC records match what RelayHorizon lists. Platform admins work in a **Portal**; tenant users work in a **sending console**.

## Two consoles

| Surface | Who | What it does |
| --- | --- | --- |
| **Portal** (`/portal`) | `users.is_platform_admin` | After login, platform admins land here. **Customers** provisions a tenant (owner, optional domain, API key and MCP token shown once). **Users** adds or revokes other platform administrators. **Agents** issues platform MCP tokens with administrator access. **Configuration** sets installation-level SES, a shared SMTP relay, and alert addresses. |
| **Tenant console** (`/`) | Tenant owner / admin / member | **Sending**, **Domains**, **API Keys**, **Agents**, **Logs**. Tenant agents are scoped to that organization. Platform admins can switch back to the portal. |

UI language: English, German, Hungarian. Theme toggle is in the shell.

## How mail moves

```
App / Resend SDK  -->  POST /api/emails (API key)     \  ingress: https | smtp | both
App / MTA         -->  SMTP :2525 (API key as password) /
                         |
                   quota, tenant status, verified DNS
                         |
          egress: ses  -->  Amazon SES (platform credentials + configuration set)
          egress: smtp -->  tenant smtp_upstream if host is set
                            else platform SMTP relay if enabled
```

- **Ingress** is per tenant. Closed channels return HTTPS `403` or SMTP `535`/`550`.
- **Egress SES** uses platform AWS keys (env fallback, overridable in Portal Configuration). The SES configuration set is applied on send.
- **Egress SMTP** uses the tenant’s own upstream when a host is set. If the tenant chooses SMTP and leaves host empty, RelayHorizon uses the **platform SMTP relay** (Nodemailer client — not the port 2525 listener).
- Bounce MX is published on `outbound.{domain}` so the customer’s existing inbound MX is left alone.

## Platform Configuration

Stored in `platform_settings` (row `id = 'default'`). Env vars remain fallbacks until a value is saved.

- **Amazon SES** — region, configuration set, access key, secret. Used for tenant SES send and domain verification. Secrets are never returned; blank fields on save keep the stored secret.
- **SMTP relay** — enable, host, port, TLS, username, password. Shared outbound client for tenants without their own upstream.
- **Monitoring / alerts** — destination and from address for operational notices (waitlist and similar). Fallback chain: saved value, then `ALERT_EMAIL` / `ADMIN_EMAIL` and `ALERT_FROM` / `FROM_EMAIL`.

Existing databases need `database-migrate-platform-settings.sql` once. New installs get the table from `database.sql`.

## Tenancy and auth

- Tenant, user, membership (`owner` | `admin` | `member`). Email is globally unique; a user may belong to several tenants.
- Self-signup: `POST /api/auth/register`. Admin provision: `POST /api/admin/customers`.
- Dashboard: JWT. Sending API: `frs_…` keys (bcrypt hashed, copy-once in the UI). MCP: `mcp_…` tokens.
- Platform admin header `X-Tenant-Id` or `POST /api/auth/me` with `{ tenantId }` to switch context.
- Suspended tenants cannot send. Domain names are globally unique.

## HTTP API and MCP (iteration 1)

- Auth, tenant routing (`GET`/`PATCH /api/tenant`), domains, API keys, email logs, Resend-compatible `POST /api/emails`.
- Admin: customers plus `GET`/`PATCH /api/admin/settings`.
- MCP JSON-RPC at `/mcp`: `list_tenants` (platform token), `get_tenant_settings`, `get_tenant_traffic`. No write tools yet (`send_email`, `setup_customer`, …).

## What is intentionally not built yet

- Incoming mail / hosting mailboxes.
- Public SMTP submission on port **587** with Let’s Encrypt (listener today is **2525**).
- MCP write tools.
- Bounce/complaint webhook mail to the alert address (avoided so far to prevent noise and loops).

## Local run

Postgres on host port **5436**, app typically `npm run dev` (port 3000 or 3001). `POST /api/setup` creates the platform admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. SMTP submission: `npm run smtp`. Optional MailHog via Compose profile `dev`.

## Related docs

1. [Architecture](architecture.md)
2. [Tenancy](tenancy.md)
3. [Sending](sending.md)
4. [API](api.md)
5. [MCP](mcp.md)
6. [Docker](docker.md)
7. [Admin guide](admin-guide.md)
8. [Security](security.md)
