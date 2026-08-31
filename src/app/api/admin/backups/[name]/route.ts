import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
import { json, optionsResponse, cors } from '@/lib/http';
import { AuthError } from '@/lib/tenant-context';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import {
  BackupError,
  backupDir,
  deleteBackupArtifact,
  dumpFilePath,
} from '@/lib/backups';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    await requirePlatformAdmin(request);
    const { name } = await params;
    const filePath = dumpFilePath(backupDir(), decodeURIComponent(name));
    const info = await stat(filePath);
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    const response = new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(info.size),
        'Content-Disposition': `attachment; filename="${name}"`,
      },
    });
    return cors(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof BackupError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    const err = error as { code?: string };
    if (err.code === 'ENOENT') {
      return json({ error: 'Artifact not found' }, 404);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    await requirePlatformAdmin(request);
    const { name } = await params;
    await deleteBackupArtifact(backupDir(), decodeURIComponent(name));
    return json({ success: true });
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
