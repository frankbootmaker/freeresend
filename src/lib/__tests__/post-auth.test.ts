import { postAuthPath } from '../post-auth';

describe('postAuthPath', () => {
  it('sends platform admins to the portal', () => {
    expect(postAuthPath({ isPlatformAdmin: true })).toBe('/portal');
  });

  it('sends tenant users to the tenant console', () => {
    expect(postAuthPath({ isPlatformAdmin: false })).toBe('/');
    expect(postAuthPath(null)).toBe('/');
  });
});
