/**
 * @jest-environment node
 */
import { getTenantTraffic } from '../tenants';

jest.mock('../database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

import { query } from '../database';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('getTenantTraffic', () => {
  it('aggregates counts by status for one tenant', async () => {
    mockedQuery.mockResolvedValue({
      rows: [
        { status: 'sent', count: 4 },
        { status: 'failed', count: 1 },
      ],
      command: 'SELECT',
      rowCount: 2,
      oid: 0,
      fields: [],
    } as never);

    const traffic = await getTenantTraffic('tenant-a', new Date('2026-01-01'));
    expect(traffic.total).toBe(5);
    expect(traffic.byStatus.sent).toBe(4);
    expect(traffic.byStatus.failed).toBe(1);
    expect(mockedQuery.mock.calls[0][1]?.[0]).toBe('tenant-a');
  });
});
