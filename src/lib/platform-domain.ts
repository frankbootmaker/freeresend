import { getTenantDomains, registerTenantDomain } from '@/lib/domains';
import type { Domain } from '@/lib/database';
import { query } from '@/lib/database';
import {
  getResolvedPlatformSettings,
  updatePlatformSettings,
} from '@/lib/platform-settings';
import { parseTlsHostname } from '@/lib/smtp-tls';
import {
  DEFAULT_PLATFORM_LOCAL_PART,
  emailDomain,
  localPartFromEmail,
  platformFromOnDomain,
  suggestedSystemDomain,
  type SuggestedSystemDomain,
} from '@/lib/system-domain-name';
import { createTenant, getTenantBySlug, type Tenant } from '@/lib/tenants';

export {
  DEFAULT_PLATFORM_LOCAL_PART,
  assertEmailOnDomain,
  hostnameFromPublicUrl,
  localPartFromEmail,
  normalizeLocalPart,
  platformFromOnDomain,
  suggestedSystemDomain,
} from '@/lib/system-domain-name';
export type { SuggestedSystemDomain } from '@/lib/system-domain-name';

export const PLATFORM_TENANT_SLUG = 'platform';

export type PublicSystemDomain = {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
    purpose?: string;
    status?: string;
  }>;
};

export function toPublicSystemDomain(domain: Domain): PublicSystemDomain {
  const records = Array.isArray(domain.dns_records) ? domain.dns_records : [];
  return {
    id: domain.id,
    domain: domain.domain,
    status: domain.status,
    dnsRecords: records.map((record) => {
      const row = record as {
        type?: string;
        name?: string;
        value?: string;
        purpose?: string;
        status?: string;
      };
      return {
        type: String(row.type || ''),
        name: String(row.name || ''),
        value: String(row.value || ''),
        purpose: row.purpose,
        status: row.status,
      };
    }),
  };
}

export async function ensurePlatformTenant(): Promise<Tenant> {
  const existing = await getTenantBySlug(PLATFORM_TENANT_SLUG);
  if (existing) return existing;
  return createTenant({
    name: 'Platform',
    slug: PLATFORM_TENANT_SLUG,
    status: 'active',
  });
}

export async function getPlatformSystemDomain(): Promise<Domain | null> {
  const tenant = await getTenantBySlug(PLATFORM_TENANT_SLUG);
  if (!tenant) return null;
  const domains = await getTenantDomains(tenant.id);
  if (domains.length === 0) return null;
  const settings = await getResolvedPlatformSettings();
  const fromHost = emailDomain(settings.platformFrom);
  return (
    domains.find((domain) => domain.domain.toLowerCase() === fromHost)
    || domains[0]
  );
}

export async function attachPlatformSystemDomain(
  userId: string,
  domainName: string,
): Promise<{
  domain: PublicSystemDomain;
  platformFrom: string;
  setupInstructions: string;
}> {
  const host = parseTlsHostname(domainName);
  if (!host) {
    throw new Error('Invalid domain format');
  }
  const tenant = await ensurePlatformTenant();
  const result = await registerTenantDomain(tenant.id, userId, host);
  const settings = await getResolvedPlatformSettings();
  const currentHost = emailDomain(settings.platformFrom);
  const local = currentHost === host
    ? localPartFromEmail(settings.platformFrom)
    : DEFAULT_PLATFORM_LOCAL_PART;
  const platformFrom = platformFromOnDomain(local, host);
  if (settings.platformFrom !== platformFrom) {
    await updatePlatformSettings({ platformFrom });
  }
  return {
    domain: toPublicSystemDomain(result.domain),
    platformFrom,
    setupInstructions: result.setupInstructions,
  };
}

export async function savePlatformSystemFrom(
  localPart: string,
): Promise<string> {
  const domain = await getPlatformSystemDomain();
  if (!domain) {
    throw new Error('Attach a system domain before setting the From address');
  }
  const platformFrom = platformFromOnDomain(localPart, domain.domain);
  await updatePlatformSettings({ platformFrom });
  return platformFrom;
}

export async function getPlatformSystemDomainState(input: {
  requestOrigin?: string;
} = {}): Promise<{
  suggested: SuggestedSystemDomain;
  domain: PublicSystemDomain | null;
  platformFrom: string;
  localPart: string;
}> {
  const suggested = suggestedSystemDomain({
    requestOrigin: input.requestOrigin,
  });
  const domain = await getPlatformSystemDomain();
  const settings = await getResolvedPlatformSettings();
  const platformFrom = domain
    ? (
      emailDomain(settings.platformFrom) === domain.domain
        ? settings.platformFrom
        : platformFromOnDomain(DEFAULT_PLATFORM_LOCAL_PART, domain.domain)
    )
    : settings.platformFrom;
  return {
    suggested,
    domain: domain ? toPublicSystemDomain(domain) : null,
    platformFrom,
    localPart: domain
      ? localPartFromEmail(platformFrom)
      : DEFAULT_PLATFORM_LOCAL_PART,
  };
}

export async function domainBelongsToPlatform(domainId: string): Promise<boolean> {
  const tenant = await getTenantBySlug(PLATFORM_TENANT_SLUG);
  if (!tenant) return false;
  const result = await query(
    'SELECT id FROM domains WHERE id = $1 AND tenant_id = $2 LIMIT 1',
    [domainId, tenant.id],
  );
  return result.rows.length > 0;
}
