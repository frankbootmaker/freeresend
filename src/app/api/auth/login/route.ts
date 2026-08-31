import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authenticateUser, generateJWT } from '@/lib/auth';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { attachProfile } from '@/lib/profile';
import { getMembershipsForUser, getTenantById } from '@/lib/tenants';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  tenantId: z.string().uuid().optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, tenantId } = loginSchema.parse(body);
    const user = await authenticateUser(email, password, tenantId);
    if (!user) {
      return json({ error: 'Invalid email or password' }, 401);
    }

    const token = generateJWT(user);
    const memberships = await getMembershipsForUser(user.id);
    const tenant = await getTenantById(user.tenantId);

    return json({
      success: true,
      data: {
        user: await attachProfile(user),
        token,
        memberships,
        tenant,
      },
    });
  } catch (error: unknown) {
    const errorObj = error as { errors?: unknown; message?: string };
    if (errorObj.errors) {
      return json({ error: 'Invalid request data', details: errorObj.errors }, 400);
    }
    console.error('Login error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
