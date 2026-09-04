import { getSendWindowCounts, getTenantTraffic, listTenants } from './tenants';
import { capsFromTenant, type SendWindowCaps, type SendWindowCounts } from './sending-quota';
import { parseBillingMode, parseSendingTier, type BillingMode, type SendingTier } from './sending-tier';
import { countSuppressedRecipients } from './suppression';

export const CAP_WARN_RATIO = 0.8;
export const BOUNCE_MIN_VOLUME = 50;
export const BOUNCE_WARN_RATE = 0.05;
export const BOUNCE_HIGH_RATE = 0.1;
export const COMPLAINT_MIN_VOLUME = 20;
export const COMPLAINT_HIGH_COUNT = 3;
export const COMPLAINT_HIGH_RATE = 0.001;
export const COMPLAINT_HIGH_RATE_VOLUME = 100;
export const SUPPRESSION_WARN_COUNT = 20;

export type AbuseSeverity = 'info' | 'warn' | 'high';

export type AbuseWarningCode =
  | 'suspended'
  | 'frozen'
  | 'cap_hour'
  | 'cap_day'
  | 'cap_month'
  | 'bounce_rate'
  | 'complaint_rate'
  | 'suppressions';

export type BreakerTripReason = 'bounce_rate' | 'complaint_rate';

export type AbuseWarning = {
  code: AbuseWarningCode;
  severity: AbuseSeverity;
};

export type TenantAbuseSnapshot = {
  sendingTier: SendingTier;
  billingMode: BillingMode;
  status: string;
  sendingFrozenAt: string | null;
  sendingFrozenReason: string | null;
  caps: SendWindowCaps;
  used: SendWindowCounts;
  last24h: {
    total: number;
    bounced: number;
    complained: number;
    bounceRate: number;
    complaintRate: number;
    since: string;
  };
  suppressionCount: number;
  warnings: AbuseWarning[];
};

export type PlatformAbuseRow = TenantAbuseSnapshot & {
  tenantId: string;
  name: string;
  slug: string;
};

export function warningRank(
  warnings: AbuseWarning[],
  frozen?: boolean,
): number {
  if (frozen || warnings.some((warning) => warning.severity === 'high')) {
    return 3;
  }
  if (warnings.some((warning) => warning.severity === 'warn')) {
    return 2;
  }
  if (warnings.length > 0) {
    return 1;
  }
  return 0;
}

export function isOpenAbuseRow(row: {
  sendingFrozenAt?: string | null;
  warnings: AbuseWarning[];
}): boolean {
  return Boolean(row.sendingFrozenAt) || row.warnings.length > 0;
}

export function sortAbuseQueue<
  T extends { name: string; sendingFrozenAt?: string | null; warnings: AbuseWarning[] },
>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const rankDelta =
      warningRank(right.warnings, Boolean(right.sendingFrozenAt))
      - warningRank(left.warnings, Boolean(left.sendingFrozenAt));
    if (rankDelta !== 0) return rankDelta;
    return left.name.localeCompare(right.name);
  });
}

