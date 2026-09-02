import {
  resolveSmtpListenPorts,
  resolveSmtpPublicHost,
  resolveSmtpPublicPorts,
} from '../smtp-listen';

describe('resolveSmtpListenPorts', () => {
  it('defaults to 2525 and 587', () => {
    expect(resolveSmtpListenPorts({})).toEqual([2525, 587]);
  });

  it('adds 587 when only SMTP_LISTEN_PORT is set', () => {
    expect(resolveSmtpListenPorts({ SMTP_LISTEN_PORT: '2525' })).toEqual([
      2525,
      587,
    ]);
  });

  it('honors SMTP_LISTEN_PORTS', () => {
    expect(resolveSmtpListenPorts({ SMTP_LISTEN_PORTS: '2525,587' })).toEqual([
      2525,
      587,
    ]);
  });
});

describe('resolveSmtpPublicHost', () => {
  it('prefers a public SMTP_PUBLIC_HOST', () => {
    expect(
      resolveSmtpPublicHost({
        SMTP_PUBLIC_HOST: 'smtp.relay-dev.in3.technology',
        NEXTAUTH_URL: 'https://relay-dev.in3.technology',
      }),
    ).toBe('smtp.relay-dev.in3.technology');
  });

  it('skips localhost SMTP_PUBLIC_HOST when the web host is public', () => {
    expect(
      resolveSmtpPublicHost(
        {
          SMTP_PUBLIC_HOST: 'localhost',
          NEXTAUTH_URL: 'https://relay-dev.in3.technology',
        },
        { requestOrigin: 'http://web:3000' },
      ),
    ).toBe('relay-dev.in3.technology');
  });

  it('uses the TLS domain when it is public', () => {
    expect(
      resolveSmtpPublicHost(
        { NEXTAUTH_URL: 'https://relay-dev.in3.technology' },
        { tlsDomain: 'smtp.in3.technology' },
      ),
    ).toBe('smtp.in3.technology');
  });

  it('falls back to the request origin', () => {
    expect(
      resolveSmtpPublicHost(
        {},
        { requestOrigin: 'https://relay-dev.in3.technology' },
      ),
    ).toBe('relay-dev.in3.technology');
  });

  it('keeps localhost when nothing public is configured', () => {
    expect(
      resolveSmtpPublicHost({
        SMTP_PUBLIC_HOST: 'localhost',
        NEXTAUTH_URL: 'http://localhost:3001',
      }),
    ).toBe('localhost');
  });
});

describe('resolveSmtpPublicPorts', () => {
  it('prefers 587 as the advertised port', () => {
    expect(resolveSmtpPublicPorts({})).toEqual({
      port: 587,
      ports: [587, 2525],
    });
  });
});
