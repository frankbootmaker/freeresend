import {
  DEFAULT_DAILY_EMAIL_QUOTA,
  DEFAULT_HOURLY_EMAIL_QUOTA,
  DEFAULT_MONTHLY_EMAIL_QUOTA,
  type SendWindowCaps,
} from './sending-quota';

export const SENDING_TIERS = [
  'probation',
  'shared',
  'byo',
  'dedicated',
] as const;
export type SendingTier = (typeof SENDING_TIERS)[number];

export const BILLING_MODES = ['exempt', 'invoiced'] as const;
export type BillingMode = (typeof BILLING_MODES)[number];

export const DEFAULT_SENDING_TIER: SendingTier = 'probation';
export const DEFAULT_BILLING_MODE: BillingMode = 'exempt';

export const TIER_CAPS: Record<SendingTier, SendWindowCaps> = {
  probation: {
    hourly: DEFAULT_HOURLY_EMAIL_QUOTA,
    daily: DEFAULT_DAILY_EMAIL_QUOTA,
    monthly: DEFAULT_MONTHLY_EMAIL_QUOTA,
  },
  shared: { hourly: 10000, daily: 50000, monthly: 250000 },
  byo: { hourly: 20000, daily: 100000, monthly: 500000 },
  dedicated: { hourly: 20000, daily: 100000, monthly: 1000000 },
};

export function isSendingTier(value: unknown): value is SendingTier {
  return (
    typeof value === 'string'
    && (SENDING_TIERS as readonly string[]).includes(value)
  );
}

export function isBillingMode(value: unknown): value is BillingMode {
  return (
    typeof value === 'string'
    && (BILLING_MODES as readonly string[]).includes(value)
  );
}

export function parseSendingTier(value: unknown): SendingTier {
  return isSendingTier(value) ? value : DEFAULT_SENDING_TIER;
}

export function parseBillingMode(value: unknown): BillingMode {
  return isBillingMode(value) ? value : DEFAULT_BILLING_MODE;
}

export function tierAllowsByoSes(tier: SendingTier): boolean {
  return tier === 'byo';
}

export function resolvePolicyCaps(
  tier: SendingTier,
  overrides: {
    hourly?: number;
    daily?: number;
    monthly?: number;
  } = {},
): SendWindowCaps {
  const defaults = TIER_CAPS[tier];
  return {
    hourly: overrides.hourly ?? defaults.hourly,
    daily: overrides.daily ?? defaults.daily,
    monthly: overrides.monthly ?? defaults.monthly,
  };
}
