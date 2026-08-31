import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyJWT, generateJWT, buildAuthUser, type AuthUser } from '@/lib/auth';
import { json, optionsResponse } from '@/lib/http';
import { attachProfile, updateUserProfile } from '@/lib/profile';
import { getMembershipsForUser, getTenantById } from '@/lib/tenants';

const profileSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    avatar: z.string().nullable().optional(),
  })
  .refine((body) => body.name !== undefined || body.avatar !== undefined, {
    message: 'Nothing to update',
  });

async function sessionData(authUser: AuthUser) {
  const user = await attachProfile(authUser);
  const tenant = await getTenantById(authUser.tenantId);
  const memberships = await getMembershipsForUser(authUser.id);
  return { user, tenant, memberships };
}

function readBearerUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: json({ error: 'Missing or invalid authorization header' }, 401) };
  }
  const user = verifyJWT(authHeader.substring(7));
  if (!user) {
    return { error: json({ error: 'Invalid or expired token' }, 401) };
  }
  return { user };
}

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  const auth = readBearerUser(request);
  if (!auth.user) return auth.error;
  const user = auth.user;

  const override = request.headers.get('x-tenant-id');
  const authUser =
    override && user.isPlatformAdmin
      ? await buildAuthUser(user.id, override)
      : await buildAuthUser(user.id, user.tenantId);

  if (!authUser) {
    return json({ error: 'Unable to resolve tenant' }, 400);
  }

  return json({
    success: true,
    data: await sessionData(authUser),
  });
}

export async function POST(request: NextRequest) {
  const auth = readBearerUser(request);
  if (!auth.user) return auth.error;
  const current = auth.user;

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

  return json({
    success: true,
    data: {
      ...(await sessionData(authUser)),
      token: generateJWT(authUser),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = readBearerUser(request);
  if (!auth.user) return auth.error;

  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message || 'Invalid profile' }, 400);
  }

  try {
    await updateUserProfile(auth.user.id, parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save profile';
    return json({ error: message }, 400);
  }

  const authUser = await buildAuthUser(auth.user.id, auth.user.tenantId);
  if (!authUser) {
    return json({ error: 'Unable to resolve tenant' }, 400);
  }

  return json({
    success: true,
    data: {
      ...(await sessionData(authUser)),
      token: generateJWT(authUser),
    },
  });
}
