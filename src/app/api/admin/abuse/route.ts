import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import {
  isOpenAbuseRow,
  loadPlatformAbuseQueue,
} from '@/lib/abuse-health';
import { paginationMeta, parsePagination } from '@/lib/pagination';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const openOnly = request.nextUrl.searchParams.get('open') === '1';
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const queue = await loadPlatformAbuseQueue();
    const filtered = openOnly ? queue.filter(isOpenAbuseRow) : queue;
    const tenants = filtered.slice(offset, offset + limit);
    return json({
      success: true,
      data: {
        tenants,
        openCount: queue.filter(isOpenAbuseRow).length,
        pagination: paginationMeta(page, limit, filtered.length),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('GET /api/admin/abuse failed', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
