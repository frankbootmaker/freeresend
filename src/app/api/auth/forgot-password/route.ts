import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import {
  passwordResetOrigin,
  requestPasswordReset,
} from '@/lib/password-reset';

const schema = z.object({
  email: emailSchema,
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());
    await requestPasswordReset(email, passwordResetOrigin(request.headers));
    return json({
      success: true,
      data: { sent: true },
    });
  } catch (error: unknown) {
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error('Forgot password failed:', error);
    return json({ error: 'Could not process that request' }, 500);
  }
}
