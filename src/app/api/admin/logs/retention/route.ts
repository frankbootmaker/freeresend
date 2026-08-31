import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  getLogRetention,
  parseRetentionPatch,
  updateLogRetention,
} from '@/lib/platform-logs';

export async function OPTIONS() {
  return optionsResponse();
}

const schema = z.object({
  keepDays: z.coerce.number().int().min(0).max(3650).optional(),
  stripBodyDays: z.coerce.number().int().min(0).max(3650).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const retention = await getLogRetention();
    return json({ success: true, data: { retention } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = schema.parse(await request.json());
    const current = await getLogRetention();
    const retention = await updateLogRetention(
      parseRetentionPatch({
        keepDays: body.keepDays ?? current.keepDays,
        stripBodyDays: body.stripBodyDays ?? current.stripBodyDays,
      }),
    );
    return json({ success: true, data: { retention } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
