import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { deleteApiKey, updateApiKeyPermissions } from '@/lib/api-keys';

const updateApiKeySchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, 'At least one permission is required'),
});

export async function OPTIONS() {
  return optionsResponse();
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return json({ error: error.message }, error.status);
  }
  const keyed = error as { name?: string; status?: number; message?: string };
  if (keyed?.name === 'ApiKeyError' && typeof keyed.status === 'number') {
    return json({ error: keyed.message }, keyed.status);
  }
  const err = error as { errors?: unknown; message?: string };
  if (err.errors) {
    return json({ error: 'Invalid request data', details: err.errors }, 400);
  }
  console.error('API Error:', error);
  return json({ error: 'Internal server error' }, 500);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }

    const { id } = await params;
    const { permissions } = updateApiKeySchema.parse(await request.json());
    await updateApiKeyPermissions(id, session.tenant.id, permissions);

    return json({
      success: true,
      message: 'API key permissions updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }

    const { id } = await params;
    await deleteApiKey(id, session.tenant.id);

    return json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}
