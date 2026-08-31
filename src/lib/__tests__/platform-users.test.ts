/**
 * @jest-environment node
 */

import {
  assertCanRevokeAdmin,
  normalizeAdminEmail,
  PlatformUserError,
} from '../platform-users';

describe('normalizeAdminEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeAdminEmail('  Ops@Example.COM ')).toBe('ops@example.com');
  });
});

describe('assertCanRevokeAdmin', () => {
  it('blocks revoking yourself', () => {
    expect(() =>
      assertCanRevokeAdmin({
        actorId: 'admin-1',
        targetId: 'admin-1',
        adminCount: 3,
      }),
    ).toThrow(PlatformUserError);
    try {
      assertCanRevokeAdmin({
        actorId: 'admin-1',
        targetId: 'admin-1',
        adminCount: 3,
      });
    } catch (error) {
      expect(error).toMatchObject({ code: 'PLATFORM_USER_SELF_REVOKE', status: 400 });
    }
  });

  it('blocks revoking the last administrator', () => {
    try {
      assertCanRevokeAdmin({
        actorId: 'admin-1',
        targetId: 'admin-2',
        adminCount: 1,
      });
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toMatchObject({ code: 'PLATFORM_USER_LAST_ADMIN', status: 400 });
    }
  });

  it('allows revoking another admin when more than one remain', () => {
    expect(() =>
      assertCanRevokeAdmin({
        actorId: 'admin-1',
        targetId: 'admin-2',
        adminCount: 2,
      }),
    ).not.toThrow();
  });
});
