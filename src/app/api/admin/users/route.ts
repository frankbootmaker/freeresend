import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  grantPlatformAdmin,
  listPlatformAdmins,
  PlatformUserError,
} from '@/lib/platform-users';

const createSchema = z.object({
  email: emailSchema,
  name: z.string().optional(),
  password: z.string().min(8).optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const users = await listPlatformAdmins();
    return json({ success: true, data: { users } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = createSchema.parse(await request.json());
    const result = await grantPlatformAdmin(body);
    return json({
      success: true,
      data: result,
      message: result.created
        ? 'Platform administrator created'
        : 'Existing user granted platform access',
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof PlatformUserError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error(error);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
