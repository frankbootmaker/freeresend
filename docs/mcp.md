# MCP (iteration 1)

JSON-RPC 2.0 over HTTP at **`/mcp`**. Authenticate with `Authorization: Bearer mcp_…`.

Platform tokens have `tenant_id` null. `POST /api/setup` issues one the first time it runs (shown once in the JSON body). Tenant tokens are issued in customer setup. Tenant tokens only see their tenant.

## Handshake

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}
```

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

## Tools

### `list_tenants`

Platform token only. Returns id, slug, name, status, outbound_transport.

### `get_tenant_settings`

Optional `tenant_id` or `slug` (required for platform tokens). Returns quota, egress mode, domains. **No secrets.**

### `get_tenant_traffic`

Same tenant targeting. Optional `days` (default 30). Counts by `email_logs.status`.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_tenant_traffic",
    "arguments": { "days": 7 }
  }
}
```

Write tools (`send_email`, `setup_customer`, …) are not in iteration 1.

Cursor / IDE: point an HTTP MCP client at `https://<host>/mcp` with the tenant or platform token.
