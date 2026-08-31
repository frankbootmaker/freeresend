import { getPlatformHealth } from '@/lib/platform-health';
import { listOpsFailures } from '@/lib/platform-logs';
import { backupDir, readStamp, stampAgeSeconds } from '@/lib/backups';

const MAX_ROWS = 5000;

export async function buildOpsExport(days: number) {
  const windowDays = Math.min(90, Math.max(1, Math.trunc(days) || 7));
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const dir = backupDir();
  const [health, failures, lastSuccess, heartbeat, lastFailure] = await Promise.all([
    getPlatformHealth(),
    listOpsFailures(windowDays, MAX_ROWS),
    readStamp(dir, 'last-success.json'),
    readStamp(dir, 'scheduler-heartbeat.json'),
    readStamp(dir, 'last-failure.json'),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    kind: 'relayhorizon-ops-log-export' as const,
    window: {
      days: windowDays,
      since: since.toISOString(),
    },
    health,
    failures: {
      totalMatching: failures.totalMatching,
      exportedCount: failures.events.length,
      truncated: failures.totalMatching > failures.events.length,
      maxRows: MAX_ROWS,
      events: failures.events.map((event) => ({
        id: event.id,
        tenant: event.tenant_name,
        slug: event.tenant_slug,
        status: event.status,
        error: event.error_message,
        createdAt: event.created_at,
      })),
    },
    backups: {
      lastSuccess,
      lastSuccessAgeSeconds: stampAgeSeconds(lastSuccess?.at),
      lastFailure,
      heartbeat,
    },
  };
}
