import { NextRequest, NextResponse } from 'next/server';
import { optionsResponse } from '@/lib/http';
import { buildAuthUser, generateJWT } from '@/lib/auth';
import {
  exchangeOidcCode,
  oidcRedirectUri,
  provisionOidcUser,
  requestOrigin,
  verifyOidcState,
} from '@/lib/oidc';
import { getResolvedPlatformSettings } from '@/lib/platform-settings';

export async function OPTIONS() {
  return optionsResponse();
}

function loginRedirect(request: NextRequest, query: string) {
  const origin = requestOrigin(request.headers);
  return NextResponse.redirect(`${origin}/login/oidc?${query}`, 302);
}

export async function GET(request: NextRequest) {
  const denied = request.nextUrl.searchParams.get('error');
  if (denied) {
    return loginRedirect(request, 'error=denied');
  }

  const settings = await getResolvedPlatformSettings();
  if (!settings.oidcEnabled || !settings.oidcIssuer || !settings.oidcClientId) {
    return loginRedirect(request, 'error=unavailable');
  }

  const code = request.nextUrl.searchParams.get('code') || '';
  const state = request.nextUrl.searchParams.get('state') || '';
  if (!code || !state) {
    return loginRedirect(request, 'error=failed');
  }

  try {
    const parsed = await verifyOidcState(state);
    const expected = oidcRedirectUri(requestOrigin(request.headers));
    if (parsed.redirectUri !== expected) {
      return loginRedirect(request, 'error=failed');
    }
    const claims = await exchangeOidcCode({
      issuer: settings.oidcIssuer,
      clientId: settings.oidcClientId,
      clientSecret: settings.oidcClientSecret,
      code,
      redirectUri: parsed.redirectUri,
      nonce: parsed.nonce,
    });
    const provisioned = await provisionOidcUser({
      email: claims.email,
      name: claims.name,
      groups: claims.groups,
      jitEnabled: settings.oidcJitEnabled,
      adminGroup: settings.oidcAdminGroup,
    });
    if ('error' in provisioned) {
      return loginRedirect(request, 'error=not_provisioned');
    }
    const authUser = await buildAuthUser(provisioned.userId);
    if (!authUser) {
      return loginRedirect(request, 'error=not_provisioned');
    }
    return loginRedirect(
      request,
      `token=${encodeURIComponent(generateJWT(authUser))}`,
    );
  } catch (error) {
    console.error('OIDC callback failed:', error);
    return loginRedirect(request, 'error=failed');
  }
}
