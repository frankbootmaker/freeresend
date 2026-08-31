/**
 * @jest-environment node
 */

jest.mock('../database', () => ({
  query: jest.fn(),
}));

import {
  keepSecret,
  resolvePlatformSettings,
  toPublicPlatformSettings,
} from '../platform-settings';

describe('resolvePlatformSettings', () => {
  const env = {
    AWS_REGION: 'us-west-2',
    AWS_ACCESS_KEY_ID: 'env-key',
    AWS_SECRET_ACCESS_KEY: 'env-secret',
    SES_CONFIGURATION_SET: 'env-set',
    PLATFORM_SMTP_HOST: 'smtp.env.example',
    PLATFORM_SMTP_PORT: '2525',
    PLATFORM_SMTP_SECURE: 'false',
    PLATFORM_SMTP_USERNAME: 'env-user',
    PLATFORM_SMTP_PASSWORD: 'env-pass',
    ALERT_EMAIL: 'alerts@env.test',
    ADMIN_EMAIL: 'admin@env.test',
    ALERT_FROM: 'from@env.test',
    FROM_EMAIL: 'noreply@env.test',
  };

  it('falls back to environment values when the row is empty', () => {
    const resolved = resolvePlatformSettings(null, env);
    expect(resolved.sesRegion).toBe('us-west-2');
    expect(resolved.sesAccessKeyId).toBe('env-key');
    expect(resolved.sesSecretAccessKey).toBe('env-secret');
    expect(resolved.sesConfigurationSet).toBe('env-set');
    expect(resolved.smtpEnabled).toBe(true);
    expect(resolved.smtpHost).toBe('smtp.env.example');
    expect(resolved.smtpPort).toBe(2525);
    expect(resolved.smtpSecure).toBe(false);
    expect(resolved.smtpUsername).toBe('env-user');
    expect(resolved.alertEmail).toBe('alerts@env.test');
    expect(resolved.alertFrom).toBe('from@env.test');
  });

  it('lets stored values override environment', () => {
    const resolved = resolvePlatformSettings(
      {
        ses_region: 'eu-central-1',
        ses_access_key_id: 'db-key',
        ses_secret_access_key: 'db-secret',
        ses_configuration_set: 'db-set',
        smtp_enabled: false,
        smtp_host: 'smtp.db.example',
        smtp_port: 465,
        smtp_secure: true,
        smtp_username: 'db-user',
        smtp_password: 'db-pass',
        alert_email: 'ops@db.test',
        alert_from: 'relayhorizon@db.test',
      },
      env,
    );
    expect(resolved.sesRegion).toBe('eu-central-1');
    expect(resolved.sesAccessKeyId).toBe('db-key');
    expect(resolved.smtpEnabled).toBe(false);
    expect(resolved.smtpHost).toBe('smtp.db.example');
    expect(resolved.smtpPort).toBe(465);
    expect(resolved.alertEmail).toBe('ops@db.test');
    expect(resolved.alertFrom).toBe('relayhorizon@db.test');
  });

  it('uses ADMIN_EMAIL and FROM_EMAIL when dedicated alert vars are missing', () => {
    const resolved = resolvePlatformSettings(null, {
      ADMIN_EMAIL: 'admin@env.test',
      FROM_EMAIL: 'noreply@env.test',
    });
    expect(resolved.alertEmail).toBe('admin@env.test');
    expect(resolved.alertFrom).toBe('noreply@env.test');
    expect(resolved.sesRegion).toBe('us-east-1');
    expect(resolved.sesConfigurationSet).toBe('relayhorizon-prod');
    expect(resolved.smtpEnabled).toBe(false);
  });
});

