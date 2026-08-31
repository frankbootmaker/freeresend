'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrefs } from '@/contexts/PrefsContext';
import { api } from '@/lib/api';
import OpsBrand from '@/components/ops/OpsBrand';
import OpsPrefs from '@/components/ops/OpsPrefs';

function ResetPasswordForm() {
  const { t } = usePrefs();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const displayError = error || (!token ? t.login.resetMissing : '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError(t.login.resetMissing);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t.login.resetInvalid);
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
          <h1>{t.login.resetTitle}</h1>
          <p>{t.login.resetLead}</p>
          <div className="field">
            <label htmlFor="reset-password">{t.login.password}</label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={8}
              placeholder={t.login.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={done || !token}
            />
          </div>
          {displayError && <div className="fr-error">{displayError}</div>}
          {done && <div className="fr-ok" role="status">{t.login.resetDone}</div>}
          {!done && token && (
            <button className="primary" type="submit" disabled={loading}>
              {loading ? t.login.resetSubmitting : t.login.resetSubmit}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
