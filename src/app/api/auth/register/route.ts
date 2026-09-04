import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createUser, generateJWT, buildAuthUser } from '@/lib/auth';
import { addMembership, createTenant, getMembershipsForUser } from '@/lib/tenants';
import { json, optionsResponse, emailSchema } from '@/lib/http';
import { attachProfile } from '@/lib/profile';
import { CURRENT_TERMS_VERSION, termsAcceptanceError } from '@/lib/legal';

const registerSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  email: emailSchema,
  password: z.string().min(8),
  ownerName: z.string().optional(),
  acceptedTerms: z.boolean(),
  acceptedTermsVersion: z.string().min(1),
});

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await request.json());
    const acceptError = termsAcceptanceError({
      acceptedTerms: body.acceptedTerms,
      acceptedTermsVersion: body.acceptedTermsVersion,
    });
    if (acceptError) {
      return json({ error: acceptError }, 400);
    }
    const user = await createUser(
      body.email,
      body.password,
      body.ownerName || body.name,
      false,
      { acceptedTermsVersion: CURRENT_TERMS_VERSION },
    );
    const tenant = await createTenant({
      name: body.name,
      slug: body.slug,
      billingEmail: body.email,
      status: 'active',
    });
    await addMembership(tenant.id, user.id, 'owner');
    const authUser = await buildAuthUser(user.id, tenant.id);
    if (!authUser) {
      return json({ error: 'Failed to create session' }, 500);
    }

    const memberships = await getMembershipsForUser(user.id);

    return json({
      success: true,
      data: {
        user: await attachProfile(authUser),
        token: generateJWT(authUser),
        tenant,
        memberships,
      },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; errors?: unknown };
    if (err.message?.includes('duplicate') || err.message?.includes('unique')) {
      return json({ error: 'Email or organization slug already exists' }, 409);
    }
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error('Register error:', error);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
