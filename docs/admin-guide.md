# Admin guide

1. Start Postgres and the app ([docker.md](docker.md)).
2. `POST /api/setup` once. If the response includes `mcpToken`, store that platform MCP token immediately.
3. Log in as the platform admin. RelayHorizon opens the **Portal** (`/portal`), not the tenant console.
4. **Customers** — create an organization, owner email/password, optional domain. Copy the API key and MCP token immediately. **Open tenant** to work in that customer’s sending console.
5. **Logs** (portal) — search delivery across tenants, set retention, export a redacted ops snapshot.
6. **Backups** (portal) — dump/restore Postgres, schedule the sidecar, optional S3-compatible offsite. See [operations.md](operations.md).
7. **Configuration** (portal) — SES credentials, optional platform SMTP relay, and alert from/to addresses.
8. **Sending** (tenant console) — choose ingress (HTTPS, SMTP, or both) and egress (AWS SES or upstream SMTP). Leave SMTP host empty to use the platform relay when it is enabled.
9. **Domains** — add the sending domain, publish MX/SPF/DKIM/DMARC exactly as listed, then **Check records**. Sending stays blocked until they match (unless `SKIP_DNS_VERIFICATION=true` locally).
10. Send a test with curl, the Resend SDK (`RESEND_BASE_URL=http://localhost:3001/api`), or SMTP on port 2525 (`npm run smtp`).
11. Ask an AI to call `/mcp` with the MCP token: `get_tenant_settings`, `get_tenant_traffic`.
