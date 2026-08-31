'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import CustomersTab from './CustomersTab';
import PlatformHealthTab from './PlatformHealthTab';
import PlatformSettingsTab, {
  type SettingsSection,
} from './PlatformSettingsTab';
import AppShell, { type ShellNavItem } from './AppShell';

type Tab = 'health' | 'customers' | 'settings';

const SETTINGS_SECTIONS: SettingsSection[] = [
  'ses',
  'smtp',
  'ingress',
  'alerts',
  'test',
];

function isSettingsSection(value: string): value is SettingsSection {
  return SETTINGS_SECTIONS.includes(value as SettingsSection);
}

export default function PortalDashboard() {
  const router = useRouter();
  const { tenant, logout } = useAuth();
  const { t } = usePrefs();
  const [activeTab, setActiveTab] = useState<Tab>('customers');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('ses');
  const tenantLabel = tenant?.name
    ? t.nav.backToTenant(tenant.name)
    : t.nav.backToConsole;

  const settingsChildren: ShellNavItem[] = [
    { id: 'settings-ses', label: t.settings.sesTitle },
    { id: 'settings-smtp', label: t.settings.smtpTitle },
    { id: 'settings-ingress', label: t.settings.ingressTitle },
    { id: 'settings-alerts', label: t.settings.alertTitle },
    { id: 'settings-test', label: t.settings.testTitle },
  ];

  const items: ShellNavItem[] = [
    { id: 'health', label: t.nav.health },
    { id: 'customers', label: t.nav.customers },
    {
      id: 'settings',
      label: t.nav.settings,
      children: settingsChildren,
    },
  ];

  const activeId = activeTab === 'settings'
    ? `settings-${settingsSection}`
    : activeTab;

  const title = activeTab === 'settings'
    ? settingsChildren.find((item) => item.id === activeId)?.label
      || t.nav.settings
    : activeTab === 'health'
      ? t.nav.health
      : t.nav.customers;

  const select = (id: string) => {
    if (id === 'settings') {
      setActiveTab('settings');
      return;
    }
    if (id.startsWith('settings-')) {
      const section = id.slice('settings-'.length);
      if (isSettingsSection(section)) {
        setActiveTab('settings');
        setSettingsSection(section);
      }
      return;
    }
    if (id === 'health' || id === 'customers') {
      setActiveTab(id);
    }
  };

  return (
    <AppShell
      portal
      crumb={t.nav.platformCrumb}
      title={title}
      items={items}
      activeId={activeId}
      onSelect={select}
      tenantLabel={tenantLabel}
      onTenantSwitch={() => router.push('/')}
      onSignOut={logout}
    >
      {activeTab === 'health' && <PlatformHealthTab />}
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'settings' && (
        <PlatformSettingsTab section={settingsSection} />
      )}
    </AppShell>
  );
}
