'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { usePrefs } from '@/contexts/PrefsContext';
import { api } from '@/lib/api';
import OpsBrand from '@/components/ops/OpsBrand';
import OpsPrefs from '@/components/ops/OpsPrefs';

export default function ForgotPasswordPage() {
  const { t } = usePrefs();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.login.forgotFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="pubhead">
        <OpsBrand onClick={() => router.push('/login')} />
        <nav className="pubnav" aria-label={t.login.prefsAria}>
          <OpsPrefs />
        </nav>
      </header>
      <main className="auth signin-auth">
        <form className="authform" onSubmit={handleSubmit}>
          <h1>{t.login.forgotTitle}</h1>
          <p>{t.login.forgotLead}</p>
          <div className="field">
            <label htmlFor="forgot-email">{t.login.email}</label>
            <input
              id="forgot-email"
              type="email"
              required
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={sent}
            />
          </div>
          {error && <div className="fr-error">{error}</div>}
          {sent && <div className="fr-ok" role="status">{t.login.forgotSent}</div>}
          {!sent && (
            <button className="primary" type="submit" disabled={loading}>
              {loading ? t.login.forgotSubmitting : t.login.forgotSubmit}
            </button>
          )}
          <button
            type="button"
            className="switchauth"
            onClick={() => router.push('/login')}
          >
            {t.login.backToSignIn}
          </button>
        </form>
      </main>
    </>
  );
}
