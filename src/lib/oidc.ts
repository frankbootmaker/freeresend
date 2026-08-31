import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import { createUser } from './auth';
import { query } from './database';
import { addMembership, getMembership, getTenantBySlug } from './tenants';

export type OidcDiscovery = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri: string;
};

export type OidcClaims = {
  email: string;
  name: string;
  groups: string[];
};

const discoveryCache = new Map<string, { at: number; data: OidcDiscovery }>();
const DISCOVERY_TTL_MS = 5 * 60 * 1000;

export function oidcRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, '')}/api/auth/oidc/callback`;
}

export function requestOrigin(headers: Headers, fallback = ''): string {
  const proto = headers.get('x-forwarded-proto') || 'http';
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  if (host) return `${proto}://${host}`;
  return (fallback || process.env.NEXTAUTH_URL || 'http://localhost:3000')
    .replace(/\/$/, '');
}

export function normalizeIssuer(issuer: string): string {
  return issuer.trim().replace(/\/+$/, '') + '/';
}

export function parseOidcGroups(claims: Record<string, unknown>): string[] {
  const raw = claims.groups ?? claims.ak_groups;
  if (Array.isArray(raw)) {
    return raw.map((value) => String(value).trim()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export function parseOidcClaims(claims: Record<string, unknown>): OidcClaims {
  const email = String(claims.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new Error('OIDC token has no email claim');
  }
  const name = String(
    claims.name || claims.preferred_username || email.split('@')[0] || email,
  ).trim();
  return { email, name, groups: parseOidcGroups(claims) };
}

export function hasAdminGroup(groups: string[], adminGroup: string): boolean {
  const want = adminGroup.trim().toLowerCase();
  if (!want) return false;
  return groups.some((group) => group.trim().toLowerCase() === want);
}

export async function fetchOidcDiscovery(issuer: string): Promise<OidcDiscovery> {
  const normalized = normalizeIssuer(issuer);
  const cached = discoveryCache.get(normalized);
  if (cached && Date.now() - cached.at < DISCOVERY_TTL_MS) {
    return cached.data;
  }
  const url = `${normalized}.well-known/openid-configuration`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Could not load OpenID Provider metadata');
  }
  const data = (await response.json()) as OidcDiscovery;
  if (!data.authorization_endpoint || !data.token_endpoint || !data.jwks_uri) {
    throw new Error('OpenID Provider metadata is incomplete');
  }
  discoveryCache.set(normalized, { at: Date.now(), data });
  return data;
}

function stateSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for OIDC');
  }
  return new TextEncoder().encode(secret);
}

export async function signOidcState(payload: {
  nonce: string;
  redirectUri: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(stateSecret());
}

export async function verifyOidcState(state: string): Promise<{
  nonce: string;
  redirectUri: string;
}> {
  const { payload } = await jwtVerify(state, stateSecret());
  const nonce = String(payload.nonce || '');
  const redirectUri = String(payload.redirectUri || '');
  if (!nonce || !redirectUri) {
    throw new Error('Invalid OIDC state');
  }
  return { nonce, redirectUri };
}

export async function exchangeOidcCode(input: {
  issuer: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  nonce: string;
}): Promise<OidcClaims> {
  const discovery = await fetchOidcDiscovery(input.issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    client_secret: input.clientSecret,
  });
  const tokenRes = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!tokenRes.ok) {
    throw new Error('OIDC token exchange failed');
  }
  const tokens = (await tokenRes.json()) as {
    id_token?: string;
    access_token?: string;
  };
  if (!tokens.id_token) {
    throw new Error('OIDC response had no id_token');
  }

  const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: [discovery.issuer, normalizeIssuer(input.issuer).replace(/\/$/, '')],
    audience: input.clientId,
  });
  if (payload.nonce && payload.nonce !== input.nonce) {
    throw new Error('OIDC nonce mismatch');
  }

  let claims = payload as Record<string, unknown>;
  if (!claims.email && discovery.userinfo_endpoint && tokens.access_token) {
    const userRes = await fetch(discovery.userinfo_endpoint, {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (userRes.ok) {
      claims = {
        ...claims,
        ...((await userRes.json()) as Record<string, unknown>),
      };
    }
  }
  return parseOidcClaims(claims);
}

async function attachPlatformTenant(
  userId: string,
  role: 'owner' | 'member' = 'member',
): Promise<void> {
  const platform = await getTenantBySlug('platform');
  if (!platform) return;
  const existing = await getMembership(platform.id, userId);
  if (existing) {
    if (role === 'owner' && existing.role !== 'owner') {
      await query(
        `UPDATE tenant_memberships SET role = 'owner'
         WHERE tenant_id = $1 AND user_id = $2`,
        [platform.id, userId],
      );
    }
    return;
  }
  await addMembership(platform.id, userId, role);
}

export async function provisionOidcUser(input: {
  email: string;
  name: string;
  groups: string[];
  jitEnabled: boolean;
  adminGroup: string;
}): Promise<{ userId: string } | { error: 'not_provisioned' }> {
  const email = input.email.trim().toLowerCase();
  const found = await query(
    `SELECT id, name, is_platform_admin FROM users WHERE lower(email) = $1 LIMIT 1`,
    [email],
  );
  const existing = found.rows[0] as
    | { id: string; name?: string; is_platform_admin?: boolean }
    | undefined;
  const wantAdmin = hasAdminGroup(input.groups, input.adminGroup);

  if (!existing) {
    if (!input.jitEnabled) {
      return { error: 'not_provisioned' };
    }
    const password = `oidc.${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const created = await createUser(email, password, input.name, wantAdmin);
    await attachPlatformTenant(created.id, wantAdmin ? 'owner' : 'member');
    return { userId: created.id };
  }

  if (wantAdmin && !existing.is_platform_admin) {
    await query('UPDATE users SET is_platform_admin = TRUE WHERE id = $1', [
      existing.id,
    ]);
  }
  if (input.name && !String(existing.name || '').trim()) {
    await query('UPDATE users SET name = $2 WHERE id = $1', [
      existing.id,
      input.name,
    ]);
  }
  await attachPlatformTenant(
    existing.id,
    wantAdmin || existing.is_platform_admin ? 'owner' : 'member',
  );
  return { userId: existing.id };
}
