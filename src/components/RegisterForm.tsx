'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import { CURRENT_TERMS_VERSION, legalHref } from '@/lib/legal';
import OpsBrand from './ops/OpsBrand';
import OpsPrefs from './ops/OpsPrefs';

const API_EXAMPLE = `POST /emails
Authorization: Bearer op_live_••••

202 Accepted
{ "id": "msg_01J8N4…" }`;

export default function RegisterForm({
  onBack,
  onSignIn,
}: {
  onBack?: () => void;
  onSignIn?: () => void;
}) {
  const { register } = useAuth();
  const { t } = usePrefs();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError(t.register.mustAccept);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        name,
        email,
        password,
        acceptedTerms: true,
        acceptedTermsVersion: CURRENT_TERMS_VERSION,
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || t.register.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="pubhead">
        <OpsBrand onClick={onBack} />
        <nav className="pubnav" aria-label={t.register.prefsAria}>
          <OpsPrefs />
        </nav>
      </header>
      <main className="auth signin-auth">
        <form className="authform" onSubmit={handleSubmit}>
          <h1>{t.register.title}</h1>
          <p>{t.register.lead}</p>
          <div className="field">
            <label htmlFor="name">{t.register.operatorName}</label>
            <input
              id="name"
              required
              placeholder={t.register.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email">{t.register.email}</label>
            <input
              id="email"
              type="email"
              required
              placeholder={t.register.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t.register.password}</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              placeholder={t.register.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <label className="checkline checkline-legal">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              {t.register.acceptLead}{' '}
              <a
                href={legalHref('terms')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.legal.terms}
              </a>
              {', '}
              <a
                href={legalHref('privacy')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.legal.privacy}
              </a>{' '}
              {t.register.acceptAnd}{' '}
              <a
                href={legalHref('imprint')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.legal.imprint}
              </a>{' '}
              {t.register.acceptVersion(CURRENT_TERMS_VERSION)}
            </span>
          </label>
          {error && <div className="fr-error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? t.register.submitting : t.register.submit}
          </button>
          {onSignIn && (
            <button type="button" className="switchauth" onClick={onSignIn}>
              {t.register.useExisting}
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
