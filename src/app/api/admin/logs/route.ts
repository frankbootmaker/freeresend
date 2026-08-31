import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  listTenantsForLogs,
  parseLogFilters,
  searchPlatformLogs,
} from '@/lib/platform-logs';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const filters = parseLogFilters(request.nextUrl.searchParams);
    const [result, tenants] = await Promise.all([
      searchPlatformLogs(filters),
      listTenantsForLogs(),
    ]);
    return json({ success: true, data: { ...result, tenants } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
