# Architecture

RelayHorizon is a Next.js 15 app plus PostgreSQL. Compose services:

- `web` — landing, dashboard, Resend-compatible `POST /api/emails`, JSON-RPC MCP at `/mcp`
- `postgres` — tenant-scoped data
- `smtp` (profile `smtp`) — SMTP submission listener on 2525
- `mailhog` (profile `dev`) — optional SMTP sink for the per-tenant egress switch

```
App / Resend SDK  -->  POST /api/emails (API key)     \  inbound_transport
App / MTA         -->  SMTP :2525 (API key password)  /  = https | smtp | both
Dashboard         -->  JWT + tenant context (password or OIDC)
AI agent          -->  POST /mcp (MCP token)
                         |
                         v
                   tenant checks, quota, verified DNS
                         |
          outbound_transport = ses | smtp
                         |
                    AWS SES or upstream SMTP
```

Isolation is **logical**: every tenant-owned row has `tenant_id`. API keys, JWTs, and MCP tokens resolve a tenant; queries must filter on it.

Dashboard sign-in is a local password or optional OpenID Connect (Authentik or another IdP). OIDC settings live on `platform_settings`, including an optional sign-in button label. The authorization-code callback is `/api/auth/oidc/callback`. JIT, when enabled, creates a local user and a platform-tenant membership. Forgot password uses hashed one-hour tokens and the platform sender from Configuration → Basics. One Sign in page routes platform admins to `/portal` and tenant members to `/`.

Domains stay pending until MX, SPF, DKIM, and DMARC match the listed records. `SKIP_DNS_VERIFICATION=true` is a local override only.
