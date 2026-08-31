# MCP agents

JSON-RPC 2.0 over HTTP at **`/mcp`**. Authenticate with `Authorization: Bearer mcp_…`.

## Two kinds of agent

| Kind | Created in | Scope |
|------|------------|--------|
| **Platform** | Portal → Agents | Same access as a platform administrator: portal APIs plus every tenant tool (must pass `tenant_id` or `slug` when a tenant is required) |
| **Tenant** | Tenant console → Agents | Only that organization. Cannot list tenants, provision customers, or read other tenants |

Create and revoke tokens in those screens. The plaintext token is shown **once**. Point an HTTP MCP client (Cursor, Claude, …) at `https://<host>/mcp` with the token.

`POST /api/setup` still issues a platform token the first time it runs if none exists. Customer provision still issues a tenant token named `default`.

## Handshake

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
```

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

`tools/list` returns only the tools that token may call.

## Platform tools

- `list_tenants`
- `setup_customer` — `{ name, ownerEmail, ownerPassword?, domain?, outboundTransport?, inboundTransport? }`
- `get_platform_health`
- `list_platform_admins`

## Tenant tools (both kinds)

- `get_tenant_settings` — optional `tenant_id` / `slug` (required for platform tokens)
- `get_tenant_traffic` — optional `days`
- `list_domains`
- `list_email_logs` — optional `q`, `status`, `days`, `limit`

Platform agents also pass `Authorization: Bearer mcp_…` on `/api/admin/*` and tenant dashboard APIs (with `X-Tenant-Id` when acting on a customer). Tenant agents can call that tenant’s dashboard APIs the same way. Agent **management** (`/api/admin/agents`, `/api/agents`) stays dashboard-session only so an agent cannot mint further agents.
