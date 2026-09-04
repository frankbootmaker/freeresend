import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, optionsResponse } from '@/lib/http';
import { AuthError, resolveTenantSession } from '@/lib/tenant-context';
import {
  deleteTenant,
  TenantError,
  resolveTenantSesByoRequest,
  updateTenantCommercialPolicy,
  unfreezeTenantSending,
  updateTenantName,
  updateTenantSesByoAllowed,
} from '@/lib/tenants';
import { BILLING_MODES, SENDING_TIERS } from '@/lib/sending-tier';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sesByoAllowed: z.boolean().optional(),
  sesByoDecision: z.enum(['approve', 'deny']).optional(),
  sendingTier: z.enum(SENDING_TIERS).optional(),
  billingMode: z.enum(BILLING_MODES).optional(),
  hourlyEmailQuota: z.number().int().positive().optional(),
  dailyEmailQuota: z.number().int().positive().optional(),
  monthlyEmailQuota: z.number().int().positive().optional(),
  sendingFrozen: z.literal(false).optional(),
}).refine(
  (body) =>
    Boolean(body.name)
    || body.sesByoAllowed !== undefined
    || body.sesByoDecision !== undefined
    || body.sendingTier !== undefined
    || body.billingMode !== undefined
    || body.hourlyEmailQuota !== undefined
    || body.dailyEmailQuota !== undefined
    || body.monthlyEmailQuota !== undefined
    || body.sendingFrozen === false,
  { message: 'No customer changes provided' },
);

export async function OPTIONS() {
  return optionsResponse();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    let tenant = body.name
      ? await updateTenantName(id, body.name)
      : null;
    if (body.sesByoDecision) {
      tenant = await resolveTenantSesByoRequest(id, body.sesByoDecision);
    } else if (body.sesByoAllowed !== undefined) {
      tenant = await updateTenantSesByoAllowed(id, body.sesByoAllowed);
    }
    if (
      body.sendingTier
      || body.billingMode
      || body.hourlyEmailQuota
      || body.dailyEmailQuota
      || body.monthlyEmailQuota
    ) {
      tenant = await updateTenantCommercialPolicy(id, {
        sendingTier: body.sendingTier,
        billingMode: body.billingMode,
        hourlyEmailQuota: body.hourlyEmailQuota,
        dailyEmailQuota: body.dailyEmailQuota,
        monthlyEmailQuota: body.monthlyEmailQuota,
      });
    }
    if (body.sendingFrozen === false) {
      tenant = await unfreezeTenantSending(id);
    }
    if (!tenant) {
      return json({ error: 'No customer changes provided' }, 400);
    }
    return json({ success: true, data: { tenant } });
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof TenantError) {
      return json({ error: error.message }, error.status);
    }
    const err = error as { errors?: unknown; message?: string };
    if (err.errors) {
      return json({ error: 'Invalid request data', details: err.errors }, 400);
    }
    console.error(error);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await resolveTenantSession(request);
    if (!session.user?.isPlatformAdmin) {
      return json({ error: 'Platform admin required' }, 403);
    }
    const { id } = await params;
    await deleteTenant(id);
    return json({ success: true, data: { deleted: true } });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status);
    }
    if (error instanceof TenantError) {
      return json({ error: error.message }, error.status);
    }
    console.error(error);
    return json({ error: 'Internal server error' }, 500);
  }
}
