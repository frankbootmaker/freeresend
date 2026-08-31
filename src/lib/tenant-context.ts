import { NextRequest } from 'next/server';
import {
  buildAuthUser,
  readPlatformAdminFlag,
  verifyJWT,
  type AuthUser,
} from './auth';
import { verifyApiKey } from './api-keys';
import {
  firstPlatformAdminId,
  firstTenantOwnerId,
  verifyMcpToken,
  type McpAuth,
} from './mcp-tokens';
import { getTenantById, getTenantBySlug, type Tenant } from './tenants';
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
    if (mcp.tenantId && overrideTenant && mcp.tenantId !== overrideTenant) {
      throw new AuthError('MCP token cannot access another tenant', 403);
    }
    const tenantId = mcp.tenantId || overrideTenant;
    const tenant = tenantId
      ? await getTenantById(tenantId)
      : await getTenantBySlug('platform');
    if (!tenant) {
      throw new AuthError(
        tenantId ? 'Tenant not found' : 'Platform tenant is required',
        404,
      );
    }
    if (tenant.status === 'suspended' && !mcp.isPlatform) {
      throw new AuthError('Tenant is suspended', 403);
    }
    const user = await actorFromMcp(mcp, tenant.id);
    return { tenant, mcp, user };
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

async function actorFromMcp(
  mcp: McpAuth,
  tenantId: string,
): Promise<AuthUser> {
  const preferredId =
    mcp.createdById ||
    (mcp.isPlatform
      ? await firstPlatformAdminId()
      : await firstTenantOwnerId(mcp.tenantId || tenantId));
  if (!preferredId) {
    throw new AuthError('No user is bound to this agent', 500);
  }
  const user = await buildAuthUser(preferredId, tenantId);
  if (!user) {
    throw new AuthError('No user is bound to this agent', 500);
  }
  return {
    ...user,
    tenantId,
    isPlatformAdmin: mcp.isPlatform || user.isPlatformAdmin,
    membershipRole: mcp.isPlatform ? 'owner' : user.membershipRole,
  };
}
