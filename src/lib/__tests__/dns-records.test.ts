import {
  allRequiredRecordsValid,
  generateDualSendingDnsRecords,
  generateSendingDnsRecords,
  hasSendingLane,
  inferRecordLane,
  mergeDnsRecordStatuses,
  normalizeDnsValue,
  recordMatches,
  recordsForLane,
  resolveSmtpDnsHost,
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
    expect(records.every((record) => record.lane === 'ses')).toBe(true);
  });

  it('adds platform SMTP SPF and RelayHorizon DKIM to SES records for failover', () => {
    const records = generateSendingDnsRecords({
      domain: 'acme.test',
      outboundTransport: 'ses',
      sesDkimTokens: ['abc123'],
      platformSmtpHost: 'smtp.relay.example',
      dkimSelector: 'relayhorizon',
      dkimPublicKey: 'MIIBIjAN',
    });
    const spf = records.filter((record) => record.purpose === 'spf');
    expect(spf).toHaveLength(2);
    expect(spf.every((record) => (
      record.value ===
        'v=spf1 include:amazonses.com a:smtp.relay.example include:relay.example ~all'
    ))).toBe(true);
    expect(records.find((record) => record.purpose === 'mx')?.value).toContain(
      'inbound-smtp',
    );
    const dkim = records.filter((record) => record.purpose === 'dkim');
    expect(dkim.some((record) => record.type === 'CNAME')).toBe(true);
    expect(dkim.find((record) => record.type === 'TXT')?.name).toBe(
      'relayhorizon._domainkey.acme.test',
    );
  });

  it('does not add localhost platform SMTP into SES SPF', () => {
    const records = generateSendingDnsRecords({
      domain: 'acme.test',
      outboundTransport: 'ses',
      sesDkimTokens: ['abc123'],
      platformSmtpHost: 'localhost',
      dkimSelector: 'relayhorizon',
      dkimPublicKey: 'MIIBIjAN',
    });
    expect(
      records.filter((record) => record.purpose === 'spf').every((record) => (
        record.value === 'v=spf1 include:amazonses.com ~all'
      )),
    ).toBe(true);
    expect(
      records.some((record) => record.purpose === 'dkim' && record.type === 'TXT'),
    ).toBe(false);
  });

  it('lists SMTP-aligned SPF and a RelayHorizon DKIM TXT for SMTP egress', () => {
    const records = generateSendingDnsRecords({
      domain: 'acme.test',
      outboundTransport: 'smtp',
      smtpMxHost: 'smtp.provider.example',
      dkimSelector: 'relayhorizon',
      dkimPublicKey: 'MIIBIjAN',
    });
    expect(records.find((record) => record.purpose === 'mx')?.name).toBe(
      'outbound.acme.test',
    );
    const spf = records.filter((record) => record.purpose === 'spf');
    expect(spf).toHaveLength(2);
    expect(spf.every((record) =>
      record.value === 'v=spf1 a:smtp.provider.example include:provider.example ~all',
    )).toBe(true);
    expect(records.find((record) => record.purpose === 'spf')?.value).not.toMatch(
      /amazonses/,
    );
    expect(records.find((record) => record.purpose === 'dkim')?.name).toBe(
      'relayhorizon._domainkey.acme.test',
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

  it('uses the platform SMTP host when the tenant left upstream empty', () => {
    expect(resolveSmtpDnsHost({
      tenantSmtpHost: '',
      platformSmtpHost: 'smtp.relay.example',
    })).toBe('smtp.relay.example');
    const records = generateSendingDnsRecords({
      domain: 'acme.test',
      outboundTransport: 'smtp',
      platformSmtpHost: 'smtp.relay.example',
      dkimSelector: 'relayhorizon',
      dkimPublicKey: 'MIIBIjAN',
    });
    expect(records.find((record) => record.purpose === 'mx')?.value).toBe(
      '10 smtp.relay.example.',
    );
    expect(
      records.find((record) => record.purpose === 'spf' && record.name === 'acme.test')
        ?.value,
    ).toBe('v=spf1 a:smtp.relay.example include:relay.example ~all');
    expect(records.find((record) => record.purpose === 'dkim')?.name).toBe(
      'relayhorizon._domainkey.acme.test',
    );
    expect(records.find((record) => record.purpose === 'ses_verify')).toBeUndefined();
  });

  it('keeps SES and SMTP lanes together and can reset the live lane', () => {
    const records = generateDualSendingDnsRecords({
      domain: 'acme.test',
      sesVerificationToken: 'verify-token',
      sesDkimTokens: ['abc123'],
      platformSmtpHost: 'smtp.relay.example',
      dkimSelector: 'relayhorizon',
      dkimPublicKey: 'MIIBIjAN',
    });
    expect(hasSendingLane(records, 'ses')).toBe(true);
    expect(hasSendingLane(records, 'smtp')).toBe(true);
    expect(
      recordsForLane(records, 'ses').find((record) => record.purpose === 'spf')
        ?.value,
    ).toBe(
      'v=spf1 include:amazonses.com a:smtp.relay.example include:relay.example ~all',
    );
    expect(
      recordsForLane(records, 'smtp').find((record) => record.purpose === 'spf')
        ?.value,
    ).toContain('smtp.relay.example');
    expect(
      recordsForLane(records, 'smtp').find((record) => record.purpose === 'dkim')
        ?.type,
    ).toBe('TXT');
    expect(
      inferRecordLane({
        type: 'TXT',
        value: 'v=spf1 include:amazonses.com ~all',
        purpose: 'spf',
      }),
    ).toBe('ses');
    const merged = mergeDnsRecordStatuses(
      records,
      records.map((record) => ({ ...record, status: 'valid' as const })),
      ['smtp'],
    );
    expect(
      recordsForLane(merged, 'ses').every((record) => record.status === 'valid'),
    ).toBe(true);
    expect(
      recordsForLane(merged, 'smtp').every((record) => record.status === 'pending'),
    ).toBe(true);
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
