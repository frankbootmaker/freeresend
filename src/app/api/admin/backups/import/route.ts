import { NextRequest } from 'next/server';
import { json, optionsResponse } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  BackupError,
  backupDir,
  dumpFilePath,
  importDatabaseDump,
  requireDatabaseUrl,
  saveUploadedDump,
} from '@/lib/backups';

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin(request);
    const contentType = request.headers.get('content-type') || '';
    const dir = backupDir();
    let confirm = '';
    let dumpName = '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      confirm = String(form.get('confirm') || '');
      const file = form.get('file');
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        dumpName = await saveUploadedDump(dir, buffer, file.name);
      } else {
        dumpName = String(form.get('name') || '');
      }
    } else {
      const body = (await request.json()) as {
        confirm?: string;
        name?: string;
      };
      confirm = body.confirm || '';
      dumpName = body.name || '';
    }

    if (!dumpName) {
      return json({ error: 'Dump file or name is required' }, 400);
    }

    const stamp = await importDatabaseDump({
      backupDir: dir,
      databaseUrl: requireDatabaseUrl(),
      dumpPath: dumpFilePath(dir, dumpName),
      confirm,
    });
    return json({ success: true, data: { stamp } });
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
