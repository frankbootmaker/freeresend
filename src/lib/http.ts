import { NextResponse } from 'next/server';
import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .refine((value) => /^[^\s@]+@[^\s@]+$/.test(value), 'Invalid email');

export function cors(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Tenant-Id',
  );
  return response;
}

export function json(data: unknown, status = 200): NextResponse {
  return cors(NextResponse.json(data, { status }));
}

export function optionsResponse(): NextResponse {
  return cors(new NextResponse(null, { status: 200 }));
}
