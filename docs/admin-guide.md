# Admin guide

The same walkthrough is in the portal **Guide** tab. Tenant operators use **Guide** in the sending console.

1. Start Postgres and the app ([docker.md](docker.md)).
2. `POST /api/setup` once. If the response includes `mcpToken`, store that platform MCP token immediately.
3. Log in as the platform admin (email/password, **Forgot password?** on the sign-in page, or the OIDC button after you enable it — label defaults to **Continue with Authentik** unless you set one under Configuration → OIDC). The same **Sign in** page serves portal admins and tenant members: admins land on `/portal`, everyone else on the tenant console. The header profile menu can change your display name and optional picture.
4. **Customers** — create an organization, owner email/password, optional domain. Copy the API key and MCP token immediately. **Open tenant** to work in that customer’s sending console.
5. **Users** (portal) — add or promote people who can open `/portal`. Revoke cannot target yourself or the last administrator. Existing customer owners can be granted portal access without creating a second account.
6. **Agents** (portal) — create platform MCP tokens that act as an administrator. Tenant console **Agents** issues tokens scoped to that organization only. Copy the token once and point an MCP client at `/mcp`. See [mcp.md](mcp.md).
7. **Logs** (portal) — search delivery across tenants, set retention, export a redacted ops snapshot.
8. **Backups** (portal) — dump/restore Postgres, schedule the sidecar, optional S3-compatible offsite. See [operations.md](operations.md).
9. **Configuration** (portal) — **System domain** (attach the web host or another sending domain, publish DNS, set the programmatic From), SES, optional platform SMTP relay, inbound SMTP TLS, alert from/to, and **OIDC**. For Authentik: create an OAuth2/OIDC application, paste the issuer, client ID, and secret, and copy the callback URL shown in the form (`/api/auth/oidc/callback`). Optional **sign-in button label** overrides the default “Continue with Authentik” text. **JIT accounts** creates a local user on first successful sign-in (platform tenant membership). Leave JIT off if only people you already created in **Users** should get in. An optional administrator group grants `is_platform_admin`. Existing databases need `database-migrate-oidc.sql`, `database-migrate-oidc-button-label.sql`, and `database-migrate-password-reset.sql` once.
10. **Sending** (tenant console) — choose ingress (HTTPS, SMTP, or both) and egress (AWS SES or upstream SMTP). Leave SMTP host empty to use the platform relay when it is enabled.
11. **Domains** — add the sending domain, publish MX/SPF/DKIM/DMARC exactly as listed, then **Check records**. Sending stays blocked until they match (unless `SKIP_DNS_VERIFICATION=true` locally).
12. Send a test with curl, the Resend SDK (`RESEND_BASE_URL=http://localhost:3001/api`), or SMTP on port 2525 (`npm run smtp`).
13. Ask an AI to call `/mcp` with a platform or tenant agent token. Platform tokens can also provision customers and read health.
