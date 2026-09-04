import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { loadTenantAbuseSnapshot } from '@/lib/abuse-health';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    const snapshot = await loadTenantAbuseSnapshot(session.tenant);
    return json({ success: true, data: snapshot });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('GET /api/tenant/abuse failed', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
