import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { generateApiKey, getTenantApiKeysPage } from '@/lib/api-keys';
import { paginationMeta, parsePagination } from '@/lib/pagination';
import { getDomainById } from '@/lib/domains';

const createApiKeySchema = z.object({
  domainId: z.string().uuid(),
  keyName: z.string().min(1),
  permissions: z.array(z.string()).optional().default(['send']),
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
    const { page, limit, offset } = parsePagination(request.nextUrl.searchParams);
    const { apiKeys, total } = await getTenantApiKeysPage(session.tenant.id, {
      limit,
      offset,
    });
    return json({
      success: true,
      data: { apiKeys, pagination: paginationMeta(page, limit, total) },
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
    const { domainId, keyName, permissions } = createApiKeySchema.parse(
      await request.json(),
    );
    const domain = await getDomainById(domainId);
    if (!domain || domain.tenant_id !== session.tenant.id) {
      return json({ error: 'Domain not found or unauthorized' }, 404);
    }
    if (domain.status !== 'verified') {
      return json(
        { error: 'Domain must be verified before creating API keys' },
        400,
      );
    }
    const apiKey = await generateApiKey(
      session.user.id,
      domainId,
      keyName,
      permissions,
      session.tenant.id,
    );
    return json({
      success: true,
      data: { apiKey },
      message:
        'API key created successfully. Save it securely - it will not be shown again.',
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
