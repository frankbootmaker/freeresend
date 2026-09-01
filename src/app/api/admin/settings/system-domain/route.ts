import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { requestOrigin } from '@/lib/oidc';
import {
  attachPlatformSystemDomain,
  getPlatformSystemDomainState,
  savePlatformSystemFrom,
} from '@/lib/platform-domain';
import { suggestedSystemDomain } from '@/lib/system-domain-name';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';

const attachSchema = z.object({
  useWebHost: z.boolean().optional(),
  domain: z.string().optional(),
});

const fromSchema = z.object({
  localPart: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9._+-]+$/i, 'Invalid local part'),
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
    const state = await getPlatformSystemDomainState({
      requestOrigin: requestOrigin(request.headers),
    });
    return json({ success: true, data: state });
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
    const body = attachSchema.parse(await request.json());
    const suggested = suggestedSystemDomain({
      requestOrigin: requestOrigin(request.headers),
    });
    const domainName = body.useWebHost
      ? suggested.domain
      : (body.domain || '').trim();
    if (!domainName) {
      return json({ error: 'No system domain to attach' }, 400);
    }
    if (body.useWebHost && !suggested.isPublic) {
      return json(
        { error: 'The current web host is not a public sending domain' },
        400,
      );
    }
    const result = await attachPlatformSystemDomain(session.user.id, domainName);
    const state = await getPlatformSystemDomainState({
      requestOrigin: requestOrigin(request.headers),
    });
    return json({
      success: true,
      data: { ...state, ...result },
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
    console.error(error);
    return json({ error: err.message || 'Failed to attach system domain' }, 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const body = fromSchema.parse(await request.json());
    const platformFrom = await savePlatformSystemFrom(body.localPart);
    const state = await getPlatformSystemDomainState({
      requestOrigin: requestOrigin(request.headers),
    });
    return json({
      success: true,
      data: { ...state, platformFrom },
    });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    return json({ error: err.message || 'Failed to save From address' }, 400);
  }
}
