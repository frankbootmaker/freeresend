import type { Tenant } from './tenants';
import { tenantSesMode } from './tenant-ses';

export const EGRESS_PREFERENCES = ['auto', 'ses', 'smtp'] as const;
export type EgressPreference = (typeof EGRESS_PREFERENCES)[number];
export type OutboundHop = 'ses' | 'smtp';

export function parseEgressPreference(value: unknown): EgressPreference {
  return value === 'ses' || value === 'smtp' ? value : 'auto';
}

export function resolveOutboundHop(
  tenant: Pick<Tenant, 'outbound_transport'>,
  preference: EgressPreference = 'auto',
): OutboundHop {
  if (preference === 'ses' || preference === 'smtp') return preference;
  return tenant.outbound_transport === 'smtp' ? 'smtp' : 'ses';
}

export function smtpEgressReady(
  tenant: Pick<Tenant, 'smtp_upstream'>,
  platform: { smtpEnabled?: boolean; smtpHost?: string | null },
): boolean {
  if (tenant.smtp_upstream?.host) return true;
  return Boolean(platform.smtpEnabled && platform.smtpHost);
}

export function sesEgressReady(
  tenant: Pick<Tenant, 'metadata' | 'ses_config' | 'sending_tier'>,
  platform: {
    sesAccessKeyId?: string | null;
    sesSecretAccessKey?: string | null;
  },
): boolean {
  if (tenantSesMode(tenant) === 'byo') {
    return Boolean(
      tenant.ses_config?.accessKeyId && tenant.ses_config?.secretAccessKey,
    );
  }
  return Boolean(platform.sesAccessKeyId && platform.sesSecretAccessKey);
}

export function missingEgressMessage(
  hop: OutboundHop,
  preference: EgressPreference,
): string {
  if (hop === 'smtp') {
    return preference === 'smtp'
      ? 'SMTP egress is not configured for this API key'
      : 'Tenant SMTP upstream is not configured';
  }
  return preference === 'ses'
    ? 'SES egress is not configured for this API key'
    : 'SES credentials are not configured';
}
