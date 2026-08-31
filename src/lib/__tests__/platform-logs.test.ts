/**
 * @jest-environment node
 */

import {
  buildLogWhere,
  parseLogFilters,
  parseRetentionPatch,
} from '../platform-logs';

describe('parseLogFilters', () => {
  it('reads search, tenant, status, and dates', () => {
    const filters = parseLogFilters({
      q: ' bounce ',
      tenant_id: 'tenant-1',
      status: 'bounced',
      from: '2026-01-01',
      to: '2026-01-31',
      page: '2',
      limit: '25',
    });
    expect(filters).toEqual({
      q: 'bounce',
      tenantId: 'tenant-1',
      status: 'bounced',
      from: '2026-01-01',
      to: '2026-01-31',
      page: 2,
      limit: 25,
    });
  });

  it('drops unknown status and invalid dates', () => {
    const filters = parseLogFilters({
      status: 'nope',
      from: 'yesterday',
    });
    expect(filters.status).toBeUndefined();
    expect(filters.from).toBeUndefined();
    expect(filters.page).toBe(1);
    expect(filters.limit).toBe(50);
  });
});

describe('buildLogWhere', () => {
  it('is TRUE with no filters', () => {
    expect(buildLogWhere({ page: 1, limit: 50 })).toEqual({
      clause: 'TRUE',
      values: [],
    });
  });

  it('binds tenant, status, and q placeholders', () => {
    const built = buildLogWhere({
      q: 'ops@',
      tenantId: 'abc',
      status: 'failed',
      page: 1,
      limit: 50,
    });
    expect(built.clause).toContain('el.tenant_id = $1');
    expect(built.clause).toContain('el.status = $2');
    expect(built.clause).toContain('el.from_email ILIKE $3');
    expect(built.values).toEqual(['abc', 'failed', '%ops@%', '%ops@%', '%ops@%', '%ops@%', '%ops@%']);
  });
});

describe('parseRetentionPatch', () => {
  it('clamps days', () => {
    expect(parseRetentionPatch({ keepDays: 90, stripBodyDays: 14 })).toEqual({
      keepDays: 90,
      stripBodyDays: 14,
    });
    expect(parseRetentionPatch({ keepDays: -4, stripBodyDays: 99999 })).toEqual({
      keepDays: 0,
      stripBodyDays: 3650,
    });
  });
});
