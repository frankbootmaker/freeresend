import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { completePasswordReset } from '@/lib/password-reset';

const schema = z.object({
  token: z.string().min(8),
  password: z.string().min(8),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: Request) {
  try {
    const { token, password } = schema.parse(await request.json());
    const result = await completePasswordReset(token, password);
    if ('error' in result) {
      return json({ error: result.error }, 400);
    }
    return json({ success: true, data: { reset: true } });
  } catch (error: unknown) {
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error('Reset password failed:', error);
    return json({ error: 'Could not reset the password' }, 500);
  }
}
