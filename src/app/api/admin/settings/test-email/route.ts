import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { sendPlatformSystemEmail } from '@/lib/mail-transport';

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
    const messageId = await sendPlatformSystemEmail(
      {
        from: body.from,
        to: [body.to],
        subject: 'RelayHorizon configuration test',
        text:
          'This is a test message from RelayHorizon portal Configuration. '
          + `Transport: ${body.via}.`,
        html:
          '<p>This is a test message from RelayHorizon portal Configuration.</p>'
          + `<p>Transport: <strong>${body.via}</strong></p>`,
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
