'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OpsBrand from './ops/OpsBrand';
import OpsPrefs from './ops/OpsPrefs';
import { usePrefs } from '@/contexts/PrefsContext';

export default function LandingPage() {
  const [mode, setMode] = useState<'home' | 'login' | 'register'>('home');
  const { t } = usePrefs();

  if (mode === 'login') {
    return (
      <LoginForm
        onBack={() => setMode('home')}
        onCreate={() => setMode('register')}
      />
    );
  }
  if (mode === 'register') {
    return (
      <RegisterForm
        onBack={() => setMode('home')}
        onSignIn={() => setMode('login')}
      />
    );
  }

  return (
    <main className="landing">
      <header className="pubhead">
        <OpsBrand onClick={() => setMode('home')} />
        <nav className="pubnav" aria-label={t.landing.publicNav}>
          <button type="button" className="textlink" onClick={() => setMode('login')}>
            {t.landing.login}
          </button>
          <OpsPrefs />
          <button type="button" className="button" onClick={() => setMode('register')}>
            {t.landing.getStarted}
          </button>
        </nav>
      </header>
      <section className="hero">
        <div>
          <div className="meta">{t.landing.kicker}</div>
          <h1>
            {t.landing.headline1}
            <br />
            {t.landing.headline2}
          </h1>
          <p>{t.landing.lede}</p>
          <button type="button" className="button primary" onClick={() => setMode('register')}>
            {t.landing.createTenant}
          </button>
        </div>
        <div className="route-map">
          <h2>{t.landing.routeTitle}</h2>
          <div className="route">
            <div className="node">
              <span>{t.landing.nodeIngress}</span>
              {t.landing.routeHttps}
            </div>
            <div className="arrow">→</div>
            <div className="node">
              <span>{t.landing.nodeTenant}</span>
              {t.landing.routeTenant}
            </div>
          </div>
          <div className="route">
            <div className="node">
              <span>{t.landing.nodeIngress}</span>
              {t.landing.routeSmtp}
            </div>
            <div className="arrow">→</div>
            <div className="node">
              <span>{t.landing.nodeEgress}</span>
              {t.landing.routeEgress}
            </div>
          </div>
          <div className="signal">
            <i className="dot" aria-hidden />
            {t.landing.signal}
          </div>
        </div>
      </section>
      <section className="capabilities">
        <div className="cap">
          <strong>{t.landing.fact1Title}</strong>
          <span>{t.landing.fact1Body}</span>
        </div>
        <div className="cap">
          <strong>{t.landing.fact2Title}</strong>
          <span>{t.landing.fact2Body}</span>
        </div>
        <div className="cap">
          <strong>{t.landing.fact3Title}</strong>
          <span>{t.landing.fact3Body}</span>
        </div>
        <div className="cap">
          <strong>{t.landing.fact4Title}</strong>
          <span>{t.landing.fact4Body}</span>
        </div>
      </section>
      <footer className="foot">
        <span>{t.landing.footBrand}</span>
        <span>{t.landing.sourceCredit}</span>
      </footer>
    </main>
  );
}
