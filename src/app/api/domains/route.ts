import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { getTenantDomains, registerTenantDomain } from '@/lib/domains';

const addDomainSchema = z.object({
  domain: z.string().min(1),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }
    const domains = await getTenantDomains(session.tenant.id);
    return json({
      success: true,
      data: {
        domains,
        outboundTransport: session.tenant.outbound_transport || 'ses',
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }
    const { domain } = addDomainSchema.parse(await request.json());
    const result = await registerTenantDomain(
      session.tenant.id,
      session.user.id,
      domain,
    );
    return json({
      success: true,
      data: result,
      message: result.setupInstructions,
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    return json({ error: err.message || 'Internal server error' }, 400);
  }
}
