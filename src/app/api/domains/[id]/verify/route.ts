import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { getDomainById, verifyDomainDns } from '@/lib/domains';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }

    const { id } = await params;
    const domain = await getDomainById(id);
    if (!domain || domain.tenant_id !== session.tenant.id) {
      return json({ error: 'Domain not found' }, 404);
    }

    const result = await verifyDomainDns(id);
    return json({
      success: true,
      data: result,
      message: result.verified
        ? 'Domain DNS is complete. Sending is enabled.'
        : 'DNS is not complete. Publish MX, SPF, DKIM, and DMARC exactly as listed, then check again.',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error('API Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
