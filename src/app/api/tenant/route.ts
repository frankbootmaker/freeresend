import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import {
  assertCanSelfDeleteTenant,
  assertTenantNameConfirmed,
  deleteTenant,
  TenantError,
  updateTenantRouting,
} from '@/lib/tenants';
import { SMTP_SUBMISSION_USERNAME } from '@/lib/brand';
import { getResolvedPlatformSettings } from '@/lib/platform-settings';
import { resolveSmtpPublicPorts } from '@/lib/smtp-listen';

const deleteSchema = z.object({
  confirmName: z.string().min(1),
});

const schema = z.object({
  inboundTransport: z.enum(['https', 'smtp', 'both']).optional(),
  outboundTransport: z.enum(['ses', 'smtp']).optional(),
  smtpUpstream: z
    .union([
      z.null(),
      z.object({
        host: z.string(),
        port: z.number().int(),
        secure: z.boolean().optional().default(false),
        username: z.string().optional(),
        password: z.string().optional(),
      }),
    ])
    .optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    const smtp = session.tenant.smtp_upstream;
    const platform = await getResolvedPlatformSettings();
    return json({
      success: true,
      data: {
        tenant: {
          id: session.tenant.id,
          slug: session.tenant.slug,
          name: session.tenant.name,
          status: session.tenant.status,
          monthly_email_quota: session.tenant.monthly_email_quota,
          inbound_transport: session.tenant.inbound_transport,
          outbound_transport: session.tenant.outbound_transport,
          smtp_upstream: smtp
            ? {
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                username: smtp.username,
                password: smtp.password ? '********' : undefined,
              }
            : null,
        },
        smtpIngress: {
          host: process.env.SMTP_PUBLIC_HOST || 'localhost',
          ...resolveSmtpPublicPorts(process.env, platform.smtpListenPorts),
          tlsMode: platform.smtpIngressTlsMode,
          tlsConfigured: Boolean(
            platform.smtpIngressTlsCert && platform.smtpIngressTlsKey,
          ),
          username: SMTP_SUBMISSION_USERNAME,
          passwordHint: 'Use a RelayHorizon API key as the SMTP password',
        },
        ses: {
          region: platform.sesRegion,
          configurationSet: platform.sesConfigurationSet,
        },
        platformSmtpRelay: {
          enabled: platform.smtpEnabled && Boolean(platform.smtpHost),
          host: platform.smtpEnabled ? platform.smtpHost : '',
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user) {
      return json({ error: 'Dashboard session required' }, 401);
    }
    if (
      !session.user.isPlatformAdmin &&
      session.user.membershipRole === 'member'
    ) {
      return json({ error: 'Insufficient role' }, 403);
    }
    const body = schema.parse(await request.json());
    if (!body.inboundTransport && !body.outboundTransport) {
      return json({ error: 'No routing changes provided' }, 400);
    }
    const tenant = await updateTenantRouting(session.tenant.id, {
      inboundTransport: body.inboundTransport,
      outboundTransport: body.outboundTransport,
      smtpUpstream: body.smtpUpstream,
    });
    return json({ success: true, data: { tenant } });
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user || session.mcp || session.apiKey) {
      return json({ error: 'Dashboard session required' }, 401);
    }
    const body = deleteSchema.parse(await request.json());
    assertCanSelfDeleteTenant({
      slug: session.tenant.slug,
      actorRole: session.user.membershipRole,
      isPlatformAdmin: session.user.isPlatformAdmin,
    });
    assertTenantNameConfirmed(session.tenant.name, body.confirmName);
    await deleteTenant(session.tenant.id);
    return json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof TenantError) {
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
