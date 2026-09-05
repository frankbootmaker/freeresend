import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { query } from "./database";
import type { ApiKey } from "./database";
import {
  parseEgressPreference,
  type EgressPreference,
} from "./egress-pin";

export interface ApiKeyWithKey extends Omit<ApiKey, "key_hash"> {
  key: string;
}

// Helper function to safely parse permissions (handles both string and array)
function safeParsePermissions(permissions: unknown): string[] {
  if (!permissions) return ["send"];
  if (typeof permissions === "string") {
    try {
      return JSON.parse(permissions);
    } catch {
      return ["send"];
    }
  }
  if (Array.isArray(permissions)) {
    return permissions;
  }
  return ["send"];
}

export async function generateApiKey(
  userId: string,
  domainId: string,
  keyName: string,
  permissions: string[] = ["send"],
  tenantId?: string,
  egressPreference: EgressPreference = "auto",
): Promise<ApiKeyWithKey> {
  // Generate a secure API key with prefix
  const keyId = nanoid(8);
  const keySecret = nanoid(32);
  const apiKey = `frs_${keyId}_${keySecret}`; // frs_ prefix is unchanged so existing keys keep working

  // Hash the key for storage
  const keyHash = await bcrypt.hash(apiKey, 10);

  if (!tenantId) {
    const domainRow = await query(
      'SELECT tenant_id FROM domains WHERE id = $1 LIMIT 1',
      [domainId],
    );
    tenantId = domainRow.rows[0]?.tenant_id;
  }
  if (!tenantId) {
    throw new Error('tenant_id is required to create an API key');
  }

  try {
    const result = await query(
      `INSERT INTO api_keys
        (tenant_id, user_id, domain_id, key_name, key_hash, key_prefix,
         permissions, egress_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        tenantId,
        userId,
        domainId,
        keyName,
        keyHash,
        `frs_${keyId}`,
        JSON.stringify(permissions),
        parseEgressPreference(egressPreference),
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create API key");
    }

    const data = result.rows[0];
    return {
      ...data,
      permissions: safeParsePermissions(data.permissions),
      egress_preference: parseEgressPreference(data.egress_preference),
      key: apiKey,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create API key: ${errorMessage}`);
  }
}

export async function verifyApiKey(apiKey: string): Promise<ApiKey | null> {
  // Extract prefix for efficient lookup
  // Split only on the first two underscores to handle underscores in the secret part
  const firstUnderscore = apiKey.indexOf("_");
  const secondUnderscore = apiKey.indexOf("_", firstUnderscore + 1);

  if (firstUnderscore === -1 || secondUnderscore === -1) {
    return null;
  }

  const prefix_part = apiKey.substring(0, firstUnderscore);
  const keyId_part = apiKey.substring(firstUnderscore + 1, secondUnderscore);
  const secret_part = apiKey.substring(secondUnderscore + 1);

  if (prefix_part !== "frs" || !keyId_part || !secret_part) {
    return null;
  }

  const prefix = `${prefix_part}_${keyId_part}`;

  try {
    const result = await query("SELECT * FROM api_keys WHERE key_prefix = $1", [
      prefix,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    // Verify the full key against each possible match
    for (const key of result.rows) {
      const isValid = await bcrypt.compare(apiKey, key.key_hash);
      if (isValid) {
        // Update last used timestamp
        await query("UPDATE api_keys SET last_used_at = NOW() WHERE id = $1", [
          key.id,
        ]);

        // Parse JSON fields
        return {
          ...key,
          permissions: safeParsePermissions(key.permissions),
          egress_preference: parseEgressPreference(key.egress_preference),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("API key verification error:", error);
    return null;
  }
}

function mapApiKeyRow(row: ApiKey & { domain_name?: string }) {
  return {
    ...row,
    permissions: safeParsePermissions(row.permissions),
    egress_preference: parseEgressPreference(row.egress_preference),
    domains: row.domain_name ? { domain: row.domain_name } : null,
  };
}

export async function getTenantApiKeys(tenantId: string): Promise<ApiKey[]> {
  const result = await query(
    `SELECT ak.*, d.domain as domain_name
     FROM api_keys ak
     LEFT JOIN domains d ON ak.domain_id = d.id
     WHERE ak.tenant_id = $1
     ORDER BY ak.created_at DESC`,
    [tenantId],
  );
  return result.rows.map(mapApiKeyRow);
}

export async function getTenantApiKeysPage(
  tenantId: string,
  input: { limit: number; offset: number },
): Promise<{ apiKeys: ReturnType<typeof mapApiKeyRow>[]; total: number }> {
  const count = await query(
    'SELECT COUNT(*)::int AS count FROM api_keys WHERE tenant_id = $1',
    [tenantId],
  );
  const result = await query(
    `SELECT ak.*, d.domain as domain_name
     FROM api_keys ak
     LEFT JOIN domains d ON ak.domain_id = d.id
     WHERE ak.tenant_id = $1
     ORDER BY ak.created_at DESC
     LIMIT $2 OFFSET $3`,
    [tenantId, input.limit, input.offset],
  );
  return {
    apiKeys: result.rows.map(mapApiKeyRow),
    total: Number(count.rows[0]?.count || 0),
  };
}

export async function getUserApiKeys(
  userId: string,
  tenantId?: string,
): Promise<ApiKey[]> {
  try {
    const result = await query(
      `SELECT 
        ak.*,
        d.domain as domain_name
      FROM api_keys ak
      LEFT JOIN domains d ON ak.domain_id = d.id
      WHERE ak.user_id = $1
        AND ($2::uuid IS NULL OR ak.tenant_id = $2)
      ORDER BY ak.created_at DESC`,
      [userId, tenantId || null]
    );

    return result.rows.map((row) => ({
      ...row,
      permissions: safeParsePermissions(row.permissions),
      egress_preference: parseEgressPreference(row.egress_preference),
      domains: row.domain_name ? { domain: row.domain_name } : null,
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch API keys: ${errorMessage}`);
  }
}

export async function getDomainApiKeys(domainId: string): Promise<ApiKey[]> {
  try {
    const result = await query(
      `SELECT * FROM api_keys 
       WHERE domain_id = $1 
       ORDER BY created_at DESC`,
      [domainId]
    );

    return result.rows.map((row) => ({
      ...row,
      permissions: safeParsePermissions(row.permissions),
      egress_preference: parseEgressPreference(row.egress_preference),
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch domain API keys: ${errorMessage}`);
  }
}

export class ApiKeyError extends Error {
  status: number;

  constructor(message: string, status = 404) {
    super(message);
    this.name = 'ApiKeyError';
    this.status = status;
  }
}

export async function deleteApiKey(
  keyId: string,
  tenantId: string,
): Promise<void> {
  const result = await query(
    `DELETE FROM api_keys
     WHERE id = $1 AND tenant_id = $2`,
    [keyId, tenantId],
  );

  if (result.rowCount === 0) {
    throw new ApiKeyError('API key not found', 404);
  }
}

export async function updateApiKeyPermissions(
  keyId: string,
  tenantId: string,
  permissions: string[],
): Promise<void> {
  const result = await query(
    'UPDATE api_keys SET permissions = $1 WHERE id = $2 AND tenant_id = $3',
    [JSON.stringify(permissions), keyId, tenantId],
  );

  if (result.rowCount === 0) {
    throw new ApiKeyError('API key not found', 404);
  }
}

export function maskApiKey(apiKey: string): string {
  const parts = apiKey.split("_");
  if (parts.length !== 3) return apiKey;

  return `${parts[0]}_${parts[1]}_${"*".repeat(parts[2].length)}`;
}
