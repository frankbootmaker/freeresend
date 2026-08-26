import {
  allRequiredRecordsValid,
  generateSendingDnsRecords,
  normalizeDnsValue,
  recordMatches,
  skipDnsVerification,
} from '../dns-records';

describe('sending DNS records', () => {
  it('lists MX, SPF, DKIM, and DMARC for SES egress', () => {
    const records = generateSendingDnsRecords({
      domain: 'Mail.Example.com',
      outboundTransport: 'ses',
      sesVerificationToken: 'verify-token',
      sesDkimTokens: ['abc123', 'def456'],
      sesRegion: 'eu-central-1',
    });
    const purposes = records.map((record) => record.purpose);
    expect(purposes).toEqual(
      expect.arrayContaining(['mx', 'spf', 'dkim', 'dmarc', 'ses_verify']),
    );
    expect(records.find((record) => record.purpose === 'mx')?.name).toBe(
      'outbound.mail.example.com',
    );
    expect(records.find((record) => record.purpose === 'mx')?.value).toContain(
      'inbound-smtp.eu-central-1.amazonaws.com',
    );
    const spf = records.filter((record) => record.purpose === 'spf');
    expect(spf.every((record) => record.value.includes('include:amazonses.com'))).toBe(
      true,
    );
    expect(spf.map((record) => record.name)).toEqual(
      expect.arrayContaining(['mail.example.com', 'outbound.mail.example.com']),
    );
    expect(records.filter((record) => record.purpose === 'dkim')).toHaveLength(2);
  });

  it('lists SMTP-aligned SPF and an OutPost DKIM TXT for SMTP egress', () => {
    const records = generateSendingDnsRecords({
      domain: 'acme.test',
      outboundTransport: 'smtp',
      smtpMxHost: 'smtp.provider.example',
      dkimSelector: 'outpost',
      dkimPublicKey: 'MIIBIjAN',
    });
    expect(records.find((record) => record.purpose === 'mx')?.name).toBe(
      'outbound.acme.test',
    );
    expect(records.find((record) => record.purpose === 'spf')?.value).toBe(
      'v=spf1 include:smtp.provider.example ~all',
    );
    expect(records.find((record) => record.purpose === 'spf')?.value).not.toMatch(
      /amazonses/,
    );
    expect(records.find((record) => record.purpose === 'dkim')?.name).toBe(
      'outpost._domainkey.acme.test',
    );
    expect(records.find((record) => record.purpose === 'ses_verify')).toBeUndefined();
  });

  it('matches MX and TXT values after quoting, dots, and case differences', () => {
    expect(
      recordMatches(
        {
          type: 'MX',
          name: 'acme.test',
          value: '10 inbound-smtp.eu-central-1.amazonaws.com.',
          ttl: 300,
          purpose: 'mx',
          required: true,
        },
        ['10 inbound-smtp.eu-central-1.amazonaws.com'],
      ),
    ).toBe(true);
    expect(
      recordMatches(
        {
          type: 'TXT',
          name: 'acme.test',
          value: 'v=spf1 include:amazonses.com ~all',
          ttl: 300,
          purpose: 'spf',
          required: true,
        },
        ['"v=spf1 include:amazonses.com ~all"'],
      ),
    ).toBe(true);
    expect(
      normalizeDnsValue({
        type: 'TXT',
        value: 'v=DKIM1; k=rsa; p=MIIBIjAN',
        purpose: 'dkim',
      }),
    ).toBe('v=dkim1;k=rsa;p=MIIBIjAN');
  });

  it('requires every listed record plus MX/SPF/DKIM/DMARC to be valid', () => {
    const valid = {
      status: 'valid' as const,
      required: true,
      type: 'TXT',
      name: 'acme.test',
      value: 'x',
      ttl: 300,
    };
    expect(
      allRequiredRecordsValid([
        { ...valid, purpose: 'mx' },
        { ...valid, purpose: 'spf' },
        { ...valid, purpose: 'dkim' },
        { ...valid, purpose: 'dmarc' },
      ]),
    ).toBe(true);
    expect(
      allRequiredRecordsValid([
        { ...valid, purpose: 'mx' },
        { ...valid, purpose: 'spf' },
        { ...valid, purpose: 'dkim', status: 'invalid' },
        { ...valid, purpose: 'dmarc' },
      ]),
    ).toBe(false);
  });

  it('uses outbound.domain for local SMTP bounce MX and keeps Amazon out of SPF', () => {
    const records = generateSendingDnsRecords({
      domain: 'beta.test',
      outboundTransport: 'smtp',
      smtpMxHost: 'localhost',
    });
    expect(records.find((record) => record.purpose === 'mx')).toMatchObject({
      name: 'outbound.beta.test',
      value: '10 outbound.beta.test.',
    });
    expect(records.find((record) => record.purpose === 'spf')?.value).toBe(
      'v=spf1 mx:outbound.beta.test ~all',
    );
  });

  it('treats SKIP_DNS_VERIFICATION as an explicit local override', () => {
    const previous = process.env.SKIP_DNS_VERIFICATION;
    process.env.SKIP_DNS_VERIFICATION = 'true';
    expect(skipDnsVerification()).toBe(true);
    process.env.SKIP_DNS_VERIFICATION = 'false';
    expect(skipDnsVerification()).toBe(false);
    if (previous === undefined) {
      delete process.env.SKIP_DNS_VERIFICATION;
    } else {
      process.env.SKIP_DNS_VERIFICATION = previous;
    }
  });
});
