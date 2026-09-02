'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import { api } from '@/lib/api';
import { postAuthPath } from '@/lib/post-auth';
import OpsBrand from './ops/OpsBrand';
import OpsPrefs from './ops/OpsPrefs';

const API_EXAMPLE = `POST /emails
Authorization: Bearer op_live_••••

202 Accepted
{ "id": "msg_01J8N4…" }`;

export default function LoginForm({
  onBack,
  onCreate,
}: {
  onBack?: () => void;
  onCreate?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState(false);
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [oidcButtonLabel, setOidcButtonLabel] = useState('');
  const { login } = useAuth();
  const { t } = usePrefs();
  const router = useRouter();

  useEffect(() => {
    api.getOidcStatus()
      .then((res) => {
        setOidcEnabled(Boolean(res.data?.enabled));
        setOidcButtonLabel(
          typeof res.data?.buttonLabel === 'string' ? res.data.buttonLabel.trim() : '',
        );
      })
      .catch(() => {
        setOidcEnabled(false);
        setOidcButtonLabel('');
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRemoved(params.get('removed') === '1');
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('oidc_error');
    if (!code) return;
    const messages: Record<string, string> = {
      denied: t.login.oidcDenied,
      not_provisioned: t.login.oidcNotProvisioned,
      unavailable: t.login.oidcUnavailable,
      failed: t.login.oidcFailed,
    };
    setError(messages[code] || t.login.oidcFailed);
  }, [t.login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      router.replace(postAuthPath(user));
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || t.login.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="pubhead">
        <OpsBrand onClick={onBack} />
        <nav className="pubnav" aria-label={t.login.prefsAria}>
          <OpsPrefs />
        </nav>
      </header>
      <main className="auth signin-auth">
        <form className="authform" onSubmit={handleSubmit}>
          <h1>{t.login.title}</h1>
          <p>{t.login.lead}</p>
          {removed && <div className="key">{t.login.tenantRemoved}</div>}
          <div className="field">
            <label htmlFor="email">{t.login.email}</label>
            <input
              id="email"
              type="email"
              required
              placeholder={t.login.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t.login.password}</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? t.login.hidePassword : t.login.showPassword}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="square"
                    aria-hidden
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
                    <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.3 3.9" />
                    <path d="M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7a11 11 0 0 0 4.4-.9" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="square"
                    aria-hidden
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="fr-error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? t.login.submitting : t.login.submit}
          </button>
          {oidcEnabled && (
            <a className="button" href="/api/auth/oidc/start">
              {oidcButtonLabel || t.login.continueOidc}
            </a>
          )}
          <button
            type="button"
            className="switchauth"
            onClick={() => router.push('/login/forgot')}
          >
            {t.login.forgotPassword}
          </button>
          {onCreate && (
            <button type="button" className="switchauth" onClick={onCreate}>
              {t.login.createAccount}
            </button>
          )}
        </form>
        <aside className="authaside" aria-label={t.login.apiExampleAria}>
          <pre>{API_EXAMPLE}</pre>
        </aside>
      </main>
    </>
  );
}
