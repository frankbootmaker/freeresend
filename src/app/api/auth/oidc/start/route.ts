import { NextRequest, NextResponse } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import {
  fetchOidcDiscovery,
  oidcRedirectUri,
  requestOrigin,
  signOidcState,
} from '@/lib/oidc';
import { getResolvedPlatformSettings } from '@/lib/platform-settings';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(request: NextRequest) {
  const settings = await getResolvedPlatformSettings();
  if (!settings.oidcEnabled || !settings.oidcIssuer || !settings.oidcClientId) {
    return json({ error: 'OIDC is not enabled' }, 400);
  }

  try {
    const origin = requestOrigin(request.headers);
    const redirectUri = oidcRedirectUri(origin);
    const nonce = crypto.randomUUID();
    const state = await signOidcState({ nonce, redirectUri });
    const discovery = await fetchOidcDiscovery(settings.oidcIssuer);
    const authorize = new URL(discovery.authorization_endpoint);
    authorize.searchParams.set('response_type', 'code');
    authorize.searchParams.set('client_id', settings.oidcClientId);
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('scope', 'openid email profile');
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('nonce', nonce);
    return NextResponse.redirect(authorize.toString(), 302);
  } catch (error) {
    console.error('OIDC start failed:', error);
    return json({ error: 'Could not start OIDC sign-in' }, 502);
  }
}
