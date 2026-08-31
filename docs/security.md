# Security

- Tenant data is scoped in application queries via `tenant_id`. Always use `resolveTenantSession`.
- API keys (`frs_`) and MCP tokens (`mcp_`) are stored hashed.
- SMTP upstream passwords are stored on the tenant row; they are masked in `GET /api/tenant`.
- No open SMTP relay. Submission gateway is not enabled in iteration 1.
- Incoming mail / MX is out of scope.
- Change `ADMIN_PASSWORD` and `NEXTAUTH_SECRET` before any network-exposed deploy.
- Do not log API keys, MCP tokens, or SMTP passwords.
- OIDC client secrets are stored on `platform_settings` and masked in `GET /api/admin/settings`. Enable JIT only when you trust the IdP to assert email; a first sign-in then creates a local user.
- Profile pictures are small data-URL images on `users.avatar`. They are not stored in the JWT.
