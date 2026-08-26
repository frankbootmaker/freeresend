'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

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

export default function PlatformSettingsTab() {
  const { t } = usePrefs();
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
  const [alertEmail, setAlertEmail] = useState('');
  const [alertFrom, setAlertFrom] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        setAlertEmail(settings.alertEmail || '');
        setAlertFrom(settings.alertFrom || '');
      })
      .catch((err: unknown) => {
        setError((err as { message?: string }).message || t.settings.saveFailed);
      });
  }, [t.settings.saveFailed]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
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
      });
      const settings = res.data.settings;
      setSesAccessKeyId('');
      setSesSecretAccessKey('');
      setSmtpPassword('');
      setSesAccessKeyConfigured(Boolean(settings.sesAccessKeyConfigured));
      setSesSecretConfigured(Boolean(settings.sesSecretConfigured));
      setSmtpPasswordConfigured(Boolean(settings.smtpPasswordConfigured));
      setMessage(t.settings.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.settings.saveFailed);
    }
  };

  const secretPlaceholder = (configured: boolean) =>
    configured ? t.settings.secretSet : undefined;

  return (
    <form onSubmit={save}>
      <div className="cols">
        <section className="card">
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
          </div>
        </section>
        <section className="card">
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
                onClick={() => setSmtpEnabled(false)}
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
          </div>
        </section>
      </div>
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
          {error && <div className="fr-error" role="alert">{error}</div>}
          {message && <div className="fr-ok" role="status">{message}</div>}
          <button className="primary save" type="submit">
            {t.settings.save}
          </button>
        </div>
      </section>
    </form>
  );
}
