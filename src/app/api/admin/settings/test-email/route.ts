import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { sendPlatformSystemEmail } from '@/lib/mail-transport';
import { resolveMailLocale } from '@/lib/mail-locale';
import { renderSystemEmail } from '@/lib/system-email';
import { systemMailCopy } from '@/lib/system-mail-i18n';
import {
  assertEmailOnDomain,
  getPlatformSystemDomain,
} from '@/lib/platform-domain';

const schema = z.object({
  from: emailSchema,
  to: emailSchema,
  via: z.enum(['ses', 'smtp']),
  locale: z.enum(['en', 'de', 'hu']).optional(),
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
    const locale = await resolveMailLocale({
      userId: session.user.id,
      requested: body.locale,
    });
    const copy = systemMailCopy(locale).configTest;
    const { html, text } = renderSystemEmail({
      title: copy.title,
      lead: copy.lead,
      bodyHtml: copy.bodyHtml(body.via),
      bodyText: copy.bodyText(body.via),
      footerNote: copy.footer(body.via),
    });
    const messageId = await sendPlatformSystemEmail(
      {
        from: body.from,
        to: [body.to],
        subject: copy.subject,
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
