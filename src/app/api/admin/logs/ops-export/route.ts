import { NextRequest, NextResponse } from 'next/server';
import { json, optionsResponse, cors } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { buildOpsExport } from '@/lib/ops-export';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const days = Number(request.nextUrl.searchParams.get('days') || 7);
    const payload = await buildOpsExport(days);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const body = `${JSON.stringify(payload, null, 2)}\n`;
    const response = new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition':
          `attachment; filename="relayhorizon-ops-log-${payload.window.days}d-${stamp}.json"`,
      },
    });
    return cors(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
