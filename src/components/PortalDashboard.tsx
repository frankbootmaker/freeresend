'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefs } from '@/contexts/PrefsContext';
import CustomersTab from './CustomersTab';
import PlatformUsersTab from './PlatformUsersTab';
import AgentsTab from './AgentsTab';
import PlatformHealthTab from './PlatformHealthTab';
import PlatformLogsTab from './PlatformLogsTab';
import PlatformBackupsTab from './PlatformBackupsTab';
import PlatformSettingsTab, {
  type SettingsSection,
} from './PlatformSettingsTab';
import GuideTab from './GuideTab';
import AppShell, { type ShellNavItem } from './AppShell';

type Tab =
  | 'health'
  | 'logs'
  | 'customers'
  | 'users'
  | 'agents'
  | 'backups'
  | 'settings'
  | 'guide';

const SETTINGS_SECTIONS: SettingsSection[] = [
  'ses',
  'smtp',
  'ingress',
  'alerts',
  'oidc',
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
    { id: 'settings-oidc', label: t.settings.oidcTitle },
    { id: 'settings-test', label: t.settings.testTitle },
  ];

  const tabLabels: Record<Exclude<Tab, 'settings'>, string> = {
    health: t.nav.health,
    logs: t.nav.logs,
    customers: t.nav.customers,
    users: t.nav.users,
    agents: t.nav.agents,
    backups: t.nav.backups,
    guide: t.nav.guide,
  };

  const items: ShellNavItem[] = [
    { id: 'health', label: tabLabels.health },
    { id: 'logs', label: tabLabels.logs },
    { id: 'customers', label: tabLabels.customers },
    { id: 'users', label: tabLabels.users },
    { id: 'agents', label: tabLabels.agents },
    { id: 'backups', label: tabLabels.backups },
    {
      id: 'settings',
      label: t.nav.settings,
      children: settingsChildren,
    },
    { id: 'guide', label: tabLabels.guide },
  ];

  const activeId = activeTab === 'settings'
    ? `settings-${settingsSection}`
    : activeTab;

  const title = activeTab === 'settings'
    ? settingsChildren.find((item) => item.id === activeId)?.label
      || t.nav.settings
    : tabLabels[activeTab];

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
    if (
      id === 'health'
      || id === 'logs'
      || id === 'customers'
      || id === 'users'
      || id === 'agents'
      || id === 'backups'
      || id === 'guide'
    ) {
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
      {activeTab === 'logs' && <PlatformLogsTab />}
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'users' && <PlatformUsersTab />}
      {activeTab === 'agents' && <AgentsTab kind="platform" />}
      {activeTab === 'backups' && <PlatformBackupsTab />}
      {activeTab === 'settings' && (
        <PlatformSettingsTab section={settingsSection} />
      )}
      {activeTab === 'guide' && <GuideTab kind="admin" />}
    </AppShell>
  );
}
