# HTTP API (iteration 1)

All JSON. Bearer token unless noted.

## Auth

- `POST /api/auth/register` — `{ name, slug?, email, password, acceptedTerms: true, acceptedTermsVersion }` (version must match the published legal documents)
- `POST /api/auth/login` — `{ email, password }` → `{ user, token, tenant, memberships }`
- `GET /api/auth/me` — current user + tenant
- `POST /api/auth/me` — `{ tenantId }` reissues JWT
- `POST /api/setup` — create platform admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`

Header `X-Tenant-Id` lets a platform admin act on another tenant.

## Tenant

- `GET /api/tenant` — settings (SMTP password masked) + SMTP submission host/port
- `PATCH /api/tenant` — `{ inboundTransport: "https"|"smtp"|"both", outboundTransport: "ses"|"smtp", smtpUpstream? }`
- `GET /api/stats/tenant?days=30` — traffic + hour / day / month quota used
- `GET /api/tenant/abuse` — pool, used caps, 24-hour bounce/complaint rates, suppression count, freeze state, derived warnings

## Resources

- `GET|POST /api/domains`
- `POST /api/domains/:id/verify` — live MX/SPF/DKIM/DMARC check; sending needs a verified domain
- `GET|POST /api/api-keys` — list accepts `page` and `limit` (console: 5 / 10 / 25 / 50)
- `DELETE /api/api-keys/:id` — tenant-scoped; any member of the tenant can delete
- `GET /api/emails/logs` — `page`, `limit`, `q`, `from`, `status`
- `POST /api/emails` — API key only (Resend-compatible)

## Admin

- `GET|POST /api/admin/customers`
- `PATCH /api/admin/customers/:id` — rename; assign `sendingTier` / `billingMode` / caps; Approve / Deny BYO; `{ sendingFrozen: false }` to unfreeze
- `DELETE /api/admin/customers/:id`
- `GET|POST /api/admin/users` — list or add platform administrators
- `PATCH|DELETE /api/admin/users/:id` — set password/name or revoke portal access
- `GET|POST /api/admin/agents` — platform MCP agents
- `DELETE /api/admin/agents/:id`
- `GET|POST /api/agents` — tenant-scoped MCP agents
- `DELETE /api/agents/:id`

## MCP

See [mcp.md](mcp.md). `GET|POST /mcp`
