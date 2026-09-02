import { query } from './database';
import { hashSecret, randomToken, verifySecret } from './auth-crypto';

export type AgentKind = 'platform' | 'tenant';

export interface McpTokenRecord {
  id: string;
  tenant_id: string | null;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_by?: string | null;
  last_used_at?: string;
  created_at?: string;
}

export interface McpAuth {
  tokenId: string;
  tenantId: string | null;
  createdById: string | null;
  isPlatform: boolean;
  scopes: string[];
}

export class McpTokenError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function parseScopes(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return ['read'];
    }
  }
  return ['read'];
}

function mapRecord(row: {
  id?: string;
  tenant_id?: string | null;
  name?: string;
  key_prefix?: string;
  scopes?: unknown;
  created_by?: string | null;
  last_used_at?: string | Date | null;
  created_at?: string | Date | null;
}): McpTokenRecord {
  return {
    id: String(row.id),
    tenant_id: row.tenant_id || null,
    name: String(row.name || ''),
    key_prefix: String(row.key_prefix || ''),
    scopes: parseScopes(row.scopes),
    created_by: row.created_by || null,
    last_used_at: row.last_used_at
      ? new Date(row.last_used_at).toISOString()
      : undefined,
    created_at: row.created_at
      ? new Date(row.created_at).toISOString()
      : undefined,
  };
}

export function defaultAgentScopes(kind: AgentKind): string[] {
  return kind === 'platform' ? ['admin'] : ['tenant'];
}

export function assertAgentName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) {
    throw new McpTokenError(
      'MCP_NAME_INVALID',
      'Agent name must be 1–80 characters',
      400,
    );
  }
  return trimmed;
}

export async function createMcpToken(input: {
  tenantId: string | null;
  name: string;
  scopes?: string[];
  createdBy?: string | null;
}): Promise<{ record: McpTokenRecord; token: string }> {
  const name = assertAgentName(input.name);
  const kind: AgentKind = input.tenantId ? 'tenant' : 'platform';
  const keyId = randomToken(8);
  const secret = randomToken(32);
  const token = `mcp_${keyId}_${secret}`;
  const keyHash = await hashSecret(token);
  const prefix = `mcp_${keyId}`;

  const result = await query(
    `INSERT INTO mcp_tokens
       (tenant_id, name, key_hash, key_prefix, scopes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, tenant_id, name, key_prefix, scopes, created_by,
               last_used_at, created_at`,
    [
      input.tenantId,
      name,
      keyHash,
      prefix,
      JSON.stringify(input.scopes || defaultAgentScopes(kind)),
      input.createdBy || null,
    ],
  );

  return {
    record: mapRecord(result.rows[0]),
    token,
  };
}

export async function listMcpTokens(input: {
  kind: AgentKind;
  tenantId?: string;
}): Promise<McpTokenRecord[]> {
  if (input.kind === 'platform') {
    const result = await query(
      `SELECT id, tenant_id, name, key_prefix, scopes, created_by,
              last_used_at, created_at
       FROM mcp_tokens
       WHERE tenant_id IS NULL
       ORDER BY created_at DESC`,
    );
    return result.rows.map(mapRecord);
  }
  if (!input.tenantId) {
    throw new McpTokenError(
      'MCP_TENANT_REQUIRED',
      'Tenant is required for tenant agents',
      400,
    );
  }
  const result = await query(
    `SELECT id, tenant_id, name, key_prefix, scopes, created_by,
            last_used_at, created_at
     FROM mcp_tokens
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [input.tenantId],
  );
  return result.rows.map(mapRecord);
}

export async function listMcpTokensPage(input: {
  kind: AgentKind;
  tenantId?: string;
  limit: number;
  offset: number;
}): Promise<{ agents: McpTokenRecord[]; total: number }> {
  if (input.kind === 'platform') {
    const count = await query(
      'SELECT COUNT(*)::int AS count FROM mcp_tokens WHERE tenant_id IS NULL',
    );
    const result = await query(
      `SELECT id, tenant_id, name, key_prefix, scopes, created_by,
              last_used_at, created_at
       FROM mcp_tokens
       WHERE tenant_id IS NULL
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [input.limit, input.offset],
    );
    return {
      agents: result.rows.map(mapRecord),
      total: Number(count.rows[0]?.count || 0),
    };
  }
  if (!input.tenantId) {
    throw new McpTokenError(
      'MCP_TENANT_REQUIRED',
      'Tenant is required for tenant agents',
      400,
    );
  }
  const count = await query(
    'SELECT COUNT(*)::int AS count FROM mcp_tokens WHERE tenant_id = $1',
    [input.tenantId],
  );
  const result = await query(
    `SELECT id, tenant_id, name, key_prefix, scopes, created_by,
            last_used_at, created_at
     FROM mcp_tokens
     WHERE tenant_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [input.tenantId, input.limit, input.offset],
  );
  return {
    agents: result.rows.map(mapRecord),
    total: Number(count.rows[0]?.count || 0),
  };
}

export async function revokeMcpToken(input: {
  id: string;
  kind: AgentKind;
  tenantId?: string;
}): Promise<void> {
  const result = await query(
    `DELETE FROM mcp_tokens
     WHERE id = $1
       AND ${input.kind === 'platform' ? 'tenant_id IS NULL' : 'tenant_id = $2'}`,
    input.kind === 'platform' ? [input.id] : [input.id, input.tenantId],
  );
  if (result.rowCount === 0) {
    throw new McpTokenError('MCP_NOT_FOUND', 'Agent not found', 404);
  }
}

export async function verifyMcpToken(raw: string): Promise<McpAuth | null> {
  const first = raw.indexOf('_');
  const second = raw.indexOf('_', first + 1);
  if (first === -1 || second === -1) return null;
  if (raw.substring(0, first) !== 'mcp') return null;

  const prefix = raw.substring(0, second);
  const result = await query(
    'SELECT * FROM mcp_tokens WHERE key_prefix = $1',
    [prefix],
  );
  if (result.rows.length === 0) return null;

  for (const row of result.rows) {
    const ok = await verifySecret(raw, row.key_hash);
    if (ok) {
      await query(
        'UPDATE mcp_tokens SET last_used_at = NOW() WHERE id = $1',
        [row.id],
      );
      return {
        tokenId: row.id,
        tenantId: row.tenant_id,
        createdById: row.created_by || null,
        isPlatform: row.tenant_id === null,
        scopes: parseScopes(row.scopes),
      };
    }
  }
  return null;
}

export async function firstPlatformAdminId(): Promise<string | null> {
  const result = await query(
    `SELECT id FROM users
     WHERE is_platform_admin = TRUE
     ORDER BY created_at ASC
     LIMIT 1`,
  );
  return result.rows[0]?.id || null;
}

export async function firstTenantOwnerId(
  tenantId: string,
): Promise<string | null> {
  const result = await query(
    `SELECT user_id FROM tenant_memberships
     WHERE tenant_id = $1 AND role = 'owner'
     ORDER BY created_at ASC
     LIMIT 1`,
    [tenantId],
  );
  return result.rows[0]?.user_id || null;
}
