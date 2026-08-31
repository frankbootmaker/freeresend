/**
 * @jest-environment node
 */

import { createHash } from 'crypto';
import { hashResetToken } from '../password-reset';
import { platformSender } from '../platform-settings';

describe('hashResetToken', () => {
  it('returns a stable SHA-256 hex digest', () => {
    const token = 'reset-token-example';
    expect(hashResetToken(token)).toBe(
      createHash('sha256').update(token).digest('hex'),
    );
    expect(hashResetToken(token)).toHaveLength(64);
  });
});

describe('platformSender', () => {
  it('prefers the platform sender, then alert From, then FROM_EMAIL', () => {
    expect(
      platformSender(
        { platformFrom: 'ops@relay.test', alertFrom: 'alerts@relay.test' },
        { FROM_EMAIL: 'noreply@env.test' },
      ),
    ).toBe('ops@relay.test');
    expect(
      platformSender(
        { platformFrom: '', alertFrom: 'alerts@relay.test' },
        { FROM_EMAIL: 'noreply@env.test' },
      ),
    ).toBe('alerts@relay.test');
    expect(
      platformSender({}, { FROM_EMAIL: 'noreply@env.test' }),
    ).toBe('noreply@env.test');
    expect(platformSender({}, {})).toBe('info@localhost');
  });
});
