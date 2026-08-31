import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformDashboard } from '@/lib/admin-guard';
import { McpTokenError, revokeMcpToken } from '@/lib/mcp-tokens';

export async function OPTIONS() {
  return optionsResponse();
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformDashboard(request);
    const { id } = await params;
    await revokeMcpToken({ id, kind: 'platform' });
    return json({ success: true, data: { revoked: true } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof McpTokenError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
