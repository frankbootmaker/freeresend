import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { pushDumpOffsite } from '@/lib/backup-offsite';

export async function OPTIONS() {
  return optionsResponse();
}

const schema = z.object({
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await pushDumpOffsite({ name: body.name });
    return json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: (error as Error).message || 'Offsite push failed' }, 400);
  }
}
