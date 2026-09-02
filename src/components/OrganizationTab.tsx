'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';

export default function OrganizationTab() {
  const router = useRouter();
  const { t } = usePrefs();
  const { user, tenant, logout } = useAuth();
  const [step, setStep] = useState<'warn' | 'confirm'>('warn');
  const [confirmName, setConfirmName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tenantName = tenant?.name || t.nav.tenantFallback;
  const isPlatform = tenant?.slug === 'platform';
  const canDelete = Boolean(
    !isPlatform
    && (user?.isPlatformAdmin || user?.membershipRole === 'owner'),
  );
  const nameMatches = confirmName.trim() === tenantName;

  const resetConfirm = () => {
    setStep('warn');
    setConfirmName('');
    setAcknowledged(false);
    setError('');
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    if (!canDelete || !nameMatches || !acknowledged) return;
    setError('');
    setBusy(true);
    try {
      await api.deleteCurrentTenant(confirmName);
      logout();
      router.replace('/login?removed=1');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.organization.failed);
      setBusy(false);
    }
  };

  return (
    <div className="cols">
      <section className="card">
        <header className="cardhead">
          <h2>{t.organization.aboutTitle}</h2>
        </header>
        <div className="cardbody">
          <p className="cardlead">{t.organization.lead}</p>
          <div className="formgrid">
            <div className="field">
              <label>{t.organization.name}</label>
              <div>{tenantName}</div>
              <p className="muted">{t.organization.nameHint}</p>
            </div>
            <div className="field">
              <label>{t.organization.slug}</label>
              <div>{tenant?.slug || '—'}</div>
              <p className="muted">{t.organization.slugHint}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="card danger-zone">
        <header className="cardhead">
          <h2>{t.organization.dangerTitle}</h2>
        </header>
        <div className="cardbody">
          {isPlatform ? (
            <p className="muted">{t.organization.platformProtected}</p>
          ) : !canDelete ? (
            <p className="muted">{t.organization.ownerOnly}</p>
          ) : step === 'warn' ? (
            <>
              <p className="cardlead">{t.organization.dangerLead}</p>
              <ul className="warnlist">
                <li>{t.organization.warnDomains}</li>
                <li>{t.organization.warnKeys}</li>
                <li>{t.organization.warnLogs}</li>
                <li>{t.organization.warnAccounts}</li>
              </ul>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setError('');
                  setStep('confirm');
                }}
              >
                {t.organization.continue}
              </button>
            </>
          ) : (
            <form onSubmit={remove}>
              <p className="cardlead">{t.organization.confirmLead(tenantName)}</p>
              <div className="field">
                <label htmlFor="confirm-org-name">
                  {t.organization.confirmName}
                </label>
                <input
                  id="confirm-org-name"
                  required
                  autoComplete="off"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={tenantName}
                />
              </div>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>{t.organization.acknowledge}</span>
              </label>
              {error && <div className="fr-error" role="alert">{error}</div>}
              <div className="inline-actions">
                <button
                  type="submit"
                  className="danger"
                  disabled={busy || !nameMatches || !acknowledged}
                >
                  {busy ? t.organization.deleting : t.organization.delete}
                </button>
                <button type="button" onClick={resetConfirm}>
                  {t.organization.back}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
