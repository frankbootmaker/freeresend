import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { setupCustomer, listTenantsPage, type SmtpUpstream } from '@/lib/tenants';
import { paginationMeta, parsePagination } from '@/lib/pagination';
import {
  parseTenantRegistryFilter,
  registryFilterFromSearch,
} from '@/lib/tenant-ses';

const setupSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  ownerEmail: emailSchema,
  ownerName: z.string().optional(),
  ownerPassword: z.string().min(8).optional(),
  quota: z.number().int().positive().optional(),
  outboundTransport: z.enum(['ses', 'smtp']).optional(),
  inboundTransport: z.enum(['https', 'smtp', 'both']).optional(),
  smtpUpstream: z
    .object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),
  domain: z.string().optional(),
  createApiKey: z.boolean().optional(),
  createMcpToken: z.boolean().optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const rawQ = request.nextUrl.searchParams.get('q');
    const registryFilter = parseTenantRegistryFilter(
      request.nextUrl.searchParams.get('byo'),
    ) || registryFilterFromSearch(rawQ);
    const q = registryFilter && registryFilterFromSearch(rawQ) ? null : rawQ;
    const { tenants, total } = await listTenantsPage({
      q,
      registryFilter,
      limit,
      offset,
    });
    return json({
      success: true,
      data: { tenants, pagination: paginationMeta(page, limit, total) },
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
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const body = setupSchema.parse(await request.json());
    const result = await setupCustomer({
      ...body,
      smtpUpstream: body.smtpUpstream as SmtpUpstream | undefined,
    });
    return json({
      success: true,
      data: result,
      message:
        'Customer created. Store API key and MCP token now; they are not shown again.',
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
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
