import type { Tenant } from './tenants';

export type SesAccountMode = 'platform' | 'byo';

export type TenantSesConfig = {
  mode?: SesAccountMode;
  region?: string;
  configurationSet?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

const BYO_META_KEY = 'ses_byo_allowed';
const BYO_REQUESTED_KEY = 'ses_byo_requested_at';

/** Stable slug for the future BYO billing / invoice group (phase B). */
export const BYO_INVOICE_GROUP = 'byo-ses-relay';

export function parseJsonRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function parseTenantSesConfig(value: unknown): TenantSesConfig | null {
  const record = parseJsonRecord(value);
  if (!record) return null;
  return {
    mode: record.mode === 'byo' ? 'byo' : 'platform',
    region: typeof record.region === 'string' ? record.region : undefined,
    configurationSet:
      typeof record.configurationSet === 'string'
        ? record.configurationSet
        : undefined,
    accessKeyId:
      typeof record.accessKeyId === 'string' ? record.accessKeyId : undefined,
    secretAccessKey:
      typeof record.secretAccessKey === 'string'
        ? record.secretAccessKey
        : undefined,
  };
}

export function tenantAllowsByoSes(
  tenant: Pick<Tenant, 'metadata'> & { sending_tier?: string },
): boolean {
  if (tenant.sending_tier === 'byo') return true;
  return tenant.metadata?.[BYO_META_KEY] === true;
}

export function tenantSesMode(
  tenant: Pick<Tenant, 'metadata' | 'ses_config'>,
): SesAccountMode {
  if (!tenantAllowsByoSes(tenant)) return 'platform';
  return tenant.ses_config?.mode === 'byo' ? 'byo' : 'platform';
}

export function tenantSesSendAccount(tenant: Tenant): TenantSesConfig | undefined {
  if (tenantSesMode(tenant) !== 'byo') return undefined;
  const config = tenant.ses_config;
  if (!config?.accessKeyId || !config.secretAccessKey) {
    throw new Error('Tenant SES is not configured');
  }
  return config;
}

export function tenantSesByoRequestedAt(
  tenant: Pick<Tenant, 'metadata'>,
): string | undefined {
  const value = tenant.metadata?.[BYO_REQUESTED_KEY];
  return typeof value === 'string' && value ? value : undefined;
}

export function tenantHasPendingByoRequest(
  tenant: Pick<Tenant, 'metadata'>,
): boolean {
  return Boolean(tenantSesByoRequestedAt(tenant)) && !tenantAllowsByoSes(tenant);
}

export const TENANT_REGISTRY_FILTERS = ['requested', 'approved'] as const;
export type TenantRegistryFilter = (typeof TENANT_REGISTRY_FILTERS)[number];

const REGISTRY_FILTER_SEARCH: Record<TenantRegistryFilter, string[]> = {
  requested: ['byo requested', 'byo angefragt', 'saját ses kérve'],
  approved: ['byo approved', 'byo genehmigt', 'saját ses jóváhagyva'],
};

export function parseTenantRegistryFilter(
  value?: string | null,
): TenantRegistryFilter | undefined {
  return TENANT_REGISTRY_FILTERS.find((item) => item === value);
}

export function registryFilterFromSearch(
  value?: string | null,
  labels?: Partial<Record<TenantRegistryFilter, string>>,
): TenantRegistryFilter | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  const fromAlias = TENANT_REGISTRY_FILTERS.find((item) =>
    REGISTRY_FILTER_SEARCH[item].includes(normalized),
  );
  if (fromAlias) return fromAlias;
  return TENANT_REGISTRY_FILTERS.find((item) => {
    const label = labels?.[item]?.trim().toLowerCase();
    return Boolean(label && label === normalized);
  });
}

export function withSesByoAllowed(
  metadata: Record<string, unknown> | undefined,
  allowed: boolean,
): Record<string, unknown> {
  return { ...(metadata || {}), [BYO_META_KEY]: allowed };
}

export function withSesByoRequested(
  metadata: Record<string, unknown> | undefined,
  requestedAt: string,
): Record<string, unknown> {
  return { ...(metadata || {}), [BYO_REQUESTED_KEY]: requestedAt };
}

export function withoutSesByoRequest(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const next = { ...(metadata || {}) };
  delete next[BYO_REQUESTED_KEY];
  return next;
}
