import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  grantPlatformAdmin,
  listPlatformAdminsPage,
  PlatformUserError,
} from '@/lib/platform-users';
import { likeQuery, paginationMeta, parsePagination } from '@/lib/pagination';

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
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const q = likeQuery(request.nextUrl.searchParams.get('q'));
    const { users, total } = await listPlatformAdminsPage({ q, limit, offset });
    return json({
      success: true,
      data: { users, pagination: paginationMeta(page, limit, total) },
    });
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
