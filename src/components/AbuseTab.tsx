'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePrefs } from '@/contexts/PrefsContext';
import type { AbuseSeverity, AbuseWarningCode, TenantAbuseSnapshot } from '@/lib/abuse-health';

function severityClass(severity: AbuseSeverity): string {
  if (severity === 'high') return 'is-down';
  if (severity === 'warn') return 'is-warn';
  return 'is-off';
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export default function AbuseTab() {
  const { t } = usePrefs();
  const [snapshot, setSnapshot] = useState<TenantAbuseSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getTenantAbuse();
      setSnapshot(res.data as TenantAbuseSnapshot);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.abuse.failed);
    } finally {
      setLoading(false);
    }
  }, [t.abuse.failed]);

  useEffect(() => {
    load();
  }, [load]);

  const poolLabel = (tier: string) => {
    if (tier === 'shared') return t.customers.tierShared;
    if (tier === 'byo') return t.customers.tierByo;
    if (tier === 'dedicated') return t.customers.tierDedicated;
    return t.customers.tierProbation;
  };

  const billingLabel = (mode: string) => (
    mode === 'invoiced' ? t.customers.billingInvoiced : t.customers.billingExempt
  );

  const statusLabel = (status: string) => {
    if (status === 'suspended') return t.abuse.statusSuspended;
    if (status === 'pending_verification') return t.abuse.statusPending;
    return t.abuse.statusActive;
  };

  if (loading) {
    return <div className="muted">{t.sending.loading}</div>;
  }

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.abuse.title}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.abuse.lead}</p>
          {error && <div className="fr-error" role="alert">{error}</div>}
          {snapshot && (
            <div className="formgrid">
              <div className="field">
                <label>{t.customers.sendingTier}</label>
                <div>{poolLabel(snapshot.sendingTier)}</div>
              </div>
              <div className="field">
                <label>{t.customers.billingMode}</label>
                <div>{billingLabel(snapshot.billingMode)}</div>
              </div>
              <div className="field">
                <label>{t.abuse.status}</label>
                <div>
                  {statusLabel(snapshot.status)}
                  {snapshot.sendingFrozenAt ? ` · ${t.abuse.statusFrozen}` : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {snapshot && (
        <>
          <section className="card">
            <header className="cardhead">
              <h2>{t.sending.capsTitle}</h2>
            </header>
            <div className="cardbody">
              <p className="cardlead" data-testid="abuse-caps">
                {t.sending.capsLine(
                  snapshot.used.hour,
                  snapshot.caps.hourly,
                  snapshot.used.day,
                  snapshot.caps.daily,
                  snapshot.used.month,
                  snapshot.caps.monthly,
                )}
              </p>
            </div>
          </section>

          <section className="card">
            <header className="cardhead">
              <h2>{t.abuse.last24hTitle}</h2>
            </header>
            <div className="cardbody">
              <p className="cardlead" data-testid="abuse-24h">
                {t.abuse.last24hLine(
                  snapshot.last24h.total,
                  snapshot.last24h.bounced,
                  formatRate(snapshot.last24h.bounceRate),
                  snapshot.last24h.complained,
                  formatRate(snapshot.last24h.complaintRate),
                )}
              </p>
              <p className="muted">{t.abuse.last24hHint}</p>
            </div>
          </section>

          <section className="card">
            <header className="cardhead">
              <h2>{t.abuse.suppressionsTitle}</h2>
            </header>
            <div className="cardbody">
              <p className="cardlead" data-testid="abuse-suppressions">
                {t.abuse.suppressionsLine(snapshot.suppressionCount)}
              </p>
              <p className="muted">{t.abuse.suppressionsHint}</p>
            </div>
          </section>

          <section className="card">
            <header className="cardhead">
              <h2>{t.abuse.warningsTitle}</h2>
            </header>
            <div className="cardbody">
              {snapshot.warnings.length === 0 ? (
                <p className="cardlead">{t.abuse.noWarnings}</p>
              ) : (
                <ul className="warnlist" data-testid="abuse-warnings">
                  {snapshot.warnings.map((warning) => (
                    <li key={warning.code}>
                      <span className={`health-pill ${severityClass(warning.severity)}`}>
                        {t.abuse.severityLabel(warning.severity)}
                      </span>
                      {' '}
                      <strong>{t.abuse.warningTitle(warning.code as AbuseWarningCode)}</strong>
                      {' '}
                      {t.abuse.warningBody(warning.code as AbuseWarningCode)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card">
            <header className="cardhead">
              <h2>{t.abuse.nextTitle}</h2>
            </header>
            <div className="cardbody">
              <p className="cardlead">{t.abuse.nextLead}</p>
              <ul className="warnlist">
                <li>{t.abuse.nextCaps}</li>
                <li>{t.abuse.nextSuppress}</li>
                <li>{t.abuse.nextOperator}</li>
                <li>{t.abuse.nextBreaker}</li>
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
