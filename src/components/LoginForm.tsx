'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = usePrefs();
  const router = useRouter();

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
            <input
              id="password"
              type="password"
              required
              placeholder={t.login.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="fr-error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? t.login.submitting : t.login.submit}
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
