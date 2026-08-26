/**
 * @jest-environment node
 */
import { verifyMcpToken } from '../mcp-tokens';

jest.mock('../database', () => ({
  query: jest.fn(),
}));

import { query } from '../database';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('MCP token format', () => {
  it('rejects tokens that are not mcp_ prefixed', async () => {
    const result = await verifyMcpToken('frs_abc_secret');
    expect(result).toBeNull();
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});
