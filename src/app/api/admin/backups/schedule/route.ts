import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { backupDir } from '@/lib/backups';
import {
  SCHEDULE_INTERVAL_PRESETS,
  writeSchedulePolicy,
} from '@/lib/backup-schedule';

export async function OPTIONS() {
  return optionsResponse();
}

const schema = z.object({
  enabled: z.boolean(),
  intervalSeconds: z.union(
    SCHEDULE_INTERVAL_PRESETS.map((value) => z.literal(value)) as [
      z.ZodLiteral<3600>,
      z.ZodLiteral<21600>,
      z.ZodLiteral<43200>,
      z.ZodLiteral<86400>,
      z.ZodLiteral<604800>,
    ],
  ),
});

export async function PUT(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const body = schema.parse(await request.json());
    const policy = await writeSchedulePolicy(backupDir(), body);
    return json({ success: true, data: { schedule: policy } });
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
