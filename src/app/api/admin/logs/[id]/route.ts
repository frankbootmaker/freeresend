import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { getPlatformLog } from '@/lib/platform-logs';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdmin(request);
    const { id } = await params;
    const email = await getPlatformLog(id);
    if (!email) {
      return json({ error: 'Email log not found' }, 404);
    }
    return json({ success: true, data: { email } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
