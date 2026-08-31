import { NextRequest } from 'next/server';
import { readPlatformAdminFlag, verifyJWT, type AuthUser } from './auth';
import { verifyApiKey } from './api-keys';
import { verifyMcpToken, type McpAuth } from './mcp-tokens';
import { getTenantById, type Tenant } from './tenants';
import type { ApiKey } from './database';

export interface TenantSession {
  tenant: Tenant;
  user?: AuthUser;
  apiKey?: ApiKey;
  mcp?: McpAuth;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function resolveTenantSession(
  req: NextRequest,
): Promise<TenantSession> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }
  const token = authHeader.substring(7);
  const overrideTenant = req.headers.get('x-tenant-id');

  if (token.startsWith('frs_')) {
    const apiKey = await verifyApiKey(token);
    if (!apiKey?.tenant_id) {
      throw new AuthError('Invalid API key');
    }
    const tenant = await getTenantById(apiKey.tenant_id);
    if (!tenant || tenant.status === 'suspended') {
      throw new AuthError('Tenant is suspended', 403);
    }
    return { tenant, apiKey };
  }

  if (token.startsWith('mcp_')) {
    const mcp = await verifyMcpToken(token);
    if (!mcp) throw new AuthError('Invalid MCP token');
    const tenantId = mcp.tenantId || overrideTenant;
    if (!tenantId) {
      throw new AuthError('Tenant is required for this MCP token', 400);
    }
    if (mcp.tenantId && overrideTenant && mcp.tenantId !== overrideTenant) {
      throw new AuthError('MCP token cannot access another tenant', 403);
    }
    const tenant = await getTenantById(tenantId);
    if (!tenant || tenant.status === 'suspended') {
      throw new AuthError('Tenant is suspended', 403);
    }
    return { tenant, mcp };
  }

  const user = verifyJWT(token);
  if (!user) throw new AuthError('Invalid or expired token');

  const liveAdmin = await readPlatformAdminFlag(user.id);
  if (liveAdmin === null) {
    throw new AuthError('Invalid or expired token');
  }
  user.isPlatformAdmin = liveAdmin;

  let tenantId = user.tenantId;
  if (overrideTenant) {
    if (!user.isPlatformAdmin && overrideTenant !== user.tenantId) {
      throw new AuthError('Not allowed to switch tenant', 403);
    }
    tenantId = overrideTenant;
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) throw new AuthError('Tenant not found', 404);
  if (tenant.status === 'suspended' && !user.isPlatformAdmin) {
    throw new AuthError('Tenant is suspended', 403);
  }

  return { tenant, user: { ...user, tenantId } };
}
