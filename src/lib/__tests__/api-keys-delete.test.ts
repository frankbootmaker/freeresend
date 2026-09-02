/**
 * @jest-environment node
 */

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

jest.mock('../database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

import { query } from '../database';
import { ApiKeyError, deleteApiKey, updateApiKeyPermissions } from '../api-keys';

const mockedQuery = query as jest.MockedFunction<typeof query>;

function queryResult(rowCount: number) {
  return {
    rows: [],
    command: 'DELETE',
    rowCount,
    oid: 0,
    fields: [],
  } as never;
}

describe('deleteApiKey', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('deletes by key id and tenant, not the creating user', async () => {
    mockedQuery.mockResolvedValue(queryResult(1));

    await deleteApiKey('key-1', 'tenant-a');

    expect(mockedQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/tenant_id/);
    expect(sql).not.toMatch(/user_id/);
    expect(params).toEqual(['key-1', 'tenant-a']);
  });

  it('throws 404 when the key is not in the tenant', async () => {
    mockedQuery.mockResolvedValue(queryResult(0));

    await expect(deleteApiKey('key-1', 'tenant-a')).rejects.toBeInstanceOf(
      ApiKeyError,
    );
    await expect(deleteApiKey('key-1', 'tenant-a')).rejects.toMatchObject({
      status: 404,
      message: 'API key not found',
    });
  });
});

describe('updateApiKeyPermissions', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
  });

  it('updates by key id and tenant, not the creating user', async () => {
    mockedQuery.mockResolvedValue(queryResult(1));

    await updateApiKeyPermissions('key-1', 'tenant-a', ['send']);

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toMatch(/tenant_id/);
    expect(sql).not.toMatch(/user_id/);
    expect(params).toEqual([JSON.stringify(['send']), 'key-1', 'tenant-a']);
  });
});
