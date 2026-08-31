import {
  canListenOnPort,
  normalizeSmtpListenPorts,
  parseTlsMode,
  smtpTlsOptionsForPort,
} from '../smtp-ingress';

describe('normalizeSmtpListenPorts', () => {
  it('keeps only 2525, 587, and 465 and prefers 587 first', () => {
    expect(normalizeSmtpListenPorts([25, 465, 587, 2525])).toEqual([
      587,
      465,
      2525,
    ]);
  });

  it('falls back to 2525 and 587 when empty', () => {
    expect(normalizeSmtpListenPorts([])).toEqual([2525, 587]);
  });
});

describe('smtpTlsOptionsForPort', () => {
  const tls = {
    cert: Buffer.from('CERT'),
    key: Buffer.from('KEY'),
    source: 'settings' as const,
    fingerprint: 'x',
  };

  it('uses implicit TLS on 465 when material is present', () => {
    const options = smtpTlsOptionsForPort(465, 'starttls', tls);
    expect(options.secure).toBe(true);
    expect(options.disabledCommands).toEqual(['STARTTLS']);
  });

  it('offers STARTTLS on 587 when mode is not off', () => {
    const options = smtpTlsOptionsForPort(587, 'starttls', tls);
    expect(options.secure).toBe(false);
    expect(options.disabledCommands).toEqual([]);
    expect(options.allowInsecureAuth).toBe(true);
  });

  it('requires TLS before AUTH when mode is required', () => {
    const options = smtpTlsOptionsForPort(587, 'required', tls);
    expect(options.allowInsecureAuth).toBe(false);
  });

  it('disables STARTTLS when mode is off', () => {
    const options = smtpTlsOptionsForPort(587, 'off', tls);
    expect(options.disabledCommands).toEqual(['STARTTLS']);
  });

  it('refuses 465 without certificates', () => {
    expect(
      canListenOnPort(465, { source: 'none', fingerprint: 'none' }),
    ).toBe(false);
  });
});

describe('parseTlsMode', () => {
  it('defaults unknown values to off', () => {
    expect(parseTlsMode('')).toBe('off');
    expect(parseTlsMode('starttls')).toBe('starttls');
  });
});
