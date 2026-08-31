import {
  backupDir,
  listBackupArtifacts,
  readStamp,
  staleAfterHours,
  stampAgeSeconds,
} from '@/lib/backups';
import { readRetentionPolicy } from '@/lib/backup-retention';
import { readSchedulePolicy } from '@/lib/backup-schedule';
import { getOffsiteSettings, toPublicOffsite } from '@/lib/backup-offsite';

export async function getBackupStatus() {
  const dir = backupDir();
  const [
    artifacts,
    lastSuccess,
    lastImport,
    lastFailure,
    heartbeat,
    lastOffsite,
    schedule,
    retention,
    offsite,
  ] = await Promise.all([
    listBackupArtifacts(dir),
    readStamp(dir, 'last-success.json'),
    readStamp(dir, 'last-import.json'),
    readStamp(dir, 'last-failure.json'),
    readStamp(dir, 'scheduler-heartbeat.json'),
    readStamp(dir, 'last-offsite.json'),
    readSchedulePolicy(dir),
    readRetentionPolicy(dir),
    getOffsiteSettings(),
  ]);
  const staleHours = staleAfterHours();
  const successAge = stampAgeSeconds(lastSuccess?.at);
  return {
    directory: dir,
    artifacts,
    lastSuccess,
    lastSuccessAgeSeconds: successAge,
    lastImport,
    lastFailure,
    heartbeat,
    lastOffsite,
    stale: Boolean(successAge != null && successAge > staleHours * 3600),
    staleAfterHours: staleHours,
    schedule: schedule.policy,
    scheduleSource: schedule.source,
    retention: retention.policy,
    retentionSource: retention.source,
    offsite: toPublicOffsite(offsite),
  };
}
