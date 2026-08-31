import { query } from './database';
import { getResolvedPlatformSettings } from './platform-settings';
import { getSesSendQuota } from './ses';
import {
  backupDir,
  readStamp,
  staleAfterHours,
} from './backups';
import { readSchedulePolicy } from './backup-schedule';

export type HealthState = 'ok' | 'warn' | 'down' | 'off';
export type OverallHealth = 'ok' | 'degraded' | 'down';

export type HealthCheckId = 'database' | 'ses' | 'smtp' | 'backup';

export type HealthCheck = {
  id: HealthCheckId;
  state: HealthState;
  detail: string;
  latencyMs?: number;
  region?: string;
  max24HourSend?: number;
  sentLast24Hours?: number;
  lastSuccessAt?: string;
};

export const BACKUP_HEALTH_DETAIL = {
  fresh: 'Last dump succeeded',
  stale: 'Last dump is older than the stale threshold',
  failed: 'Last scheduled dump failed',
  missing: 'No dump has been recorded',
  schedulerMissing: 'Backup scheduler is not detected',
} as const;

export type StatusCounts = Record<string, number>;

export type HealthVolume = {
  total: number;
  byStatus: StatusCounts;
};

export type HealthFailure = {
  id: string;
  tenant: string;
  from: string;
  to: string;
  subject: string;
  status: string;
  error: string;
  createdAt: string;
};

export type HealthTenantVolume = {
  name: string;
  slug: string;
  count: number;
};

export type PlatformHealth = {
  overall: OverallHealth;
  checkedAt: string;
  checks: HealthCheck[];
  volume24h: HealthVolume;
  volume7d: HealthVolume;
  tenants: { total: number; active: number };
  domains: { total: number; verified: number; pending: number; failed: number };
  topTenants: HealthTenantVolume[];
  recentFailures: HealthFailure[];
  webhooks24h: StatusCounts;
};

export function overallFromChecks(checks: HealthCheck[]): OverallHealth {
  if (checks.some((check) => check.state === 'down')) return 'down';
  if (checks.some((check) => check.state === 'warn')) return 'degraded';
  return 'ok';
}

function countsFromRows(rows: { status?: string; count?: number }[]): StatusCounts {
  const byStatus: StatusCounts = {};
  for (const row of rows) {
    if (!row.status) continue;
    byStatus[row.status] = Number(row.count || 0);
  }
  return byStatus;
}

function volumeFromRows(rows: { status?: string; count?: number }[]): HealthVolume {
  const byStatus = countsFromRows(rows);
  const total = Object.values(byStatus).reduce((sum, value) => sum + value, 0);
  return { total, byStatus };
}

function firstRecipient(toEmails: unknown): string {
  if (Array.isArray(toEmails) && toEmails[0]) return String(toEmails[0]);
  return '';
}

async function checkDatabase(): Promise<HealthCheck> {
  const started = Date.now();
  try {
    await query('SELECT 1');
    return {
      id: 'database',
      state: 'ok',
      detail: 'Reachable',
      latencyMs: Date.now() - started,
    };
  } catch (error: unknown) {
    return {
      id: 'database',
      state: 'down',
      detail: (error as { message?: string }).message || 'Unreachable',
      latencyMs: Date.now() - started,
    };
  }
}

async function checkSes(smtpEnabled: boolean): Promise<HealthCheck> {
  const platform = await getResolvedPlatformSettings();
  const configured = Boolean(
    platform.sesAccessKeyId && platform.sesSecretAccessKey,
  );
  if (!configured) {
    return {
      id: 'ses',
      state: smtpEnabled ? 'off' : 'warn',
      detail: smtpEnabled
        ? 'Not configured — SMTP relay is the fallback'
        : 'Credentials are not configured',
      region: platform.sesRegion,
    };
  }

  const started = Date.now();
  try {
    const quota = await Promise.race([
      getSesSendQuota(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SES quota check timed out')), 8000);
      }),
    ]);
    return {
      id: 'ses',
      state: 'ok',
      detail: 'Credentials accepted',
      latencyMs: Date.now() - started,
      region: platform.sesRegion,
      max24HourSend: quota.max24HourSend,
      sentLast24Hours: quota.sentLast24Hours,
    };
  } catch (error: unknown) {
    return {
      id: 'ses',
      state: 'warn',
      detail: (error as { message?: string }).message || 'SES check failed',
      latencyMs: Date.now() - started,
      region: platform.sesRegion,
    };
  }
}

function checkSmtp(
  enabled: boolean,
  host: string,
): HealthCheck {
  if (!enabled) {
    return {
      id: 'smtp',
      state: 'off',
      detail: 'Relay is disabled',
    };
  }
  if (!host) {
    return {
      id: 'smtp',
      state: 'warn',
      detail: 'Enabled without a host',
    };
  }
  return {
    id: 'smtp',
    state: 'ok',
    detail: host,
  };
}

export function backupHealthFromStamps(input: {
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  heartbeatAt?: string | null;
  scheduleEnabled: boolean;
  staleAfterHours: number;
  now?: number;
}): { state: HealthState; detail: string } {
  const now = input.now ?? Date.now();
  const successMs = input.lastSuccessAt ? Date.parse(input.lastSuccessAt) : NaN;
  const failureMs = input.lastFailureAt ? Date.parse(input.lastFailureAt) : NaN;
  const hasSuccess = Number.isFinite(successMs);
  const hasFailure = Number.isFinite(failureMs);

  if (hasFailure && (!hasSuccess || failureMs > successMs)) {
    return { state: 'down', detail: BACKUP_HEALTH_DETAIL.failed };
  }
  if (!hasSuccess) {
    return { state: 'warn', detail: BACKUP_HEALTH_DETAIL.missing };
  }

  const ageHours = (now - successMs) / 3_600_000;
  if (ageHours > input.staleAfterHours) {
    return { state: 'warn', detail: BACKUP_HEALTH_DETAIL.stale };
  }
  if (input.scheduleEnabled && !input.heartbeatAt) {
    return { state: 'warn', detail: BACKUP_HEALTH_DETAIL.schedulerMissing };
  }
  return { state: 'ok', detail: BACKUP_HEALTH_DETAIL.fresh };
}

