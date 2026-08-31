'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';
import type { Locale } from '@/lib/i18n';

function SegButton({
  active,
  onClick,
  children,
  disabled,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      className={active ? 'on' : undefined}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

type TlsStatus = 'idle' | 'pending' | 'waiting_dns' | 'issued' | 'error';
type AcmeChallenge =
  | 'http-01'
  | 'dns-digitalocean'
  | 'dns-ispconfig'
  | 'dns-manual';

function applyTlsSettings(settings: Record<string, unknown>, setters: {
  setIngressTlsConfigured: (value: boolean) => void;
  setIngressTlsSource: (value: 'letsencrypt' | 'manual') => void;
  setIngressTlsDomain: (value: string) => void;
  setIngressTlsStatus: (value: TlsStatus) => void;
  setIngressTlsError: (value: string) => void;
  setIngressTlsExpiresAt: (value: string) => void;
  setIngressTlsRenewAt: (value: string) => void;
  setAcmeChallenge: (value: AcmeChallenge) => void;
  setAcmeDnsName: (value: string) => void;
  setAcmeDnsValue: (value: string) => void;
  setIspconfigUrl: (value: string) => void;
  setIspconfigUser: (value: string) => void;
  setIspconfigPasswordConfigured: (value: boolean) => void;
  setIspconfigInsecure: (value: boolean) => void;
}) {
  setters.setIngressTlsConfigured(Boolean(settings.smtpIngressTlsConfigured));
  setters.setIngressTlsSource(
    settings.smtpIngressTlsSource === 'manual' ? 'manual' : 'letsencrypt',
  );
  setters.setIngressTlsDomain(String(settings.smtpIngressTlsDomain || ''));
  const status = settings.smtpIngressTlsStatus;
  setters.setIngressTlsStatus(
    status === 'pending'
    || status === 'waiting_dns'
    || status === 'issued'
    || status === 'error'
      ? status
      : 'idle',
  );
  setters.setIngressTlsError(String(settings.smtpIngressTlsError || ''));
  setters.setIngressTlsExpiresAt(String(settings.smtpIngressTlsExpiresAt || ''));
  setters.setIngressTlsRenewAt(String(settings.smtpIngressTlsRenewAt || ''));
  const challenge = settings.smtpIngressAcmeChallenge;
  setters.setAcmeChallenge(
    challenge === 'http-01'
    || challenge === 'dns-digitalocean'
    || challenge === 'dns-ispconfig'
      ? challenge
      : 'dns-manual',
  );
  setters.setAcmeDnsName(String(settings.smtpIngressAcmeDnsName || ''));
  setters.setAcmeDnsValue(String(settings.smtpIngressAcmeDnsValue || ''));
  setters.setIspconfigUrl(String(settings.smtpIngressIspconfigUrl || ''));
  setters.setIspconfigUser(String(settings.smtpIngressIspconfigUser || ''));
  setters.setIspconfigPasswordConfigured(
    Boolean(settings.smtpIngressIspconfigPasswordConfigured),
  );
  setters.setIspconfigInsecure(Boolean(settings.smtpIngressIspconfigInsecure));
}

function formatTlsWhen(iso: string, locale: Locale): string {
  if (!iso) return '—';
  const tag = locale === 'de' ? 'de-DE' : locale === 'hu' ? 'hu-HU' : 'en-GB';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(tag, { dateStyle: 'medium', timeStyle: 'short' });
}

export type SettingsSection =
  | 'ses'
  | 'smtp'
  | 'ingress'
  | 'alerts'
  | 'oidc'
  | 'test';

export default function PlatformSettingsTab({
  section = 'ses',
}: {
  section?: SettingsSection;
}) {
  const { t, locale } = usePrefs();
  const [sesRegion, setSesRegion] = useState('us-east-1');
  const [sesConfigurationSet, setSesConfigurationSet] = useState('');
  const [sesAccessKeyId, setSesAccessKeyId] = useState('');
  const [sesSecretAccessKey, setSesSecretAccessKey] = useState('');
  const [sesAccessKeyConfigured, setSesAccessKeyConfigured] = useState(false);
  const [sesSecretConfigured, setSesSecretConfigured] = useState(false);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [listenPorts, setListenPorts] = useState<number[]>([2525, 587]);
  const [ingressTlsMode, setIngressTlsMode] = useState<
    'off' | 'starttls' | 'required'
  >('off');
  const [ingressTlsCert, setIngressTlsCert] = useState('');
  const [ingressTlsKey, setIngressTlsKey] = useState('');
  const [ingressTlsConfigured, setIngressTlsConfigured] = useState(false);
  const [ingressTlsSource, setIngressTlsSource] = useState<
    'letsencrypt' | 'manual'
  >('letsencrypt');
  const [ingressTlsDomain, setIngressTlsDomain] = useState('');
  const [ingressTlsStatus, setIngressTlsStatus] = useState<TlsStatus>('idle');
  const [ingressTlsError, setIngressTlsError] = useState('');
  const [ingressTlsExpiresAt, setIngressTlsExpiresAt] = useState('');
  const [ingressTlsRenewAt, setIngressTlsRenewAt] = useState('');
  const [acmeChallenge, setAcmeChallenge] = useState<AcmeChallenge>('dns-manual');
  const [acmeDnsName, setAcmeDnsName] = useState('');
  const [acmeDnsValue, setAcmeDnsValue] = useState('');
  const [ispconfigUrl, setIspconfigUrl] = useState('');
  const [ispconfigUser, setIspconfigUser] = useState('');
  const [ispconfigPassword, setIspconfigPassword] = useState('');
  const [ispconfigPasswordConfigured, setIspconfigPasswordConfigured] = useState(false);
  const [ispconfigInsecure, setIspconfigInsecure] = useState(false);
  const [issuingCert, setIssuingCert] = useState(false);
  const [watchCertUntil, setWatchCertUntil] = useState(0);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertFrom, setAlertFrom] = useState('');
  const [testFrom, setTestFrom] = useState('');
  const [testTo, setTestTo] = useState('');
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [oidcIssuer, setOidcIssuer] = useState('');
  const [oidcClientId, setOidcClientId] = useState('');
  const [oidcClientSecret, setOidcClientSecret] = useState('');
  const [oidcClientSecretConfigured, setOidcClientSecretConfigured] = useState(false);
  const [oidcJitEnabled, setOidcJitEnabled] = useState(false);
  const [oidcAdminGroup, setOidcAdminGroup] = useState('');
  const [oidcRedirectUri, setOidcRedirectUri] = useState('');
  const [testVia, setTestVia] = useState<'ses' | 'smtp'>('ses');
  const [testSending, setTestSending] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    api
      .getPlatformSettings()
      .then((res) => {
        const settings = res.data.settings;
        setSesRegion(settings.sesRegion || 'us-east-1');
        setSesConfigurationSet(settings.sesConfigurationSet || '');
        setSesAccessKeyConfigured(Boolean(settings.sesAccessKeyConfigured));
        setSesSecretConfigured(Boolean(settings.sesSecretConfigured));
        setSmtpEnabled(Boolean(settings.smtpEnabled));
        setSmtpHost(settings.smtpHost || '');
        setSmtpPort(Number(settings.smtpPort) || 587);
        setSmtpSecure(settings.smtpSecure !== false);
        setSmtpUsername(settings.smtpUsername || '');
        setSmtpPasswordConfigured(Boolean(settings.smtpPasswordConfigured));
        setListenPorts(
          Array.isArray(settings.smtpListenPorts) && settings.smtpListenPorts.length
            ? settings.smtpListenPorts
            : [2525, 587],
        );
        setIngressTlsMode(settings.smtpIngressTlsMode || 'off');
        applyTlsSettings(settings, {
          setIngressTlsConfigured,
          setIngressTlsSource,
          setIngressTlsDomain,
          setIngressTlsStatus,
          setIngressTlsError,
          setIngressTlsExpiresAt,
          setIngressTlsRenewAt,
          setAcmeChallenge,
          setAcmeDnsName,
          setAcmeDnsValue,
          setIspconfigUrl,
          setIspconfigUser,
          setIspconfigPasswordConfigured,
          setIspconfigInsecure,
        });
        setAlertEmail(settings.alertEmail || '');
        setAlertFrom(settings.alertFrom || '');
        setOidcEnabled(Boolean(settings.oidcEnabled));
        setOidcIssuer(settings.oidcIssuer || '');
        setOidcClientId(settings.oidcClientId || '');
        setOidcClientSecretConfigured(Boolean(settings.oidcClientSecretConfigured));
        setOidcJitEnabled(Boolean(settings.oidcJitEnabled));
        setOidcAdminGroup(settings.oidcAdminGroup || '');
        setOidcRedirectUri(
          typeof window !== 'undefined'
            ? `${window.location.origin}/api/auth/oidc/callback`
            : String(settings.oidcRedirectUri || ''),
        );
        setTestFrom((current) => current || settings.alertFrom || '');
        setTestTo((current) => current || settings.alertEmail || '');
        if (
          settings.smtpEnabled
          && (!settings.sesAccessKeyConfigured || !settings.sesSecretConfigured)
        ) {
          setTestVia('smtp');
        } else {
          setTestVia('ses');
        }
      })
      .catch((err: unknown) => {
        setSaveError(
          (err as { message?: string }).message || t.settings.saveFailed,
        );
      });
  }, [t.settings.saveFailed]);

  useEffect(() => {
    const watching = watchCertUntil > Date.now();
    if (
      ingressTlsSource !== 'letsencrypt'
      || (ingressTlsStatus !== 'pending' && !watching)
    ) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      api
        .getPlatformSettings()
        .then((res) => {
          applyTlsSettings(res.data.settings, {
            setIngressTlsConfigured,
            setIngressTlsSource,
            setIngressTlsDomain,
            setIngressTlsStatus,
            setIngressTlsError,
            setIngressTlsExpiresAt,
            setIngressTlsRenewAt,
            setAcmeChallenge,
            setAcmeDnsName,
            setAcmeDnsValue,
            setIspconfigUrl,
            setIspconfigUser,
            setIspconfigPasswordConfigured,
            setIspconfigInsecure,
          });
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [ingressTlsSource, ingressTlsStatus, watchCertUntil]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveMessage('');
    try {
      const res = await api.updatePlatformSettings({
        sesRegion,
        sesConfigurationSet,
        sesAccessKeyId,
        sesSecretAccessKey,
        smtpEnabled,
        smtpHost,
        smtpPort: Number(smtpPort) || 587,
        smtpSecure,
        smtpUsername,
        smtpPassword,
        alertEmail,
        alertFrom,
        smtpListenPorts: listenPorts,
        smtpIngressTlsMode: ingressTlsMode,
        smtpIngressTlsCert: ingressTlsCert,
        smtpIngressTlsKey: ingressTlsKey,
        smtpIngressTlsSource: ingressTlsSource,
        smtpIngressTlsDomain: ingressTlsDomain,
        smtpIngressAcmeChallenge: acmeChallenge,
        smtpIngressIspconfigUrl: ispconfigUrl,
        smtpIngressIspconfigUser: ispconfigUser,
        smtpIngressIspconfigPassword: ispconfigPassword,
        smtpIngressIspconfigInsecure: ispconfigInsecure,
        oidcEnabled,
        oidcIssuer,
        oidcClientId,
        oidcClientSecret,
        oidcJitEnabled,
        oidcAdminGroup,
      });
      const settings = res.data.settings;
      setSesAccessKeyId('');
      setSesSecretAccessKey('');
      setSmtpPassword('');
      setIspconfigPassword('');
      setIngressTlsCert('');
      setIngressTlsKey('');
      setOidcClientSecret('');
      setSesAccessKeyConfigured(Boolean(settings.sesAccessKeyConfigured));
      setSesSecretConfigured(Boolean(settings.sesSecretConfigured));
      setSmtpPasswordConfigured(Boolean(settings.smtpPasswordConfigured));
      setOidcClientSecretConfigured(Boolean(settings.oidcClientSecretConfigured));
      setOidcEnabled(Boolean(settings.oidcEnabled));
      setOidcIssuer(settings.oidcIssuer || '');
      setOidcClientId(settings.oidcClientId || '');
      setOidcJitEnabled(Boolean(settings.oidcJitEnabled));
      setOidcAdminGroup(settings.oidcAdminGroup || '');
      applyTlsSettings(settings, {
        setIngressTlsConfigured,
        setIngressTlsSource,
        setIngressTlsDomain,
        setIngressTlsStatus,
        setIngressTlsError,
        setIngressTlsExpiresAt,
        setIngressTlsRenewAt,
        setAcmeChallenge,
        setAcmeDnsName,
        setAcmeDnsValue,
        setIspconfigUrl,
        setIspconfigUser,
        setIspconfigPasswordConfigured,
        setIspconfigInsecure,
      });
      if (ingressTlsSource === 'letsencrypt' && ingressTlsDomain.trim()) {
        setWatchCertUntil(Date.now() + 120000);
      }
      setSaveMessage(t.settings.saved);
    } catch (err: unknown) {
      setSaveError(
        (err as { message?: string }).message || t.settings.saveFailed,
      );
    }
  };

  const sendTest = async (e: FormEvent) => {
    e.preventDefault();
    setTestError('');
    setTestMessage('');
    if (testVia === 'smtp' && !smtpEnabled) {
      setTestVia('ses');
      return;
    }
    setTestSending(true);
    try {
      const res = await api.sendPlatformTestEmail({
        from: testFrom.trim(),
        to: testTo.trim(),
        via: testVia,
      });
      setTestMessage(
        t.settings.testSent(res.data.via, res.data.messageId || ''),
      );
    } catch (err: unknown) {
      setTestError(
        (err as { message?: string }).message || t.settings.testFailed,
      );
    } finally {
      setTestSending(false);
    }
  };

  const secretPlaceholder = (configured: boolean) =>
    configured ? t.settings.secretSet : undefined;

  const toggleListenPort = (port: number) => {
    setListenPorts((current) => {
      if (current.includes(port)) {
        if (current.length === 1) return current;
        return current.filter((value) => value !== port);
      }
      return [...current, port];
    });
  };

  const issueCert = async () => {
    setSaveError('');
    setSaveMessage('');
    setIssuingCert(true);
    try {
      await api.updatePlatformSettings({
        smtpListenPorts: listenPorts,
        smtpIngressTlsMode: ingressTlsMode,
        smtpIngressTlsSource: ingressTlsSource,
        smtpIngressTlsDomain: ingressTlsDomain,
        smtpIngressAcmeChallenge: acmeChallenge,
        smtpIngressIspconfigUrl: ispconfigUrl,
        smtpIngressIspconfigUser: ispconfigUser,
        smtpIngressIspconfigPassword: ispconfigPassword,
        smtpIngressIspconfigInsecure: ispconfigInsecure,
      });
      const res = await api.issuePlatformCertificate('issue');
      applyTlsSettings(res.data.settings, {
        setIngressTlsConfigured,
        setIngressTlsSource,
        setIngressTlsDomain,
        setIngressTlsStatus,
        setIngressTlsError,
        setIngressTlsExpiresAt,
        setIngressTlsRenewAt,
        setAcmeChallenge,
        setAcmeDnsName,
        setAcmeDnsValue,
        setIspconfigUrl,
        setIspconfigUser,
        setIspconfigPasswordConfigured,
        setIspconfigInsecure,
      });
      setWatchCertUntil(Date.now() + 120000);
    } catch (err: unknown) {
      setSaveError(
        (err as { message?: string }).message || t.settings.saveFailed,
      );
    } finally {
      setIssuingCert(false);
    }
  };

  const continueDns = async () => {
    setSaveError('');
    setIssuingCert(true);
    try {
      const res = await api.issuePlatformCertificate('continue');
      applyTlsSettings(res.data.settings, {
        setIngressTlsConfigured,
        setIngressTlsSource,
        setIngressTlsDomain,
        setIngressTlsStatus,
        setIngressTlsError,
        setIngressTlsExpiresAt,
        setIngressTlsRenewAt,
        setAcmeChallenge,
        setAcmeDnsName,
        setAcmeDnsValue,
        setIspconfigUrl,
        setIspconfigUser,
        setIspconfigPasswordConfigured,
        setIspconfigInsecure,
      });
      setWatchCertUntil(Date.now() + 120000);
    } catch (err: unknown) {
      setSaveError(
        (err as { message?: string }).message || t.settings.saveFailed,
      );
    } finally {
      setIssuingCert(false);
    }
  };

  const tlsReady =
    ingressTlsConfigured
    || (ingressTlsSource === 'manual' && Boolean(ingressTlsCert.trim()));

  const saveFooter = (
    <>
      {saveError && (
        <div className="fr-error" role="alert">{saveError}</div>
      )}
      {saveMessage && (
        <div className="fr-ok" role="status">{saveMessage}</div>
      )}
      <button className="primary save" type="submit">
        {t.settings.save}
      </button>
    </>
  );

  return (
    <>
      {section !== 'test' && (
      <form onSubmit={save}>
        {section === 'ses' && (
        <section className="card settings-alerts">
          <header className="cardhead">
            <h2>{t.settings.sesTitle}</h2>
          </header>
          <div className="cardbody">
            <p className="cardlead">{t.settings.sesLead}</p>
            <div className="formgrid">
              <div className="field">
                <label>{t.sending.awsRegion}</label>
                <input
                  value={sesRegion}
                  onChange={(e) => setSesRegion(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>{t.sending.configSet}</label>
                <input
                  value={sesConfigurationSet}
                  onChange={(e) => setSesConfigurationSet(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>{t.sending.accessKey}</label>
                <input
                  value={sesAccessKeyId}
                  onChange={(e) => setSesAccessKeyId(e.target.value)}
                  placeholder={secretPlaceholder(sesAccessKeyConfigured)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>{t.sending.secretKey}</label>
                <input
                  type="password"
                  value={sesSecretAccessKey}
                  onChange={(e) => setSesSecretAccessKey(e.target.value)}
                  placeholder={secretPlaceholder(sesSecretConfigured)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            {saveFooter}
          </div>
        </section>
        )}
        {section === 'smtp' && (
        <section className="card settings-alerts">
          <header className="cardhead">
            <h2>{t.settings.smtpTitle}</h2>
          </header>
          <div className="cardbody">
            <p className="cardlead">{t.settings.smtpLead}</p>
            <div className="seg" role="radiogroup" aria-label={t.settings.smtpTitle}>
              <SegButton active={smtpEnabled} onClick={() => setSmtpEnabled(true)}>
                {t.settings.smtpEnabled}
              </SegButton>
              <SegButton
                active={!smtpEnabled}
                onClick={() => {
                  setSmtpEnabled(false);
                  setTestVia('ses');
                }}
              >
                {t.settings.smtpDisabled}
              </SegButton>
            </div>
            <div className="formgrid">
              <div className="field">
                <label>{t.sending.smtpHost}</label>
                <input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.relay.example"
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>{t.sending.smtpPort}</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label>{t.sending.username}</label>
                <input
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label>{t.sending.secret}</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder={secretPlaceholder(smtpPasswordConfigured)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>{t.sending.tlsMode}</label>
                <select
                  value={smtpSecure ? 'required' : 'opportunistic'}
                  onChange={(e) => setSmtpSecure(e.target.value === 'required')}
                >
                  <option value="required">{t.sending.tlsRequired}</option>
                  <option value="opportunistic">{t.sending.tlsOpportunistic}</option>
                </select>
              </div>
            </div>
            {saveFooter}
          </div>
        </section>
        )}
        {section === 'ingress' && (
      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.settings.ingressTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.settings.ingressLead}</p>
          <label className="field-label">{t.settings.listenPorts}</label>
          <div className="seg" role="group" aria-label={t.settings.listenPorts}>
            <SegButton
              active={listenPorts.includes(2525)}
              onClick={() => toggleListenPort(2525)}
            >
              {t.settings.port2525}
            </SegButton>
            <SegButton
              active={listenPorts.includes(587)}
              onClick={() => toggleListenPort(587)}
            >
              {t.settings.port587}
            </SegButton>
            <SegButton
              active={listenPorts.includes(465)}
              onClick={() => toggleListenPort(465)}
              disabled={!tlsReady}
              title={tlsReady ? undefined : t.settings.tlsHint}
            >
              {t.settings.port465}
            </SegButton>
          </div>
          <label className="field-label">{t.settings.ingressTls}</label>
          <div className="seg" role="radiogroup" aria-label={t.settings.ingressTls}>
            <SegButton
              active={ingressTlsMode === 'off'}
              onClick={() => {
                setIngressTlsMode('off');
                setListenPorts((current) => {
                  const next = current.filter((port) => port !== 465);
                  return next.length ? next : [2525, 587];
                });
              }}
            >
              {t.settings.tlsOff}
            </SegButton>
            <SegButton
              active={ingressTlsMode === 'starttls'}
              onClick={() => setIngressTlsMode('starttls')}
            >
              {t.settings.tlsStarttls}
            </SegButton>
            <SegButton
              active={ingressTlsMode === 'required'}
              onClick={() => setIngressTlsMode('required')}
            >
              {t.settings.tlsRequired}
            </SegButton>
          </div>
          <label className="field-label">{t.settings.tlsSource}</label>
          <div className="seg" role="radiogroup" aria-label={t.settings.tlsSource}>
            <SegButton
              active={ingressTlsSource === 'letsencrypt'}
              onClick={() => setIngressTlsSource('letsencrypt')}
            >
              {t.settings.tlsLetsEncrypt}
            </SegButton>
            <SegButton
              active={ingressTlsSource === 'manual'}
              onClick={() => setIngressTlsSource('manual')}
            >
              {t.settings.tlsManual}
            </SegButton>
          </div>
          {ingressTlsSource === 'letsencrypt' ? (
            <>
              <p className="cardlead">{t.settings.tlsLeHint}</p>
              <div className="formgrid">
                <div className="field">
                  <label>{t.settings.tlsDomain}</label>
                  <input
                    value={ingressTlsDomain}
                    onChange={(e) => setIngressTlsDomain(e.target.value)}
                    placeholder="smtp.example.com"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>
              <label className="field-label">{t.settings.tlsChallenge}</label>
              <div
                className="seg"
                role="radiogroup"
                aria-label={t.settings.tlsChallenge}
              >
                <SegButton
                  active={acmeChallenge === 'dns-manual'}
                  onClick={() => setAcmeChallenge('dns-manual')}
                >
                  {t.settings.tlsChallengeDns}
                </SegButton>
                <SegButton
                  active={acmeChallenge === 'dns-digitalocean'}
                  onClick={() => setAcmeChallenge('dns-digitalocean')}
                >
                  {t.settings.tlsChallengeDo}
                </SegButton>
                <SegButton
                  active={acmeChallenge === 'dns-ispconfig'}
                  onClick={() => setAcmeChallenge('dns-ispconfig')}
                >
                  {t.settings.tlsChallengeIsp}
                </SegButton>
                <SegButton
                  active={acmeChallenge === 'http-01'}
                  onClick={() => setAcmeChallenge('http-01')}
                >
                  {t.settings.tlsChallengeHttp}
                </SegButton>
              </div>
              <p className="cardlead">
                {acmeChallenge === 'http-01'
                  ? t.settings.tlsHttpHint
                  : acmeChallenge === 'dns-digitalocean'
                    ? t.settings.tlsDoHint
                    : acmeChallenge === 'dns-ispconfig'
                      ? t.settings.tlsIspHint
                      : t.settings.tlsDnsHint}
              </p>
              {acmeChallenge === 'dns-ispconfig' && (
                <div className="formgrid">
                  <div className="field">
                    <label>{t.settings.tlsIspUrl}</label>
                    <input
                      value={ispconfigUrl}
                      onChange={(e) => setIspconfigUrl(e.target.value)}
                      placeholder="https://panel.example.com:8080/remote/json.php"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="field">
                    <label>{t.settings.tlsIspUser}</label>
                    <input
                      value={ispconfigUser}
                      onChange={(e) => setIspconfigUser(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="field">
                    <label>{t.settings.tlsIspPassword}</label>
                    <input
                      type="password"
                      value={ispconfigPassword}
                      onChange={(e) => setIspconfigPassword(e.target.value)}
                      placeholder={secretPlaceholder(ispconfigPasswordConfigured)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="field">
                    <label>{t.settings.tlsIspTls}</label>
                    <div
                      className="seg"
                      role="radiogroup"
                      aria-label={t.settings.tlsIspTls}
                    >
                      <SegButton
                        active={!ispconfigInsecure}
                        onClick={() => setIspconfigInsecure(false)}
                      >
                        {t.settings.tlsIspSecure}
                      </SegButton>
                      <SegButton
                        active={ispconfigInsecure}
                        onClick={() => setIspconfigInsecure(true)}
                      >
                        {t.settings.tlsIspInsecure}
                      </SegButton>
                    </div>
                  </div>
                </div>
              )}
              {(acmeDnsName || acmeDnsValue) && (
                <div className="formgrid">
                  <div className="field">
                    <label>{t.settings.tlsDnsRecordName}</label>
                    <input readOnly value={acmeDnsName} spellCheck={false} />
                  </div>
                  <div className="field">
                    <label>{t.settings.tlsDnsRecordValue}</label>
                    <input readOnly value={acmeDnsValue} spellCheck={false} />
                  </div>
                </div>
              )}
              <div className="tls-meta" role="status">
                <p>
                  {ingressTlsStatus === 'pending'
                    ? t.settings.tlsStatusPending
                    : ingressTlsStatus === 'waiting_dns'
                      ? t.settings.tlsStatusWaitingDns
                      : ingressTlsStatus === 'issued'
                        ? t.settings.tlsStatusIssued
                        : ingressTlsStatus === 'error'
                          ? t.settings.tlsStatusError
                          : t.settings.tlsStatusIdle}
                </p>
                <p>
                  {ingressTlsExpiresAt
                    ? t.settings.tlsExpiresOn(
                        formatTlsWhen(ingressTlsExpiresAt, locale),
                      )
                    : t.settings.tlsNoCertYet}
                </p>
                {ingressTlsRenewAt ? (
                  <p>
                    {t.settings.tlsRenewsOn(
                      formatTlsWhen(ingressTlsRenewAt, locale),
                    )}
                  </p>
                ) : null}
              </div>
              {ingressTlsError && (
                <div className="fr-error" role="alert">{ingressTlsError}</div>
              )}
              {ingressTlsStatus === 'waiting_dns' ? (
                <button
                  className="primary save"
                  type="button"
                  onClick={continueDns}
                  disabled={issuingCert}
                >
                  {issuingCert
                    ? t.settings.tlsDnsContinuing
                    : t.settings.tlsDnsContinue}
                </button>
              ) : (
                <button
                  className="primary save"
                  type="button"
                  onClick={issueCert}
                  disabled={issuingCert || ingressTlsStatus === 'pending'}
                >
                  {issuingCert || ingressTlsStatus === 'pending'
                    ? t.settings.tlsIssuing
                    : t.settings.tlsIssueNow}
                </button>
              )}
            </>
          ) : (
            <>
              <p className="cardlead">{t.settings.tlsManualHint}</p>
              <div className="formgrid">
                <div className="field">
                  <label>{t.settings.tlsCert}</label>
                  <textarea
                    value={ingressTlsCert}
                    onChange={(e) => setIngressTlsCert(e.target.value)}
                    placeholder={secretPlaceholder(ingressTlsConfigured)}
                    rows={5}
                    spellCheck={false}
                  />
                </div>
                <div className="field">
                  <label>{t.settings.tlsKey}</label>
                  <textarea
                    value={ingressTlsKey}
                    onChange={(e) => setIngressTlsKey(e.target.value)}
                    placeholder={secretPlaceholder(ingressTlsConfigured)}
                    rows={5}
                    spellCheck={false}
                  />
                </div>
              </div>
            </>
          )}
          {saveFooter}
        </div>
      </section>
        )}
        {section === 'alerts' && (
      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.settings.alertTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.settings.alertLead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.settings.alertEmail}</label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="ops@example.com"
              />
            </div>
            <div className="field">
              <label>{t.settings.alertFrom}</label>
              <input
                type="email"
                value={alertFrom}
                onChange={(e) => setAlertFrom(e.target.value)}
                placeholder="alerts@example.com"
              />
            </div>
          </div>
          {saveError && (
            <div className="fr-error" role="alert">{saveError}</div>
          )}
          {saveMessage && (
            <div className="fr-ok" role="status">{saveMessage}</div>
          )}
          <button className="primary save" type="submit">
            {t.settings.save}
          </button>
        </div>
      </section>
        )}
        {section === 'oidc' && (
      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.settings.oidcTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.settings.oidcLead}</p>
          <label className="field-label">{t.settings.oidcEnabled}</label>
          <div className="seg" role="radiogroup" aria-label={t.settings.oidcEnabled}>
            <SegButton active={oidcEnabled} onClick={() => setOidcEnabled(true)}>
              {t.settings.oidcOn}
            </SegButton>
            <SegButton active={!oidcEnabled} onClick={() => setOidcEnabled(false)}>
              {t.settings.oidcOff}
            </SegButton>
          </div>
          <div className="formgrid">
            <div className="field">
              <label>{t.settings.oidcIssuer}</label>
              <input
                value={oidcIssuer}
                onChange={(e) => setOidcIssuer(e.target.value)}
                placeholder="https://authentik.example.com/application/o/relayhorizon/"
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>{t.settings.oidcRedirect}</label>
              <input
                value={oidcRedirectUri}
                readOnly
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="field">
              <label>{t.settings.oidcClientId}</label>
              <input
                value={oidcClientId}
                onChange={(e) => setOidcClientId(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label>{t.settings.oidcClientSecret}</label>
              <input
                type="password"
                value={oidcClientSecret}
                onChange={(e) => setOidcClientSecret(e.target.value)}
                placeholder={secretPlaceholder(oidcClientSecretConfigured)}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label>{t.settings.oidcAdminGroup}</label>
              <input
                value={oidcAdminGroup}
                onChange={(e) => setOidcAdminGroup(e.target.value)}
                placeholder="relayhorizon-admins"
                autoComplete="off"
              />
            </div>
          </div>
          <p className="cardlead">{t.settings.oidcIssuerHint}</p>
          <p className="cardlead">{t.settings.oidcAdminGroupHint}</p>
          <label className="field-label">{t.settings.oidcJit}</label>
          <div className="seg" role="radiogroup" aria-label={t.settings.oidcJit}>
            <SegButton active={oidcJitEnabled} onClick={() => setOidcJitEnabled(true)}>
              {t.settings.oidcJitOn}
            </SegButton>
            <SegButton
              active={!oidcJitEnabled}
              onClick={() => setOidcJitEnabled(false)}
            >
              {t.settings.oidcJitOff}
            </SegButton>
          </div>
          <p className="cardlead">{t.settings.oidcJitHint}</p>
          {saveFooter}
        </div>
      </section>
        )}
    </form>
      )}
      {section === 'test' && (
    <form className="settings-alerts" onSubmit={sendTest}>
      <section className="card">
        <header className="cardhead">
          <h2>{t.settings.testTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.settings.testLead}</p>
          <div className="seg" role="radiogroup" aria-label={t.settings.testVia}>
            <SegButton
              active={testVia === 'ses'}
              onClick={() => setTestVia('ses')}
            >
              {t.sending.amazonSes}
            </SegButton>
            <SegButton
              active={testVia === 'smtp'}
              onClick={() => setTestVia('smtp')}
              disabled={!smtpEnabled}
              title={smtpEnabled ? undefined : t.settings.testSmtpDisabled}
            >
              {t.sending.smtpRelay}
            </SegButton>
          </div>
          <div className="formgrid">
            <div className="field">
              <label>{t.settings.testFrom}</label>
              <input
                type="email"
                required
                value={testFrom}
                onChange={(e) => setTestFrom(e.target.value)}
                placeholder="hello@example.com"
              />
            </div>
            <div className="field">
              <label>{t.settings.testTo}</label>
              <input
                type="email"
                required
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>
          {testError && (
            <div className="fr-error" role="alert">{testError}</div>
          )}
          {testMessage && (
            <div className="fr-ok" role="status">{testMessage}</div>
          )}
          <button className="primary save" type="submit" disabled={testSending}>
            {testSending ? t.settings.testSending : t.settings.testSend}
          </button>
        </div>
      </section>
    </form>
      )}
    </>
  );
}
