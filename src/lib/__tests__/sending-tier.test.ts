/**
 * @jest-environment node
 */

import {
  DEFAULT_HOURLY_EMAIL_QUOTA,
  DEFAULT_MONTHLY_EMAIL_QUOTA,
} from '../sending-quota';
import {
  parseBillingMode,
  parseSendingTier,
  resolvePolicyCaps,
  TIER_CAPS,
  tierAllowsByoSes,
} from '../sending-tier';

describe('sending-tier', () => {
  it('defaults unknown values to probation and exempt', () => {
    expect(parseSendingTier('gold')).toBe('probation');
    expect(parseBillingMode('prepaid')).toBe('exempt');
    expect(tierAllowsByoSes('probation')).toBe(false);
    expect(tierAllowsByoSes('byo')).toBe(true);
  });

  it('uses pool caps unless overrides are set', () => {
    expect(TIER_CAPS.probation.hourly).toBe(DEFAULT_HOURLY_EMAIL_QUOTA);
    expect(TIER_CAPS.probation.monthly).toBe(DEFAULT_MONTHLY_EMAIL_QUOTA);
    expect(resolvePolicyCaps('shared')).toEqual(TIER_CAPS.shared);
    expect(resolvePolicyCaps('dedicated', { monthly: 42 })).toEqual({
      ...TIER_CAPS.dedicated,
      monthly: 42,
    });
  });
});
