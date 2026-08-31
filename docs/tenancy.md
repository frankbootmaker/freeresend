# Tenancy

## Model

- **Tenant** = customer or internal product (`slug`, quota, `outbound_transport`)
- **User** = person; email is globally unique; a user may belong to several tenants
- **Membership** = `owner` | `admin` | `member`
- **Platform admin** = `users.is_platform_admin`; can list/create customers and switch tenant via `X-Tenant-Id` or `POST /api/auth/me`

## Provisioning

**Self-signup** `POST /api/auth/register` creates a tenant and an owner membership.

**Admin setup** `POST /api/admin/customers` (platform admin JWT) can create tenant, owner user, optional domain, API key, and MCP token in one call. Secrets are returned **once**.

**OIDC** (Portal → Configuration) signs dashboard users in through Authentik or another OpenID Connect provider. The IdP `email` claim maps to `users.email`. With JIT on, a first sign-in creates the user and a `platform` tenant membership; an optional group can set `is_platform_admin`. With JIT off, only existing local accounts can complete sign-in.

## Isolation rules

- Domains, API keys, email logs, MCP tokens (when tenant-scoped) always carry `tenant_id`
- Domain names are globally unique (shared SES identity space)
- A tenant MCP token cannot pass another `tenant_id`
- Suspended tenants cannot send