describe('toPublicPlatformSettings', () => {
  it('never exposes secret material', () => {
    const publicSettings = toPublicPlatformSettings({
      sesRegion: 'eu-central-1',
      sesAccessKeyId: 'AKIAEXAMPLE',
      sesSecretAccessKey: 'secret',
      sesConfigurationSet: 'relayhorizon-prod',
      smtpEnabled: true,
      smtpHost: 'smtp.example',
      smtpPort: 587,
      smtpSecure: true,
      smtpUsername: 'relay',
      smtpPassword: 'pw',
      alertEmail: 'ops@example.com',
      alertFrom: 'alerts@example.com',
      smtpListenPorts: [587, 2525],
      smtpIngressTlsMode: 'off',
      smtpIngressTlsCert: 'CERT',
      smtpIngressTlsKey: 'KEY',
      smtpIngressTlsSource: 'letsencrypt',
      smtpIngressTlsDomain: 'smtp.example.com',
      smtpIngressAcmeAccountKey: 'ACCOUNT',
      smtpIngressTlsExpiresAt: '2026-11-12T00:00:00.000Z',
      smtpIngressTlsRenewAt: '2026-10-13T00:00:00.000Z',
      smtpIngressTlsStatus: 'issued',
      smtpIngressTlsError: '',
      smtpIngressTlsStatusAt: '2026-08-14T00:00:00.000Z',
      smtpIngressAcmeHttpToken: 'token',
      smtpIngressAcmeHttpKeyAuth: 'key-auth',
      smtpIngressAcmeChallenge: 'dns-manual',
      smtpIngressAcmeDnsName: '_acme-challenge.smtp.example.com',
      smtpIngressAcmeDnsValue: 'challenge-value',
      smtpIngressAcmeOrder: '{"orderUrl":"https://example"}',
      smtpIngressIspconfigUrl: 'https://panel.example.com:8080/remote/json.php',
      smtpIngressIspconfigUser: 'remote',
      smtpIngressIspconfigPassword: 'secret',
      smtpIngressIspconfigInsecure: true,
    });
    expect(publicSettings.smtpIngressIspconfigUser).toBe('remote');
    expect(publicSettings.smtpIngressIspconfigPasswordConfigured).toBe(true);
    expect(publicSettings).not.toHaveProperty('smtpIngressIspconfigPassword');
    expect(publicSettings.smtpIngressAcmeChallenge).toBe('dns-manual');
    expect(publicSettings.smtpIngressAcmeDnsName).toBe(
      '_acme-challenge.smtp.example.com',
    );
    expect(publicSettings).not.toHaveProperty('smtpIngressAcmeOrder');
    expect(publicSettings.smtpListenPorts).toEqual([587, 2525]);
    expect(publicSettings.smtpIngressTlsConfigured).toBe(true);
    expect(publicSettings.smtpIngressTlsSource).toBe('letsencrypt');
    expect(publicSettings.smtpIngressTlsDomain).toBe('smtp.example.com');
    expect(publicSettings.smtpIngressTlsExpiresAt).toBe('2026-11-12T00:00:00.000Z');
    expect(publicSettings.smtpIngressTlsRenewAt).toBe('2026-10-13T00:00:00.000Z');
    expect(publicSettings).not.toHaveProperty('smtpIngressTlsCert');
    expect(publicSettings).not.toHaveProperty('smtpIngressTlsKey');
    expect(publicSettings).not.toHaveProperty('smtpIngressAcmeAccountKey');
    expect(publicSettings).not.toHaveProperty('smtpIngressAcmeHttpToken');
    expect(publicSettings.sesAccessKeyConfigured).toBe(true);
    expect(publicSettings.sesSecretConfigured).toBe(true);
    expect(publicSettings.smtpPasswordConfigured).toBe(true);
    expect(publicSettings).not.toHaveProperty('sesAccessKeyId');
    expect(publicSettings).not.toHaveProperty('sesSecretAccessKey');
    expect(publicSettings).not.toHaveProperty('smtpPassword');
  });
});

describe('keepSecret', () => {
  it('keeps the stored value when the incoming field is blank or masked', () => {
    expect(keepSecret(undefined, 'stored')).toBe('stored');
    expect(keepSecret('', 'stored')).toBe('stored');
    expect(keepSecret('********', 'stored')).toBe('stored');
    expect(keepSecret('••••••••', 'stored')).toBe('stored');
  });

  it('replaces the stored value when a new secret is provided', () => {
    expect(keepSecret('rotated', 'stored')).toBe('rotated');
    expect(keepSecret('rotated', null)).toBe('rotated');
  });
});
