'use client';

import { type ReactNode, useState } from 'react';
import { usePrefs } from '@/contexts/PrefsContext';
import OpsBrand from './ops/OpsBrand';
import OpsPrefs from './ops/OpsPrefs';

export type ShellNavItem = {
  id: string;
  label: string;
};

export default function AppShell({
  portal,
  crumb,
  title,
  items,
  activeId,
  onSelect,
  tenantLabel,
  onTenantSwitch,
  onPortalSwitch,
  onSignOut,
  children,
}: {
  portal?: boolean;
  crumb: string;
  title: string;
  items: ShellNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  tenantLabel?: string;
  onTenantSwitch?: () => void;
  onPortalSwitch?: () => void;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const { t } = usePrefs();
  const [drawer, setDrawer] = useState(false);

  return (
    <main className="app" data-drawer-open={drawer ? 'true' : 'false'}>
      <aside className="rail">
        <OpsBrand />
        <nav aria-label={portal ? t.nav.portalNav : t.nav.tenantConsole}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeId === item.id ? 'on' : undefined}
              aria-current={activeId === item.id ? 'page' : undefined}
              onClick={() => {
                onSelect(item.id);
                setDrawer(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="railfoot">
          {tenantLabel && onTenantSwitch && (
            <button type="button" className="button tenantbtn" onClick={onTenantSwitch}>
              {tenantLabel}
            </button>
          )}
          {onPortalSwitch && (
            <button type="button" className="button tenantbtn" onClick={onPortalSwitch}>
              {portal ? `← ${t.nav.sending}` : `${t.nav.portal} →`}
            </button>
          )}
          <button type="button" className="gallery-link" onClick={onSignOut}>
            {t.nav.signOut}
          </button>
        </div>
      </aside>
      <header className="topbar">
        <button
          type="button"
          className="mobile"
          aria-label={t.nav.openMenu}
          onClick={() => setDrawer(true)}
        >
          {t.nav.menu}
        </button>
        <span className="crumb">
          {t.nav.crumbPrefix} <b>{crumb.toUpperCase()}</b>
        </span>
        <span className="right">v1.8.2</span>
      </header>
      <div className="subhead">
        <h1>{title}</h1>
        <div className="tools">
          <OpsPrefs />
        </div>
      </div>
      {drawer && (
        <nav className="drawer open" aria-label={t.nav.tabs}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id);
                setDrawer(false);
              }}
            >
              {item.label}
            </button>
          ))}
          {onPortalSwitch && (
            <button type="button" onClick={onPortalSwitch}>
              {portal ? t.nav.sending : t.nav.portal}
            </button>
          )}
        </nav>
      )}
      <div className="main">{children}</div>
    </main>
  );
}
