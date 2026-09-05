/**
 * @jest-environment node
 */

import {
  missingEgressMessage,
  parseEgressPreference,
  resolveOutboundHop,
  sesEgressReady,
  smtpEgressReady,
} from '../egress-pin';

describe('egress pin', () => {
  it('defaults unknown values to auto', () => {
    expect(parseEgressPreference(undefined)).toBe('auto');
    expect(parseEgressPreference('both')).toBe('auto');
    expect(parseEgressPreference('ses')).toBe('ses');
    expect(parseEgressPreference('smtp')).toBe('smtp');
  });

  it('resolves auto from the tenant Sending route', () => {
    expect(resolveOutboundHop({ outbound_transport: 'ses' }, 'auto')).toBe(
      'ses',
    );
    expect(resolveOutboundHop({ outbound_transport: 'smtp' }, 'auto')).toBe(
      'smtp',
    );
    expect(resolveOutboundHop({ outbound_transport: 'smtp' }, 'ses')).toBe(
      'ses',
    );
    expect(resolveOutboundHop({ outbound_transport: 'ses' }, 'smtp')).toBe(
      'smtp',
    );
  });

  it('treats tenant upstream or the platform relay as SMTP-ready', () => {
    expect(smtpEgressReady({ smtp_upstream: { host: 'mx.example' } }, {})).toBe(
      true,
    );
    expect(
      smtpEgressReady(
        { smtp_upstream: null },
        { smtpEnabled: true, smtpHost: 'relay.example' },
      ),
    ).toBe(true);
    expect(
      smtpEgressReady(
        { smtp_upstream: null },
        { smtpEnabled: false, smtpHost: 'relay.example' },
      ),
    ).toBe(false);
  });

  it('requires BYO keys when the tenant is on bring-your-own SES', () => {
    expect(
      sesEgressReady(
        { sending_tier: 'shared', ses_config: { mode: 'platform' } },
        { sesAccessKeyId: 'AKIA', sesSecretAccessKey: 'secret' },
      ),
    ).toBe(true);
    expect(
      sesEgressReady(
        {
          sending_tier: 'byo',
          ses_config: { mode: 'byo', accessKeyId: 'AKIA' },
        },
        { sesAccessKeyId: 'AKIA', sesSecretAccessKey: 'secret' },
      ),
    ).toBe(false);
    expect(
      sesEgressReady(
        {
          sending_tier: 'byo',
          ses_config: {
            mode: 'byo',
            accessKeyId: 'AKIA',
            secretAccessKey: 'secret',
          },
        },
        {},
      ),
    ).toBe(true);
  });

  it('names the missing hop for a pinned key', () => {
    expect(missingEgressMessage('smtp', 'smtp')).toMatch(/SMTP egress/);
    expect(missingEgressMessage('smtp', 'auto')).toMatch(/upstream/);
    expect(missingEgressMessage('ses', 'ses')).toMatch(/SES egress/);
  });
});
