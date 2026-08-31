import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import {
  getPublicPlatformSettings,
  updatePlatformSettings,
} from '@/lib/platform-settings';
import { maybeIssueLetsEncryptCertificate } from '@/lib/letsencrypt';
import { invalidateSesClient } from '@/lib/ses';

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || emailSchema.safeParse(value).success,
    'Invalid email',
  );

const schema = z.object({
  sesRegion: z.string().optional(),
  sesAccessKeyId: z.string().optional(),
  sesSecretAccessKey: z.string().optional(),
  sesConfigurationSet: z.string().optional(),
  smtpEnabled: z.boolean().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().int().positive().optional(),
  smtpSecure: z.boolean().optional(),
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  alertEmail: optionalEmail,
  alertFrom: optionalEmail,
  smtpListenPorts: z.array(z.union([
    z.literal(2525),
    z.literal(587),
    z.literal(465),
  ])).min(1).optional(),
  smtpIngressTlsMode: z.enum(['off', 'starttls', 'required']).optional(),
  smtpIngressTlsCert: z.string().optional(),
  smtpIngressTlsKey: z.string().optional(),
  smtpIngressTlsSource: z.enum(['letsencrypt', 'manual']).optional(),
  smtpIngressTlsDomain: z.string().optional(),
  smtpIngressAcmeChallenge: z.enum([
    'http-01',
    'dns-digitalocean',
    'dns-ispconfig',
    'dns-manual',
  ]).optional(),
  smtpIngressIspconfigUrl: z.string().optional(),
  smtpIngressIspconfigUser: z.string().optional(),
  smtpIngressIspconfigPassword: z.string().optional(),
  smtpIngressIspconfigInsecure: z.boolean().optional(),
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
    const settings = await getPublicPlatformSettings();
    return json({ success: true, data: { settings } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const body = schema.parse(await request.json());
    const resolved = await updatePlatformSettings(body);
    invalidateSesClient();
    if (resolved.smtpIngressTlsSource === 'letsencrypt') {
      void maybeIssueLetsEncryptCertificate(false);
    }
    const settings = await getPublicPlatformSettings();
    return json({ success: true, data: { settings } });
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
