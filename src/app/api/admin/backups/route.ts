import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { getBackupStatus } from '@/lib/backup-status';
import { pushPendingDumps } from '@/lib/backup-offsite';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    void pushPendingDumps().catch(() => undefined);
    const status = await getBackupStatus();
    return json({ success: true, data: status });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
