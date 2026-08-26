import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { updateTenantRouting } from '@/lib/tenants';

const schema = z.object({
  inboundTransport: z.enum(['https', 'smtp', 'both']).optional(),
  outboundTransport: z.enum(['ses', 'smtp']).optional(),
  smtpUpstream: z
    .object({
      host: z.string().min(1),
      port: z.number().int(),
      secure: z.boolean().optional().default(false),
      username: z.string().optional(),
      password: z.string().optional(),
    })
    .optional(),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    const smtp = session.tenant.smtp_upstream;
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
          port: Number(process.env.SMTP_PUBLIC_PORT || 2525),
          username: 'outpost',
          passwordHint: 'Use an OutPost API key as the SMTP password',
        },
        ses: {
          region: process.env.AWS_REGION || 'us-east-1',
          configurationSet: process.env.SES_CONFIGURATION_SET || 'outpost-prod',
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
