import {
  resolveSmtpListenPorts,
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

describe('resolveSmtpPublicPorts', () => {
  it('prefers 587 as the advertised port', () => {
    expect(resolveSmtpPublicPorts({})).toEqual({
      port: 587,
      ports: [587, 2525],
    });
  });
});
