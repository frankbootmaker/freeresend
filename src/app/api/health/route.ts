import { NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { livenessFromPing, livenessStatusCode } from '@/lib/liveness';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const started = Date.now();

  try {
    await query('SELECT 1');
    const body = livenessFromPing({
      ok: true,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json(body, { status: livenessStatusCode(body) });
  } catch {
    const body = livenessFromPing({ ok: false });
    return NextResponse.json(body, { status: livenessStatusCode(body) });
  }
}
