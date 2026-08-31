import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { testOffsiteConnection } from '@/lib/backup-offsite';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const result = await testOffsiteConnection();
    if (!result.ok) {
      return json({ error: result.error || 'S3 connection failed', data: result }, 400);
    }
    return json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
