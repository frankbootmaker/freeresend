'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';

type DnsRecord = {
  type: string;
  name: string;
  value: string;
  purpose?: string;
  status?: string;
};

type SystemDomain = {
  id: string;
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dnsRecords: DnsRecord[];
};

export default function PlatformSystemDomainSection() {
  const { t } = usePrefs();
  const [loading, setLoading] = useState(true);
  const [suggested, setSuggested] = useState('');
  const [suggestedPublic, setSuggestedPublic] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [domain, setDomain] = useState<SystemDomain | null>(null);
  const [localPart, setLocalPart] = useState('noreply');
  const [platformFrom, setPlatformFrom] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [checking, setChecking] = useState(false);
  const [savingFrom, setSavingFrom] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const applyState = (data: {
    suggested?: { domain?: string; isPublic?: boolean };
    domain?: SystemDomain | null;
    localPart?: string;
    platformFrom?: string;
  }) => {
    setSuggested(data.suggested?.domain || '');
    setSuggestedPublic(Boolean(data.suggested?.isPublic));
    setDomain(data.domain || null);
    setLocalPart(data.localPart || 'noreply');
    setPlatformFrom(data.platformFrom || '');
  };

  useEffect(() => {
    api
      .getSystemDomain()
      .then((res) => applyState(res.data))
      .catch((err: unknown) => {
        setError((err as { message?: string }).message || t.settings.saveFailed);
      })
      .finally(() => setLoading(false));
  }, [t.settings.saveFailed]);

  const attach = async (payload: { useWebHost?: boolean; domain?: string }) => {
    setAttaching(true);
    setError('');
    setMessage('');
    try {
      const res = await api.attachSystemDomain(payload);
      applyState(res.data);
      setCustomDomain('');
      setMessage(res.message || t.settings.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.settings.saveFailed);
    } finally {
      setAttaching(false);
    }
  };

  const handleCustom = async (e: FormEvent) => {
    e.preventDefault();
    if (!customDomain.trim()) return;
    await attach({ domain: customDomain.trim() });
  };

  const handleCheck = async () => {
    setChecking(true);
    setError('');
    setMessage('');
    try {
      const res = await api.verifySystemDomain();
      applyState(res.data);
      setMessage(res.message || t.settings.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.domains.verifyFailed);
    } finally {
      setChecking(false);
    }
  };

  const handleSaveFrom = async (e: FormEvent) => {
    e.preventDefault();
    setSavingFrom(true);
    setError('');
    setMessage('');
    try {
      const res = await api.saveSystemDomainFrom(localPart);
      applyState(res.data);
      setMessage(t.settings.saved);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.settings.saveFailed);
    } finally {
      setSavingFrom(false);
    }
  };

  const statusLabel = (status?: string) => {
    if (status === 'verified' || status === 'valid') {
      return t.domains.verified.toUpperCase();
    }
    if (status === 'failed' || status === 'invalid') {
      return t.domains.invalid.toUpperCase();
    }
    return t.domains.pending.toUpperCase();
  };

  if (loading) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <>
      <section className="card settings-alerts">
        <header className="cardhead">
          <h2>{t.settings.systemDomainTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.settings.systemDomainLead}</p>
          {suggested ? (
            <p className="cardlead">
              {t.settings.webHostLabel}: <code>{suggested}</code>
            </p>
          ) : null}
          <div className="filters">
            <button
              type="button"
              className="primary"
              disabled={attaching || !suggestedPublic}
              title={suggestedPublic ? undefined : t.settings.webHostUnavailable}
              onClick={() => attach({ useWebHost: true })}
            >
              {attaching ? t.settings.attachingDomain : t.settings.useWebHost}
            </button>
          </div>
          <form className="filters" onSubmit={handleCustom}>
            <input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder={t.settings.customDomain}
              disabled={attaching}
            />
            <button
              className="primary"
              type="submit"
              disabled={attaching || !customDomain.trim()}
            >
              {attaching ? t.settings.attachingDomain : t.settings.attachDomain}
            </button>
          </form>
          {error && <div className="fr-error" role="alert">{error}</div>}
          {message && <div className="fr-ok" role="status">{message}</div>}
        </div>
      </section>

      {domain && (
        <section className="card">
          <header className="cardhead">
            <h2>{domain.domain}</h2>
          </header>
          <div className="cardbody">
            <p className="cardlead">
              {domain.status === 'verified'
                ? t.settings.domainVerified
                : t.settings.domainPending}
            </p>
            <div className="filters">
              <button type="button" onClick={handleCheck} disabled={checking}>
                {checking ? t.settings.checkingRecords : t.settings.checkRecords}
              </button>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>{t.domains.type}</th>
                    <th>{t.domains.host}</th>
                    <th>{t.domains.expectedValue}</th>
                    <th>{t.domains.state}</th>
                  </tr>
                </thead>
                <tbody>
                  {domain.dnsRecords
                    .filter((record) => record.purpose !== 'smtp' && record.type !== 'SMTP')
                    .map((record, index) => (
                      <tr key={`${domain.id}-${index}`}>
                        <td><code>{record.type}</code></td>
                        <td>{record.name}</td>
                        <td><code>{record.value}</code></td>
                        <td className={record.status === 'valid' ? 'ok' : undefined}>
                          {statusLabel(record.status)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {domain && (
        <form className="settings-alerts" onSubmit={handleSaveFrom}>
          <section className="card">
            <header className="cardhead">
              <h2>{t.settings.platformFrom}</h2>
            </header>
            <div className="cardbody">
              <p className="cardlead">{t.settings.platformFromHint}</p>
              <div className="formgrid">
                <div className="field">
                  <label>{t.settings.fromLocalPart}</label>
                  <input
                    value={localPart}
                    onChange={(e) => setLocalPart(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="field">
                  <label>{t.settings.platformFrom}</label>
                  <input
                    value={platformFrom || `${localPart}@${domain.domain}`}
                    readOnly
                  />
                </div>
              </div>
              <button className="primary save" type="submit" disabled={savingFrom}>
                {savingFrom ? t.settings.testSending : t.settings.save}
              </button>
            </div>
          </section>
        </form>
      )}

      {!domain && (
        <p className="cardlead">{t.settings.noSystemDomain}</p>
      )}
    </>
  );
}
