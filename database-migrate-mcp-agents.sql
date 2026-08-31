-- Agent tokens: bind MCP credentials to the operator who created them.
ALTER TABLE mcp_tokens
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_mcp_tokens_tenant ON mcp_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_created_by ON mcp_tokens(created_by);
