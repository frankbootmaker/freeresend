import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformDashboard } from '@/lib/admin-guard';
import {
  createMcpToken,
  listMcpTokensPage,
  McpTokenError,
} from '@/lib/mcp-tokens';
import { paginationMeta, parsePagination } from '@/lib/pagination';

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformDashboard(request);
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const { agents, total } = await listMcpTokensPage({
      kind: 'platform',
      limit,
      offset,
    });
    return json({
      success: true,
      data: { agents, pagination: paginationMeta(page, limit, total) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePlatformDashboard(request);
    const body = createSchema.parse(await request.json());
    const created = await createMcpToken({
      tenantId: null,
      name: body.name,
      createdBy: session.user!.id,
    });
    return json({
      success: true,
      data: { agent: created.record, token: created.token },
      message: 'Store this agent token now; it is not shown again.',
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof McpTokenError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error(error);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
