import { evaluateSendingBreaker } from './abuse-health';
import { sendSendingFrozenAlerts } from './notifications';
import {
  freezeTenantSending,
  getTenantById,
  getTenantTraffic,
} from './tenants';

export async function applySesReputationEvent(tenantId: string): Promise<{
  frozen: boolean;
  reason?: string;
}> {
  const tenant = await getTenantById(tenantId);
  if (!tenant || tenant.sending_frozen_at) {
    return { frozen: Boolean(tenant?.sending_frozen_at) };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const traffic = await getTenantTraffic(tenantId, since);
  const last24h = {
    total: traffic.total,
    bounced: traffic.byStatus.bounced || 0,
    complained: traffic.byStatus.complained || 0,
  };
  const reason = evaluateSendingBreaker(last24h);
  if (!reason) {
    return { frozen: false };
  }

  const frozen = await freezeTenantSending(tenantId, reason);
  try {
    await sendSendingFrozenAlerts({
      tenant: frozen,
      reason,
      last24h,
    });
  } catch (error) {
    console.error('Failed to send sending-freeze alerts:', error);
  }
  return { frozen: true, reason };
}
