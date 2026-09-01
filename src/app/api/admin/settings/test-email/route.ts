import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { sendPlatformSystemEmail } from '@/lib/mail-transport';
import { renderSystemEmail } from '@/lib/system-email';
import {
  assertEmailOnDomain,
  getPlatformSystemDomain,
} from '@/lib/platform-domain';

const schema = z.object({
  from: emailSchema,
  to: emailSchema,
  via: z.enum(['ses', 'smtp']),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const body = schema.parse(await request.json());
    const systemDomain = await getPlatformSystemDomain();
    if (systemDomain) {
      assertEmailOnDomain(body.from, systemDomain.domain);
    }
    const { html, text } = renderSystemEmail({
      title: 'Configuration test',
      lead: 'Portal Configuration reached this mailbox.',
      bodyHtml:
        `<p style="margin:0 0 12px;">This is a test message from RelayHorizon portal Configuration.</p>`
        + `<p style="margin:0;">Transport: <strong>${body.via}</strong></p>`,
      bodyText:
        'This is a test message from RelayHorizon portal Configuration. '
        + `Transport: ${body.via}.`,
      footerNote: `Sent via ${body.via}.`,
    });
    const messageId = await sendPlatformSystemEmail(
      {
        from: body.from,
        to: [body.to],
        subject: 'RelayHorizon configuration test',
        text,
        html,
        tags: { type: 'platform_config_test' },
      },
      body.via,
    );
    return json({ success: true, data: { messageId, via: body.via } });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error(error);
    return json({ error: err.message || 'Send failed' }, 400);
  }
}