async function checkBackup(): Promise<HealthCheck> {
  try {
    const dir = backupDir();
    const [lastSuccess, lastFailure, heartbeat, schedule] = await Promise.all([
      readStamp(dir, 'last-success.json'),
      readStamp(dir, 'last-failure.json'),
      readStamp(dir, 'scheduler-heartbeat.json'),
      readSchedulePolicy(dir),
    ]);
    const result = backupHealthFromStamps({
      lastSuccessAt: lastSuccess?.at,
      lastFailureAt: lastFailure?.at,
      heartbeatAt: heartbeat?.at,
      scheduleEnabled: schedule.policy.enabled,
      staleAfterHours: staleAfterHours(),
    });
    return {
      id: 'backup',
      state: result.state,
      detail: result.detail,
      lastSuccessAt: lastSuccess?.at,
    };
  } catch (error: unknown) {
    return {
      id: 'backup',
      state: 'warn',
      detail: (error as { message?: string }).message || 'Backup check failed',
    };
  }
}

function emptyHealth(checks: HealthCheck[]): PlatformHealth {
  return {
    overall: overallFromChecks(checks),
    checkedAt: new Date().toISOString(),
    checks,
    volume24h: { total: 0, byStatus: {} },
    volume7d: { total: 0, byStatus: {} },
    tenants: { total: 0, active: 0 },
    domains: { total: 0, verified: 0, pending: 0, failed: 0 },
    topTenants: [],
    recentFailures: [],
    webhooks24h: {},
  };
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [database, backup] = await Promise.all([
    checkDatabase(),
    checkBackup(),
  ]);
  if (database.state === 'down') {
    return emptyHealth([
      database,
      { id: 'ses', state: 'warn', detail: 'Not checked' },
      { id: 'smtp', state: 'warn', detail: 'Not checked' },
      backup,
    ]);
  }

  const platform = await getResolvedPlatformSettings();

  const [
    ses,
    volume24hRes,
    volume7dRes,
    tenantsRes,
    domainsRes,
    topTenantsRes,
    failuresRes,
    webhooksRes,
  ] = await Promise.all([
    checkSes(platform.smtpEnabled),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM email_logs
       WHERE created_at >= $1
       GROUP BY status`,
      [since24h],
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM email_logs
       WHERE created_at >= $1
       GROUP BY status`,
      [since7d],
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM tenants
       GROUP BY status`,
    ),
    query(
      `SELECT status, COUNT(*)::int AS count
       FROM domains
       GROUP BY status`,
    ),
    query(
      `SELECT t.name, t.slug, COUNT(*)::int AS count
       FROM email_logs el
       JOIN tenants t ON t.id = el.tenant_id
       WHERE el.created_at >= $1
       GROUP BY t.id, t.name, t.slug
       ORDER BY count DESC
       LIMIT 5`,
      [since7d],
    ),
    query(
      `SELECT el.id, el.from_email, el.to_emails, el.subject, el.status,
              el.error_message, el.created_at, t.name AS tenant_name
       FROM email_logs el
       JOIN tenants t ON t.id = el.tenant_id
       WHERE el.status IN ('failed', 'bounced', 'complained')
       ORDER BY el.created_at DESC
       LIMIT 10`,
    ),
    query(
      `SELECT event_type AS status, COUNT(*)::int AS count
       FROM webhook_events
       WHERE created_at >= $1
       GROUP BY event_type`,
      [since24h],
    ),
  ]);

  const smtp = checkSmtp(platform.smtpEnabled, platform.smtpHost);
  const checks = [database, ses, smtp, backup];
  const tenantCounts = countsFromRows(tenantsRes.rows);
  const domainCounts = countsFromRows(domainsRes.rows);

  return {
    overall: overallFromChecks(checks),
    checkedAt: new Date().toISOString(),
    checks,
    volume24h: volumeFromRows(volume24hRes.rows),
    volume7d: volumeFromRows(volume7dRes.rows),
    tenants: {
      total: Object.values(tenantCounts).reduce((sum, value) => sum + value, 0),
      active: tenantCounts.active || 0,
    },
    domains: {
      total: Object.values(domainCounts).reduce((sum, value) => sum + value, 0),
      verified: domainCounts.verified || 0,
      pending: domainCounts.pending || 0,
      failed: domainCounts.failed || 0,
    },
    topTenants: topTenantsRes.rows.map((row) => ({
      name: String(row.name),
      slug: String(row.slug),
      count: Number(row.count),
    })),
    recentFailures: failuresRes.rows.map((row) => ({
      id: String(row.id),
      tenant: String(row.tenant_name || ''),
      from: String(row.from_email || ''),
      to: firstRecipient(row.to_emails),
      subject: String(row.subject || ''),
      status: String(row.status || ''),
      error: String(row.error_message || ''),
      createdAt: new Date(row.created_at).toISOString(),
    })),
    webhooks24h: countsFromRows(webhooksRes.rows),
  };
}
