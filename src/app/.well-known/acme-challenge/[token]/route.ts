import { NextResponse } from 'next/server';
import { getAcmeHttpChallenge } from '@/lib/platform-settings';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const keyAuthorization = token ? await getAcmeHttpChallenge(token) : null;
  if (!keyAuthorization) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(keyAuthorization, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  });
}
