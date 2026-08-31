import { NextResponse } from 'next/server';
import { rotatePlatformLogs } from '@/lib/platform-logs';
import { pushPendingDumps } from '@/lib/backup-offsite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function checkCron(req: Request): boolean {
  const header = req.headers.get('x-cron-secret') ?? '';
  const expected = process.env.CRON_SECRET ?? '';
  return !!expected && header === expected;
}

export async function POST(req: Request) {
  if (!checkCron(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rotate = await rotatePlatformLogs().catch((error: Error) => ({
    error: error.message,
  }));
  const offsite = await pushPendingDumps().catch((error: Error) => ({
    error: error.message,
    pushed: [] as string[],
    skipped: false,
  }));

  return NextResponse.json({ ok: true, rotate, offsite });
}
