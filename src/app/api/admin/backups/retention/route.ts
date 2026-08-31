import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { backupDir } from '@/lib/backups';
import { writeRetentionPolicy } from '@/lib/backup-retention';

export async function OPTIONS() {
  return optionsResponse();
}

const schema = z.object({
  keepDaily: z.coerce.number().int().min(1).max(90),
  keepWeekly: z.coerce.number().int().min(0).max(52),
  keepMonthly: z.coerce.number().int().min(0).max(36),
  autoRotate: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = schema.parse(await request.json());
    const policy = await writeRetentionPolicy(backupDir(), body);
    return json({ success: true, data: { retention: policy } });
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
