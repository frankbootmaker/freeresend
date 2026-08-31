import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  SCHEDULE_INTERVAL_PRESETS,
  type ScheduleIntervalPreset,
} from '@/lib/backup-constants';

export const SCHEDULE_FILE = 'schedule.json';
export { SCHEDULE_INTERVAL_PRESETS, type ScheduleIntervalPreset };

export type BackupSchedulePolicy = {
  enabled: boolean;
  intervalSeconds: number;
};

export function envScheduleDefaults(
  env: Record<string, string | undefined> = process.env,
): BackupSchedulePolicy {
  const enabledRaw = env.BACKUP_ENABLED ?? 'true';
  const intervalRaw = Number(env.BACKUP_INTERVAL_SECONDS ?? 86400);
  return {
    enabled: enabledRaw === 'true' || enabledRaw === '1',
    intervalSeconds: Number.isFinite(intervalRaw)
      ? Math.max(60, Math.trunc(intervalRaw))
      : 86400,
  };
}

export function isScheduleIntervalPreset(
  value: number,
): value is ScheduleIntervalPreset {
  return (SCHEDULE_INTERVAL_PRESETS as readonly number[]).includes(value);
}

export async function readSchedulePolicy(
  backupDir: string,
  envDefaults: BackupSchedulePolicy = envScheduleDefaults(),
): Promise<{ policy: BackupSchedulePolicy; source: 'file' | 'env' }> {
  try {
    const raw = await fs.readFile(path.join(backupDir, SCHEDULE_FILE), 'utf8');
    const parsed = JSON.parse(raw) as Partial<BackupSchedulePolicy>;
    return {
      source: 'file',
      policy: {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : envDefaults.enabled,
        intervalSeconds: clampInterval(
          parsed.intervalSeconds,
          envDefaults.intervalSeconds,
        ),
      },
    };
  } catch {
    return { source: 'env', policy: { ...envDefaults } };
  }
}

export async function writeSchedulePolicy(
  backupDir: string,
  policy: BackupSchedulePolicy,
): Promise<BackupSchedulePolicy> {
  await fs.mkdir(backupDir, { recursive: true });
  const normalized: BackupSchedulePolicy = {
    enabled: Boolean(policy.enabled),
    intervalSeconds: isScheduleIntervalPreset(policy.intervalSeconds)
      ? policy.intervalSeconds
      : nearestPreset(policy.intervalSeconds),
  };
  await fs.writeFile(
    path.join(backupDir, SCHEDULE_FILE),
    `${JSON.stringify(normalized, null, 2)}\n`,
    'utf8',
  );
  return normalized;
}

function clampInterval(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return Math.max(60, Math.trunc(fallback));
  return Math.max(60, Math.trunc(n));
}

function nearestPreset(seconds: number): ScheduleIntervalPreset {
  const clamped = Math.max(60, Math.trunc(seconds));
  let best: ScheduleIntervalPreset = 86400;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const preset of SCHEDULE_INTERVAL_PRESETS) {
    const delta = Math.abs(preset - clamped);
    if (delta < bestDelta) {
      best = preset;
      bestDelta = delta;
    }
  }
  return best;
}
