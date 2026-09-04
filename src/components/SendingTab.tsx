'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { DEFAULT_SES_CONFIGURATION_SET, SMTP_SUBMISSION_USERNAME } from '@/lib/brand';
import { usePrefs } from '@/contexts/PrefsContext';

type Ingress = 'https' | 'smtp' | 'both';
type Egress = 'ses' | 'smtp';
type SesMode = 'platform' | 'byo';

function SegButton({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={active ? 'on' : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

export default function SendingTab() {
  const { t } = usePrefs();
  const [ingress, setIngress] = useState<Ingress>('https');
  const [transport, setTransport] = useState<Egress>('ses');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [smtpIngress, setSmtpIngress] = useState({
    host: 'localhost',
    port: 587,
    ports: [587, 2525],
  });
  const [sesMode, setSesMode] = useState<SesMode>('platform');
  const [sesByoAllowed, setSesByoAllowed] = useState(false);
  const [sesByoRequestedAt, setSesByoRequestedAt] = useState<string | null>(null);
  const [requestingByo, setRequestingByo] = useState(false);
  const [sesAccessKey, setSesAccessKey] = useState('');
  const [sesSecretKey, setSesSecretKey] = useState('');
  const [ses, setSes] = useState({
    region: 'eu-central-1',
    configurationSet: DEFAULT_SES_CONFIGURATION_SET,
    accessKeyConfigured: false,
  });
  const [platformRelay, setPlatformRelay] = useState({
    enabled: false,
    host: '',
  });
  const [caps, setCaps] = useState<{
    hourly: number;
    daily: number;
    monthly: number;
    usedHour: number;
    usedDay: number;
    used: number;
  } | null>(null);

  useEffect(() => {
    api.getTenantStats(1).then((res) => {
      const quota = res.data?.quota;
      if (!quota) return;
      setCaps({
        hourly: quota.hourly,
        daily: quota.daily,
        monthly: quota.monthly,
        usedHour: quota.usedHour,
        usedDay: quota.usedDay,
        used: quota.used,
      });
    }).catch(() => {
      setCaps(null);
    });
    api.getTenant().then((res) => {
      const tenant = res.data.tenant;
      setIngress(tenant.inbound_transport || 'https');
      setTransport(tenant.outbound_transport);
      if (tenant.smtp_upstream?.host) setHost(tenant.smtp_upstream.host);
      if (tenant.smtp_upstream?.port) setPort(tenant.smtp_upstream.port);
      if (tenant.smtp_upstream?.username) {
        setUsername(tenant.smtp_upstream.username);
      }
      if (typeof tenant.smtp_upstream?.secure === 'boolean') {
        setSecure(tenant.smtp_upstream.secure);
      }
      if (res.data.smtpIngress) {
        const ports = Array.isArray(res.data.smtpIngress.ports)
          ? res.data.smtpIngress.ports
          : [res.data.smtpIngress.port];
        setSmtpIngress({
          host: res.data.smtpIngress.host,
          port: res.data.smtpIngress.port,
          ports,
        });
      }
      if (res.data.ses) {
        const allowed = Boolean(res.data.ses.byoAllowed);
        setSesByoAllowed(allowed);
        setSesByoRequestedAt(res.data.ses.byoRequestedAt || null);
        setSesMode(allowed && res.data.ses.mode === 'byo' ? 'byo' : 'platform');
        setSes({
          region: res.data.ses.region,
          configurationSet:
            res.data.ses.configurationSet || DEFAULT_SES_CONFIGURATION_SET,
          accessKeyConfigured: Boolean(res.data.ses.accessKeyConfigured),
        });
      }
      if (res.data.platformSmtpRelay) {
        setPlatformRelay({
          enabled: Boolean(res.data.platformSmtpRelay.enabled),
          host: res.data.platformSmtpRelay.host || '',
        });
      }
    });
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.updateTenantSending({
        inboundTransport: ingress,
        outboundTransport: transport,
        sesMode: transport === 'ses' ? sesMode : undefined,
        sesConfig:
          transport === 'ses' && sesMode === 'byo'
            ? {
                region: ses.region,
                configurationSet: ses.configurationSet,
                accessKeyId: sesAccessKey,
                secretAccessKey: sesSecretKey,
              }
            : undefined,
        smtpUpstream:
          transport === 'smtp'
            ? host.trim()
              ? {
                  host: host.trim(),
                  port: Number(port),
                  secure,
                  username,
                  password,
                }
              : null
            : undefined,
      });
      setMessage(t.sending.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.sending.saveFailed);
    }
  };

  const requestByo = async () => {
    setError('');
    setMessage('');
    setRequestingByo(true);
    try {
      const res = await api.requestByoSes();
      setSesByoRequestedAt(res.data.requestedAt || new Date().toISOString());
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.sending.sesByoRequestFailed);
    } finally {
      setRequestingByo(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const showHttps = ingress === 'https' || ingress === 'both';
  const showSmtp = ingress === 'smtp' || ingress === 'both';
  const ingressLead =
    ingress === 'smtp'
      ? t.sending.smtpIngressHint
      : ingress === 'both'
        ? t.sending.bothHint
        : t.sending.httpsHint;

  return (
    <form onSubmit={save}>
      <div className="cols">
        <section className="card">
          <header className="cardhead">
            <h2>{t.sending.ingressPolicy}</h2>
          </header>
          <div className="cardbody">
            <div className="seg" role="radiogroup" aria-label={t.sending.ingressAria}>
              <SegButton
                active={ingress === 'https'}
                onClick={() => setIngress('https')}
              >
                {t.sending.https}
              </SegButton>
              <SegButton active={ingress === 'smtp'} onClick={() => setIngress('smtp')}>
                {t.sending.smtp}
              </SegButton>
              <SegButton active={ingress === 'both'} onClick={() => setIngress('both')}>
                {t.sending.both}
              </SegButton>
            </div>
            <p className="cardlead">{ingressLead}</p>
            {caps && (
              <p className="cardlead" data-testid="sending-caps">
                <strong>{t.sending.capsTitle}.</strong>{' '}
                {t.sending.capsLine(
                  caps.usedHour,
                  caps.hourly,
                  caps.usedDay,
                  caps.daily,
                  caps.used,
                  caps.monthly,
                )}
                .{' '}
                {t.sending.capsHint}
              </p>
            )}
            <div className="formgrid">
              {showHttps && (
                <>
                  <div className="field">
                    <label>{t.sending.publicApiUrl}</label>
                    <input readOnly value={`${origin}/api`} />
                  </div>
                  <p className="cardlead">{t.sending.resendBaseHint}</p>
                </>
              )}
              {showSmtp && (
                <>
                  <div className="field">
                    <label>{t.sending.smtpHost}</label>
                    <input readOnly value={smtpIngress.host} />
                  </div>
                  <div className="field">
                    <label>{t.sending.smtpPort}</label>
                    <input readOnly value={smtpIngress.ports.join(', ')} />
                  </div>
                  <div className="field">
                    <label>{t.sending.smtpUser}</label>
                    <input readOnly value={SMTP_SUBMISSION_USERNAME} />
                  </div>
                  <p className="cardlead">{t.sending.smtpPassHint}</p>
                </>
              )}
            </div>
          </div>
        </section>
        <section className="card">
          <header className="cardhead">
            <h2>{t.sending.egressConnector}</h2>
          </header>
          <div className="cardbody">
            <div className="seg" role="radiogroup" aria-label={t.sending.upstreamAria}>
              <SegButton
                active={transport === 'ses'}
                onClick={() => setTransport('ses')}
              >
                {t.sending.amazonSes}
              </SegButton>
              <SegButton
                active={transport === 'smtp'}
                onClick={() => setTransport('smtp')}
              >
                {t.sending.smtpRelay}
              </SegButton>
            </div>
            {transport === 'ses' && (
              <>
                <div className="seg" role="radiogroup" aria-label={t.sending.sesAccountAria}>
                  <SegButton
                    active={sesMode === 'platform'}
                    onClick={() => setSesMode('platform')}
                  >
                    {t.sending.sesPlatform}
                  </SegButton>
                  <SegButton
                    active={sesMode === 'byo'}
                    disabled={!sesByoAllowed}
                    onClick={() => {
                      if (sesByoAllowed) setSesMode('byo');
                    }}
                  >
                    {t.sending.sesByo}
                  </SegButton>
                </div>
                {!sesByoAllowed && (
                  <div className="byo-request">
                    {sesByoRequestedAt ? (
                      <p className="fr-ok">{t.sending.sesByoRequested}</p>
                    ) : (
                      <>
                        <p className="cardlead">{t.sending.sesByoLockedHint}</p>
                        <p className="cardlead">{t.sending.sesByoFeeHint}</p>
                        <button
                          type="button"
                          className="primary"
                          disabled={requestingByo}
                          onClick={requestByo}
                        >
                          {requestingByo
                            ? t.sending.sesByoRequesting
                            : t.sending.sesByoRequest}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {sesByoAllowed && (
                  <div className="byo-request">
                    <p className="cardlead">{t.sending.sesByoAllowedLead}</p>
                    <p className="cardlead">{t.sending.sesByoChecklistTitle}</p>
                    <ol className="checklist">
                      {t.sending.sesByoChecklist.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            )}
            {transport === 'smtp' ? (
              <div className="formgrid">
                {platformRelay.enabled && (
                  <p className="cardlead">
                    {t.sending.platformRelayHint}
                    {platformRelay.host ? ` (${platformRelay.host})` : ''}
                  </p>
                )}
                <div className="field">
                  <label>{t.sending.smtpHost}</label>
                  <input
                    placeholder="smtp.relay.example"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{t.sending.smtpPort}</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                  />
                </div>
                <div className="field">
                  <label>{t.sending.tlsMode}</label>
                  <select
                    value={secure ? 'required' : 'opportunistic'}
                    onChange={(e) => setSecure(e.target.value === 'required')}
                  >
                    <option value="required">{t.sending.tlsRequired}</option>
                    <option value="opportunistic">{t.sending.tlsOpportunistic}</option>
                  </select>
                </div>
                <div className="field">
                  <label>{t.sending.username}</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{t.sending.secret}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            ) : sesMode === 'byo' && sesByoAllowed ? (
              <div className="formgrid">
                <div className="field">
                  <label>{t.sending.awsRegion}</label>
                  <input
                    value={ses.region}
                    onChange={(e) => setSes({ ...ses, region: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>{t.sending.configSet}</label>
                  <input
                    value={ses.configurationSet}
                    onChange={(e) =>
                      setSes({ ...ses, configurationSet: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>{t.sending.accessKey}</label>
                  <input
                    placeholder="AKIA…"
                    value={sesAccessKey}
                    onChange={(e) => setSesAccessKey(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{t.sending.secretKey}</label>
                  <input
                    type="password"
                    placeholder={ses.accessKeyConfigured ? '••••••••' : ''}
                    value={sesSecretKey}
                    onChange={(e) => setSesSecretKey(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="cardlead">
                {t.sending.sesPlatformHint(ses.region, ses.configurationSet)}
              </p>
            )}
            {error && <div className="fr-error">{error}</div>}
            {message && <div className="fr-ok">{message}</div>}
            <button className="primary save" type="submit">
              {t.sending.saveRoute}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
