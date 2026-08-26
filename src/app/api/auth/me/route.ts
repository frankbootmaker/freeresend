import { NextRequest } from 'next/server';
import { verifyJWT, generateJWT, buildAuthUser } from '@/lib/auth';
import { json, optionsResponse } from '@/lib/http';
import { getMembershipsForUser, getTenantById } from '@/lib/tenants';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid authorization header' }, 401);
  }
  const user = verifyJWT(authHeader.substring(7));
  if (!user) {
    return json({ error: 'Invalid or expired token' }, 401);
  }

  const override = request.headers.get('x-tenant-id');
  const authUser =
    override && user.isPlatformAdmin
      ? await buildAuthUser(user.id, override)
      : user;

  if (!authUser) {
    return json({ error: 'Unable to resolve tenant' }, 400);
  }

  const tenant = await getTenantById(authUser.tenantId);
  const memberships = await getMembershipsForUser(user.id);

  return json({
    success: true,
    data: {
      user: authUser,
      tenant,
      memberships,
    },
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing or invalid authorization header' }, 401);
  }
  const current = verifyJWT(authHeader.substring(7));
  if (!current) {
    return json({ error: 'Invalid or expired token' }, 401);
  }

  const body = await request.json();
  const tenantId = body.tenantId as string;
  if (!tenantId) {
    return json({ error: 'tenantId is required' }, 400);
  }

  const authUser = await buildAuthUser(current.id, tenantId);
  if (!authUser) {
    return json({ error: 'Not a member of that tenant' }, 403);
  }
  if (!current.isPlatformAdmin && authUser.tenantId !== tenantId) {
    return json({ error: 'Not a member of that tenant' }, 403);
  }

  const tenant = await getTenantById(authUser.tenantId);
  const memberships = await getMembershipsForUser(current.id);

  return json({
    success: true,
    data: {
      user: authUser,
      token: generateJWT(authUser),
      tenant,
      memberships,
    },
  });
}
