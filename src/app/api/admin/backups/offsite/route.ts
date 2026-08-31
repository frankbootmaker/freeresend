import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  getOffsiteSettings,
  toPublicOffsite,
  updateOffsiteSettings,
} from '@/lib/backup-offsite';

export async function OPTIONS() {
  return optionsResponse();
}

const schema = z.object({
  enabled: z.boolean().optional(),
  endpoint: z.string().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  prefix: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = schema.parse(await request.json());
    const settings = await updateOffsiteSettings(body);
    return json({ success: true, data: { offsite: toPublicOffsite(settings) } });
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

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const settings = await getOffsiteSettings();
    return json({ success: true, data: { offsite: toPublicOffsite(settings) } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
