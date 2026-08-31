import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  PlatformUserError,
  revokePlatformAdmin,
  updatePlatformAdmin,
} from '@/lib/platform-users';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdmin(request);
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const user = await updatePlatformAdmin({ id, ...body });
    return json({ success: true, data: { user } });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePlatformAdmin(request);
    const { id } = await params;
    await revokePlatformAdmin({
      actorId: session.user!.id,
      targetId: id,
    });
    return json({ success: true, data: { revoked: true } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof PlatformUserError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
