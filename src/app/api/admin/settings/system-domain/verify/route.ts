import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { getDomainById, verifyDomainDns } from '@/lib/domains';
import { requestOrigin } from '@/lib/oidc';
import {
  domainBelongsToPlatform,
  getPlatformSystemDomainState,
} from '@/lib/platform-domain';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const domain = await getPlatformSystemDomainState({
      requestOrigin: requestOrigin(request.headers),
    });
    if (!domain.domain) {
      return json({ error: 'No system domain attached' }, 400);
    }
    const owned = await domainBelongsToPlatform(domain.domain.id);
    const row = await getDomainById(domain.domain.id);
    if (!owned || !row) {
      return json({ error: 'System domain not found' }, 404);
    }
    const result = await verifyDomainDns(row.id);
    const state = await getPlatformSystemDomainState({
      requestOrigin: requestOrigin(request.headers),
    });
    return json({
      success: true,
      data: { ...state, verified: result.verified },
      message: result.verified
        ? 'Domain DNS is complete. Platform sending is enabled.'
        : 'DNS is not complete. Publish MX, SPF, DKIM, and DMARC exactly as listed, then check again.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
