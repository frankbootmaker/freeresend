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

export function tenantAllowsByoSes(tenant: Pick<Tenant, 'metadata'>): boolean {
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

export function withSesByoAllowed(
  metadata: Record<string, unknown> | undefined,
  allowed: boolean,
): Record<string, unknown> {
  return { ...(metadata || {}), [BYO_META_KEY]: allowed };
}