export function rateFromCounts(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

export function capRatio(used: number, cap: number): number {
  if (cap <= 0) return 0;
  return used / cap;
}

function capWarning(
  code: 'cap_hour' | 'cap_day' | 'cap_month',
  used: number,
  cap: number,
): AbuseWarning | null {
  const ratio = capRatio(used, cap);
  if (ratio >= 1) return { code, severity: 'high' };
  if (ratio >= CAP_WARN_RATIO) return { code, severity: 'warn' };
  return null;
}

export function evaluateSendingBreaker(last24h: {
  total: number;
  bounced: number;
  complained: number;
}): BreakerTripReason | null {
  const bounceRate = rateFromCounts(last24h.bounced, last24h.total);
  if (last24h.total >= BOUNCE_MIN_VOLUME && bounceRate >= BOUNCE_HIGH_RATE) {
    return 'bounce_rate';
  }
  const complaintRate = rateFromCounts(last24h.complained, last24h.total);
  if (
    last24h.complained >= COMPLAINT_HIGH_COUNT
    || (
      last24h.total >= COMPLAINT_HIGH_RATE_VOLUME
      && complaintRate >= COMPLAINT_HIGH_RATE
    )
  ) {
    return 'complaint_rate';
  }
  return null;
}

export function deriveAbuseWarnings(input: {
  status: string;
  frozen?: boolean;
  used: SendWindowCounts;
  caps: SendWindowCaps;
  last24h: { total: number; bounced: number; complained: number };
  suppressionCount: number;
}): AbuseWarning[] {
  const warnings: AbuseWarning[] = [];
  if (input.status === 'suspended') {
    warnings.push({ code: 'suspended', severity: 'high' });
  }
  if (input.frozen) {
    warnings.push({ code: 'frozen', severity: 'high' });
  }

  const hour = capWarning('cap_hour', input.used.hour, input.caps.hourly);
  const day = capWarning('cap_day', input.used.day, input.caps.daily);
  const month = capWarning('cap_month', input.used.month, input.caps.monthly);
  if (hour) warnings.push(hour);
  if (day) warnings.push(day);
  if (month) warnings.push(month);

  const bounceRate = rateFromCounts(input.last24h.bounced, input.last24h.total);
  if (input.last24h.total >= BOUNCE_MIN_VOLUME && bounceRate >= BOUNCE_HIGH_RATE) {
    warnings.push({ code: 'bounce_rate', severity: 'high' });
  } else if (input.last24h.total >= BOUNCE_MIN_VOLUME && bounceRate >= BOUNCE_WARN_RATE) {
    warnings.push({ code: 'bounce_rate', severity: 'warn' });
  }

  const complaintRate = rateFromCounts(
    input.last24h.complained,
    input.last24h.total,
  );
  if (
    input.last24h.complained >= COMPLAINT_HIGH_COUNT
    || (
      input.last24h.total >= COMPLAINT_HIGH_RATE_VOLUME
      && complaintRate >= COMPLAINT_HIGH_RATE
    )
  ) {
    warnings.push({ code: 'complaint_rate', severity: 'high' });
  } else if (input.last24h.complained >= 1 && input.last24h.total >= COMPLAINT_MIN_VOLUME) {
    warnings.push({ code: 'complaint_rate', severity: 'warn' });
  }

  if (input.suppressionCount >= SUPPRESSION_WARN_COUNT) {
    warnings.push({ code: 'suppressions', severity: 'warn' });
  } else if (input.suppressionCount > 0) {
    warnings.push({ code: 'suppressions', severity: 'info' });
  }

  return warnings;
}

export async function loadTenantAbuseSnapshot(tenant: {
  id: string;
  status: string;
  sending_tier?: string | null;
  billing_mode?: string | null;
  sending_frozen_at?: string | null;
  sending_frozen_reason?: string | null;
  hourly_email_quota?: number | null;
  daily_email_quota?: number | null;
  monthly_email_quota?: number | null;
}): Promise<TenantAbuseSnapshot> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [used, traffic, suppressionCount] = await Promise.all([
    getSendWindowCounts(tenant.id),
    getTenantTraffic(tenant.id, since),
    countSuppressedRecipients(tenant.id),
  ]);
  const caps = capsFromTenant(tenant);
  const last24h = {
    total: traffic.total,
    bounced: traffic.byStatus.bounced || 0,
    complained: traffic.byStatus.complained || 0,
    bounceRate: 0,
    complaintRate: 0,
    since: traffic.since,
  };
  last24h.bounceRate = rateFromCounts(last24h.bounced, last24h.total);
  last24h.complaintRate = rateFromCounts(last24h.complained, last24h.total);

  return {
    sendingTier: parseSendingTier(tenant.sending_tier),
    billingMode: parseBillingMode(tenant.billing_mode),
    status: tenant.status,
    sendingFrozenAt: tenant.sending_frozen_at || null,
    sendingFrozenReason: tenant.sending_frozen_reason || null,
    caps,
    used,
    last24h,
    suppressionCount,
    warnings: deriveAbuseWarnings({
      status: tenant.status,
      frozen: Boolean(tenant.sending_frozen_at),
      used,
      caps,
      last24h,
      suppressionCount,
    }),
  };
}

export async function loadPlatformAbuseQueue(): Promise<PlatformAbuseRow[]> {
  const tenants = await listTenants();
  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const snapshot = await loadTenantAbuseSnapshot(tenant);
      return {
        tenantId: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        ...snapshot,
      };
    }),
  );
  return sortAbuseQueue(rows);
}
