'use client';

import { type ReactNode, useState } from 'react';
import { usePrefs } from '@/contexts/PrefsContext';
import { displayVersion } from '@/lib/releases';
import OpsBrand from './ops/OpsBrand';
import OpsPrefs from './ops/OpsPrefs';
import ProfileMenu from './ops/ProfileMenu';
import ReleaseNotes from './ReleaseNotes';

export type ShellNavItem = {
  id: string;
  label: string;
  children?: ShellNavItem[];
};

function itemIsActive(item: ShellNavItem, activeId: string): boolean {
  return activeId === item.id
    || Boolean(item.children?.some((child) => child.id === activeId));
}

function itemIsExpanded(item: ShellNavItem, activeId: string): boolean {
  return Boolean(item.children?.length) && itemIsActive(item, activeId);
}

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
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <main className="app" data-drawer-open={drawer ? 'true' : 'false'}>
      <aside className="rail">
        <OpsBrand />
        <nav aria-label={portal ? t.nav.portalNav : t.nav.tenantConsole}>
          {items.map((item) => (
            <NavButtons
              key={item.id}
              item={item}
              activeId={activeId}
              onSelect={(id) => {
                onSelect(id);
                setDrawer(false);
              }}
            />
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
        <button
          type="button"
          className="ver"
          onClick={() => setNotesOpen(true)}
          aria-label={t.changelog.openNotes}
        >
          {displayVersion()}
        </button>
      </header>
      <div className="subhead">
        <h1>{title}</h1>
        <div className="tools">
          <OpsPrefs />
          <ProfileMenu onSignOut={onSignOut} />
        </div>
      </div>
      {drawer && (
        <nav className="drawer open" aria-label={t.nav.tabs}>
          {items.map((item) => (
            <NavButtons
              key={item.id}
              item={item}
              activeId={activeId}
              onSelect={(id) => {
                onSelect(id);
                setDrawer(false);
              }}
            />
          ))}
          {onPortalSwitch && (
            <button type="button" onClick={onPortalSwitch}>
              {portal ? t.nav.sending : t.nav.portal}
            </button>
          )}
        </nav>
      )}
      <div className="main">{children}</div>
      {notesOpen ? <ReleaseNotes onClose={() => setNotesOpen(false)} /> : null}
    </main>
  );
}

function NavButtons({
  item,
  activeId,
  onSelect,
}: {
  item: ShellNavItem;
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const expanded = itemIsExpanded(item, activeId);
  const parentActive = itemIsActive(item, activeId);
  const childActive = item.children?.some((child) => child.id === activeId);
  const firstChild = item.children?.[0];

  return (
    <div className={expanded ? 'navgroup open' : 'navgroup'}>
      <button
        type="button"
        className={parentActive && !childActive ? 'on' : undefined}
        aria-current={activeId === item.id ? 'page' : undefined}
        aria-expanded={item.children ? expanded : undefined}
        onClick={() => onSelect(firstChild && !expanded ? firstChild.id : item.id)}
      >
        {item.label}
      </button>
      {expanded && item.children?.map((child) => (
        <button
          key={child.id}
          type="button"
          className={activeId === child.id ? 'on navsub' : 'navsub'}
          aria-current={activeId === child.id ? 'page' : undefined}
          onClick={() => onSelect(child.id)}
        >
          {child.label}
        </button>
      ))}
    </div>
  );
}
