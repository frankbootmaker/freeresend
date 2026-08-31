import type { NextRequest } from 'next/server';
import { AuthError, resolveTenantSession, type TenantSession } from '@/lib/tenant-context';

export async function requirePlatformAdmin(
  request: NextRequest,
): Promise<TenantSession> {
  const session = await resolveTenantSession(request);
  if (!session.user?.isPlatformAdmin) {
    throw new AuthError('Platform admin required', 403);
  }
  return session;
}

export async function requireDashboardUser(
  request: NextRequest,
): Promise<TenantSession> {
  const session = await resolveTenantSession(request);
  if (!session.user || session.mcp) {
    throw new AuthError('Dashboard session required', 401);
  }
  return session;
}

export async function requirePlatformDashboard(
  request: NextRequest,
): Promise<TenantSession> {
  const session = await requireDashboardUser(request);
  if (!session.user?.isPlatformAdmin) {
    throw new AuthError('Platform admin required', 403);
  }
  return session;
}
