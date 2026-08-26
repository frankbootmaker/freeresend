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
        alert_from: 'outpost@db.test',
      },
      env,
    );
    expect(resolved.sesRegion).toBe('eu-central-1');
    expect(resolved.sesAccessKeyId).toBe('db-key');
    expect(resolved.smtpEnabled).toBe(false);
    expect(resolved.smtpHost).toBe('smtp.db.example');
    expect(resolved.smtpPort).toBe(465);
    expect(resolved.alertEmail).toBe('ops@db.test');
    expect(resolved.alertFrom).toBe('outpost@db.test');
  });

  it('uses ADMIN_EMAIL and FROM_EMAIL when dedicated alert vars are missing', () => {
    const resolved = resolvePlatformSettings(null, {
      ADMIN_EMAIL: 'admin@env.test',
      FROM_EMAIL: 'noreply@env.test',
    });
    expect(resolved.alertEmail).toBe('admin@env.test');
    expect(resolved.alertFrom).toBe('noreply@env.test');
    expect(resolved.sesRegion).toBe('us-east-1');
    expect(resolved.sesConfigurationSet).toBe('outpost-prod');
    expect(resolved.smtpEnabled).toBe(false);
  });
});

describe('toPublicPlatformSettings', () => {
  it('never exposes secret material', () => {
    const publicSettings = toPublicPlatformSettings({
      sesRegion: 'eu-central-1',
      sesAccessKeyId: 'AKIAEXAMPLE',
      sesSecretAccessKey: 'secret',
      sesConfigurationSet: 'outpost-prod',
      smtpEnabled: true,
      smtpHost: 'smtp.example',
      smtpPort: 587,
      smtpSecure: true,
      smtpUsername: 'relay',
      smtpPassword: 'pw',
      alertEmail: 'ops@example.com',
      alertFrom: 'alerts@example.com',
    });
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
