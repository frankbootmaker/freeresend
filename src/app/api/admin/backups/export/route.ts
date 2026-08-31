import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  BackupError,
  backupDir,
  exportDatabaseDump,
  requireDatabaseUrl,
} from '@/lib/backups';
import { readRetentionPolicy } from '@/lib/backup-retention';
import { getOffsiteSettings, pushDumpOffsite } from '@/lib/backup-offsite';
import { rotateDumpArtifacts } from '@/lib/backup-rotate';
import { DUMP_NAME_RE } from '@/lib/backups';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const dir = backupDir();
    const result = await exportDatabaseDump({
      backupDir: dir,
      databaseUrl: requireDatabaseUrl(),
    });
    const { policy } = await readRetentionPolicy(dir);
    if (policy.autoRotate) {
      await rotateDumpArtifacts(dir, policy, DUMP_NAME_RE);
    }
    const offsite = await getOffsiteSettings();
    let pushed: { name: string; key: string } | null = null;
    if (offsite.enabled && offsite.bucket) {
      try {
        const upload = await pushDumpOffsite({
          dir,
          name: result.artifact.name,
          settings: offsite,
        });
        pushed = { name: upload.name, key: upload.key };
      } catch (error) {
        console.warn('Offsite push after export failed:', error);
      }
    }
    return json({ success: true, data: { ...result, pushed } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof BackupError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
