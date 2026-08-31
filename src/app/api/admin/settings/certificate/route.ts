import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import { maybeIssueLetsEncryptCertificate } from '@/lib/letsencrypt';
import {
  getPublicPlatformSettings,
  updateTlsIssuanceState,
} from '@/lib/platform-settings';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    await updateTlsIssuanceState({ status: 'pending', error: null });
    void maybeIssueLetsEncryptCertificate(true);
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
