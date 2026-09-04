import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { sendByoSesRequestNotification } from '@/lib/notifications';
import { recordTenantSesByoRequest, TenantError } from '@/lib/tenants';
import { tenantSesByoRequestedAt } from '@/lib/tenant-ses';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }
    if (
      !session.user.isPlatformAdmin
      && session.user.membershipRole === 'member'
    ) {
      return json({ error: 'Insufficient role' }, 403);
    }

    const { tenant, created } = await recordTenantSesByoRequest(
      session.tenant.id,
    );
    if (created) {
      await sendByoSesRequestNotification({
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        requestedBy: session.user.email,
        requestedAt: tenantSesByoRequestedAt(tenant) || new Date().toISOString(),
      });
    }

    return json({
      success: true,
      data: {
        requestedAt: tenantSesByoRequestedAt(tenant),
        created,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof TenantError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
