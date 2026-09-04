/**
 * @jest-environment node
 */

import {
  CAP_WARN_RATIO,
  deriveAbuseWarnings,
  evaluateSendingBreaker,
  isOpenAbuseRow,
  rateFromCounts,
  sortAbuseQueue,
} from '../abuse-health';

const caps = { hourly: 100, daily: 400, monthly: 1000 };

describe('abuse-health', () => {
  it('computes rates without dividing by zero', () => {
    expect(rateFromCounts(3, 0)).toBe(0);
    expect(rateFromCounts(5, 20)).toBe(0.25);
  });

  it('flags approaching and exhausted caps', () => {
    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 80, day: 10, month: 10 },
        caps,
        last24h: { total: 10, bounced: 0, complained: 0 },
        suppressionCount: 0,
      }),
    ).toEqual([{ code: 'cap_hour', severity: 'warn' }]);

    expect(CAP_WARN_RATIO).toBe(0.8);
    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 100, day: 400, month: 1000 },
        caps,
        last24h: { total: 10, bounced: 0, complained: 0 },
        suppressionCount: 0,
      }).map((row) => row.code),
    ).toEqual(['cap_hour', 'cap_day', 'cap_month']);
  });

  it('needs volume before bounce rate warns', () => {
    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 10, bounced: 5, complained: 0 },
        suppressionCount: 0,
      }),
    ).toEqual([]);

    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 50, bounced: 3, complained: 0 },
        suppressionCount: 0,
      }),
    ).toEqual([{ code: 'bounce_rate', severity: 'warn' }]);
  });

  it('treats any complaint in a real window as a warning', () => {
    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 20, bounced: 0, complained: 1 },
        suppressionCount: 0,
      }),
    ).toEqual([{ code: 'complaint_rate', severity: 'warn' }]);

    expect(
      deriveAbuseWarnings({
        status: 'active',
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 20, bounced: 0, complained: 3 },
        suppressionCount: 0,
      }),
    ).toEqual([{ code: 'complaint_rate', severity: 'high' }]);
  });

  it('lists suppressions and a suspended tenant', () => {
    expect(
      deriveAbuseWarnings({
        status: 'suspended',
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 0, bounced: 0, complained: 0 },
        suppressionCount: 2,
      }),
    ).toEqual([
      { code: 'suspended', severity: 'high' },
      { code: 'suppressions', severity: 'info' },
    ]);
  });

  it('flags a frozen tenant and trips the breaker only at high rates', () => {
    expect(
      deriveAbuseWarnings({
        status: 'active',
        frozen: true,
        used: { hour: 0, day: 0, month: 0 },
        caps,
        last24h: { total: 50, bounced: 3, complained: 0 },
        suppressionCount: 0,
      }).map((row) => row.code),
    ).toEqual(['frozen', 'bounce_rate']);

    expect(
      evaluateSendingBreaker({ total: 50, bounced: 3, complained: 0 }),
    ).toBeNull();
    expect(
      evaluateSendingBreaker({ total: 50, bounced: 5, complained: 0 }),
    ).toBe('bounce_rate');
    expect(
      evaluateSendingBreaker({ total: 20, bounced: 0, complained: 3 }),
    ).toBe('complaint_rate');
  });

  it('sorts the portal queue by severity then name', () => {
    const quiet = {
      name: 'Quiet Co',
      sendingFrozenAt: null,
      warnings: [] as { code: 'suppressions'; severity: 'info' }[],
    };
    const watch = {
      name: 'Watch Co',
      sendingFrozenAt: null,
      warnings: [{ code: 'cap_hour' as const, severity: 'warn' as const }],
    };
    const frozen = {
      name: 'Apex Co',
      sendingFrozenAt: '2026-09-04T10:00:00.000Z',
      warnings: [{ code: 'frozen' as const, severity: 'high' as const }],
    };
    expect(isOpenAbuseRow(quiet)).toBe(false);
    expect(isOpenAbuseRow(watch)).toBe(true);
    expect(sortAbuseQueue([quiet, watch, frozen]).map((row) => row.name)).toEqual([
      'Apex Co',
      'Watch Co',
      'Quiet Co',
    ]);
  });
});
