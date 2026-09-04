/**
 * @jest-environment node
 */

import {
  DEFAULT_DAILY_EMAIL_QUOTA,
  DEFAULT_HOURLY_EMAIL_QUOTA,
  DEFAULT_MONTHLY_EMAIL_QUOTA,
  capsFromTenant,
  quotaRejection,
} from '../sending-quota';

describe('quotaRejection', () => {
  const caps = {
    hourly: 5,
    daily: 20,
    monthly: 100,
  };

  it('rejects the smallest exceeded window first', () => {
    expect(quotaRejection({ hour: 5, day: 5, month: 5 }, caps)).toMatch(
      /hourly/i,
    );
    expect(quotaRejection({ hour: 1, day: 20, month: 20 }, caps)).toMatch(
      /daily/i,
    );
    expect(quotaRejection({ hour: 1, day: 1, month: 100 }, caps)).toMatch(
      /monthly/i,
    );
    expect(quotaRejection({ hour: 4, day: 19, month: 99 }, caps)).toBeNull();
  });
});

describe('capsFromTenant', () => {
  it('uses published defaults when columns are missing', () => {
    expect(capsFromTenant({})).toEqual({
      hourly: DEFAULT_HOURLY_EMAIL_QUOTA,
      daily: DEFAULT_DAILY_EMAIL_QUOTA,
      monthly: DEFAULT_MONTHLY_EMAIL_QUOTA,
    });
    expect(
      capsFromTenant({
        hourly_email_quota: 50,
        daily_email_quota: 200,
        monthly_email_quota: 1000,
      }),
    ).toEqual({ hourly: 50, daily: 200, monthly: 1000 });
  });
});
