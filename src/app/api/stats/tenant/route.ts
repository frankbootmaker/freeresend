import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { getSendWindowCounts, getTenantTraffic } from '@/lib/tenants';
import { capsFromTenant } from '@/lib/sending-quota';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    const days = Number(new URL(request.url).searchParams.get('days') || '30');
    const since = new Date(Date.now() - Math.max(days, 1) * 24 * 60 * 60 * 1000);
    const traffic = await getTenantTraffic(session.tenant.id, since);
    const used = await getSendWindowCounts(session.tenant.id);
    const caps = capsFromTenant(session.tenant);
    return json({
      success: true,
      data: {
        traffic,
        quota: {
          hourly: caps.hourly,
          daily: caps.daily,
          monthly: caps.monthly,
          usedHour: used.hour,
          usedDay: used.day,
          used: used.month,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    return json({ error: 'Internal server error' }, 500);
  }
}
