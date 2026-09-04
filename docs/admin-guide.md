# Admin guide

The same walkthrough is in the portal **Guide** tab. Tenant operators use **Guide** in the sending console.

1. Start Postgres and the app ([docker.md](docker.md)).
2. `POST /api/setup` once. If the response includes `mcpToken`, store that platform MCP token immediately.
3. Log in as the platform admin (email/password, **Forgot password?** on the sign-in page, or the OIDC button after you enable it — label defaults to **Continue with Authentik** unless you set one under Configuration → OIDC). The same **Sign in** page serves portal admins and tenant members: admins land on `/portal`, everyone else on the tenant console. The header profile menu can change your display name and optional picture. Password-reset, waitlist, and configuration-test mail follow the recipient’s last website locale (EN, DE, or HU).
4. **Customers** — create an organization, owner email/password, optional domain. Copy the API key and MCP token immediately. **Open tenant** to work in that customer’s sending console. **Manage** opens a panel to rename the organization or delete the tenant (the slug stays; the platform tenant cannot be deleted). Tenant owners can also erase their own organization from the console **Organization** tab (two-step confirmation). Sending ingress/egress is edited in the tenant console, not here. Long lists page at 25 rows by default; choose 5, 10, 25, or 50.
5. **Users** (portal) — add or promote people who can open `/portal`. Revoke and Delete cannot target yourself or the last administrator. Revoke only clears portal access; Delete removes the account. Existing customer owners can be granted portal access without creating a second account. Same page sizes as Customers.
6. **Agents** (portal) — create platform MCP tokens that act as an administrator. Tenant console **Agents** issues tokens scoped to that organization only. Copy the token once and point an MCP client at `/mcp`. See [mcp.md](mcp.md).
7. **Logs** (portal) — search delivery across tenants (Apply, not every keystroke), choose 5 / 10 / 25 / 50 rows per page, set retention, export a redacted ops snapshot.
8. **Backups** (portal) — dump/restore Postgres, schedule the sidecar, optional S3-compatible offsite. See [operations.md](operations.md).
9. **Configuration** (portal) — **System domain** (attach the web host or another sending domain, publish DNS, set the programmatic From), SES, optional platform SMTP relay, inbound SMTP TLS (needed before remote clients will accept STARTTLS on 587), alert from/to, and **OIDC**. For Authentik: create an OAuth2/OIDC application, paste the issuer, client ID, and secret, and copy the callback URL shown in the form (`/api/auth/oidc/callback`). Optional **sign-in button label** overrides the default “Continue with Authentik” text. **JIT accounts** creates a local user on first successful sign-in (platform tenant membership). Leave JIT off if only people you already created in **Users** should get in. An optional administrator group grants `is_platform_admin`. Existing databases need `database-migrate-oidc.sql`, `database-migrate-oidc-button-label.sql`, `database-migrate-password-reset.sql`, and `database-migrate-user-locale.sql` once.
10. **Sending** (tenant console) — choose ingress (HTTPS, SMTP, or both) and egress (AWS SES or upstream SMTP). The tab only shows fields for the channels you pick. TLS for the upstream relay is on SMTP egress. Leave SMTP host empty to use the platform relay when it is enabled. The Resend base URL is `https://<host>/api` (not `/api/emails`).
11. **Domains** — add the sending domain, publish MX/SPF/DKIM/DMARC exactly as listed, then **Check records**. Sending stays blocked until they match (unless `SKIP_DNS_VERIFICATION=true` locally). Delete sits in the domain toolbar.
12. **API keys** — the table shows label, domain, prefix, scope, and last used. Any tenant member can delete a key, including the provisioned default. Copy a new secret once.
13. Send a test with curl, the Resend SDK (`RESEND_BASE_URL=https://<host>/api` locally `http://localhost:3001/api`), or SMTP. Local `npm run smtp` listens on **2525**. On Compose/Dokploy, remote clients use the public host on **587**. The `smtp` profile must be running (`docker compose --profile smtp`), and the VPS firewall must allow 587 — Traefik does not proxy SMTP.
14. Ask an AI to call `/mcp` with a platform or tenant agent token. Platform tokens can also provision customers and read health.

## SMTP ports on Compose

The smtp process listens inside the container on `0.0.0.0` for whatever **Configuration → SMTP submission** (or `SMTP_LISTEN_PORTS`, default `2525,587`) enables. Docker then decides what the host exposes:

| Host publish | Reachable from |
| --- | --- |
| `127.0.0.1:2525:2525` | The VPS only (localhost). Remote mail clients time out. |
| `587:587` | All interfaces. This is the public submission port. |
| `465:465` | All interfaces, but silent unless 465 is in the listen-port list and inbound TLS is configured. |

See [docker.md](docker.md) and [dokploy.md](dokploy.md).
