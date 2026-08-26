'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

type Ingress = 'https' | 'smtp' | 'both';
type Egress = 'ses' | 'smtp';

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={active ? 'on' : undefined} onClick={onClick}>
      {children}
    </button>
  );
}

export default function SendingTab() {
  const { t } = usePrefs();
  const [ingress, setIngress] = useState<Ingress>('https');
  const [transport, setTransport] = useState<Egress>('ses');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(2525);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [smtpIngress, setSmtpIngress] = useState({
    host: 'localhost',
    port: 2525,
  });
  const [ses, setSes] = useState({
    region: 'eu-central-1',
    configurationSet: 'outpost-prod',
  });

  useEffect(() => {
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
        setSmtpIngress({
          host: res.data.smtpIngress.host,
          port: res.data.smtpIngress.port,
        });
      }
      if (res.data.ses) {
        setSes({
          region: res.data.ses.region,
          configurationSet: res.data.ses.configurationSet || 'outpost-prod',
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
        smtpUpstream:
          transport === 'smtp'
            ? { host, port: Number(port), secure, username, password }
            : undefined,
      });
      setMessage(t.sending.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.sending.saveFailed);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

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
            <div className="formgrid">
              <div className="field">
                <label>{t.sending.publicApiUrl}</label>
                <input readOnly value={`${origin}/api/emails`} />
              </div>
              <div className="field">
                <label>{t.sending.smtpHost}</label>
                <input readOnly value={smtpIngress.host} />
              </div>
              <div className="field">
                <label>{t.sending.smtpPort}</label>
                <input readOnly value={String(smtpIngress.port)} />
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
            {transport === 'smtp' ? (
              <div className="formgrid">
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
            ) : (
              <div className="formgrid">
                <div className="field">
                  <label>{t.sending.awsRegion}</label>
                  <input readOnly value={ses.region} />
                </div>
                <div className="field">
                  <label>{t.sending.configSet}</label>
                  <input readOnly value={ses.configurationSet} />
                </div>
                <div className="field">
                  <label>{t.sending.accessKey}</label>
                  <input readOnly placeholder="AKIA…" value="AKIA…" />
                </div>
                <div className="field">
                  <label>{t.sending.secretKey}</label>
                  <input readOnly type="password" value="••••••••" />
                </div>
              </div>
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
