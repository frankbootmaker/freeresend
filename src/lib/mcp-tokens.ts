import { query } from './database';
import { hashSecret, randomToken, verifySecret } from './auth-crypto';

export interface McpTokenRecord {
  id: string;
  tenant_id: string | null;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string;
}

export interface McpAuth {
  tokenId: string;
  tenantId: string | null;
  isPlatform: boolean;
  scopes: string[];
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

export async function createMcpToken(input: {
  tenantId: string | null;
  name: string;
  scopes?: string[];
}): Promise<{ record: McpTokenRecord; token: string }> {
  const keyId = randomToken(8);
  const secret = randomToken(32);
  const token = `mcp_${keyId}_${secret}`;
  const keyHash = await hashSecret(token);
  const prefix = `mcp_${keyId}`;

  const result = await query(
    `INSERT INTO mcp_tokens (tenant_id, name, key_hash, key_prefix, scopes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, tenant_id, name, key_prefix, scopes, last_used_at`,
    [
      input.tenantId,
      input.name,
      keyHash,
      prefix,
      JSON.stringify(input.scopes || ['read']),
    ],
  );

  const row = result.rows[0];
  return {
    record: { ...row, scopes: parseScopes(row.scopes) },
    token,
  };
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
        isPlatform: row.tenant_id === null,
        scopes: parseScopes(row.scopes),
      };
    }
  }
  return null;
}
