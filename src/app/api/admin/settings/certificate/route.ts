import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import {
  continueManualDnsCertificate,
  maybeIssueLetsEncryptCertificate,
} from '@/lib/letsencrypt';
import {
  getPublicPlatformSettings,
  updateTlsIssuanceState,
} from '@/lib/platform-settings';

const schema = z.object({
  action: z.enum(['issue', 'continue']).optional(),
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
    let body: { action?: 'issue' | 'continue' } = {};
    try {
      body = schema.parse(await request.json());
    } catch {
      body = {};
    }

    if (body.action === 'continue') {
      await updateTlsIssuanceState({ status: 'pending', error: null });
      void continueManualDnsCertificate();
    } else {
      await updateTlsIssuanceState({ status: 'pending', error: null });
      void maybeIssueLetsEncryptCertificate(true);
    }
    const settings = await getPublicPlatformSettings();
    return json({ success: true, data: { settings, started: true } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
