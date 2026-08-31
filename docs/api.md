# HTTP API (iteration 1)

All JSON. Bearer token unless noted.

## Auth

- `POST /api/auth/register` — `{ name, slug?, email, password }`
- `POST /api/auth/login` — `{ email, password }` → `{ user, token, tenant, memberships }`
- `GET /api/auth/me` — current user + tenant
- `POST /api/auth/me` — `{ tenantId }` reissues JWT
- `POST /api/setup` — create platform admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`

Header `X-Tenant-Id` lets a platform admin act on another tenant.

## Tenant

- `GET /api/tenant` — settings (SMTP password masked) + SMTP submission host/port
- `PATCH /api/tenant` — `{ inboundTransport: "https"|"smtp"|"both", outboundTransport: "ses"|"smtp", smtpUpstream? }`
- `GET /api/stats/tenant?days=30` — traffic + quota

## Resources

- `GET|POST /api/domains`
- `POST /api/domains/:id/verify` — live MX/SPF/DKIM/DMARC check; sending needs a verified domain
- `GET|POST /api/api-keys`
- `GET /api/emails/logs`
- `POST /api/emails` — API key only (Resend-compatible)

## Admin

- `GET|POST /api/admin/customers`
- `GET|POST /api/admin/users` — list or add platform administrators
- `PATCH|DELETE /api/admin/users/:id` — set password/name or revoke portal access

## MCP

See [mcp.md](mcp.md). `GET|POST /mcp`
