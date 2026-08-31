export const APP_VERSION = '1.9.0';

export type ReleaseChangeKind = 'added' | 'changed' | 'fixed';

export type ReleaseChange = {
  kind: ReleaseChangeKind;
  text: string;
};

export type Release = {
  version: string;
  date: string;
  summary: string;
  changes: ReleaseChange[];
};

export const UNRELEASED_VERSION = 'unreleased';

/** Newest first. Keep CHANGELOG.md in sync when you add a row. */
export const RELEASES: Release[] = [
  {
    version: UNRELEASED_VERSION,
    date: '2026-09-01',
    summary:
      'Work on main since 1.9.0: Guide tabs, profile pictures, and Authentik/OIDC sign-in.',
    changes: [
      {
        kind: 'added',
        text: 'Portal and tenant consoles include a Guide tab (administrator and sending walkthroughs).',
      },
      {
        kind: 'added',
        text: 'Console profile menu with optional picture upload.',
      },
      {
        kind: 'added',
        text: 'Portal Configuration → OIDC for Authentik (or another OpenID Connect provider), with a JIT account-creation toggle and optional administrator group.',
      },
      {
        kind: 'fixed',
        text: 'Configuration Save referenced an undefined TLS field and failed from every settings section.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-09-01',
    summary:
      'First changelog-backed RelayHorizon release: portal ops, Dokploy-ready Compose, and RelayHorizon slugs.',
    changes: [
      {
        kind: 'added',
        text: 'Portal Health, Logs, Backups, Users, and Agents, plus tenant Agents.',
      },
      {
        kind: 'added',
        text: 'MCP tools for platform and tenant agents (list tenants, setup customer, health, traffic).',
      },
      {
        kind: 'added',
        text: 'Compose db-backup sidecar, loopback host ports, and /api/health Postgres ping.',
      },
      {
        kind: 'changed',
        text: 'Runtime pin is Node.js 24 LTS.',
      },
      {
        kind: 'changed',
        text: 'SMTP username, DKIM selector, and SES configuration-set fallback are now relayhorizon / relayhorizon-prod.',
      },
      {
        kind: 'fixed',
        text: 'Dokploy docs match the Compose stack (postgres, web, db-backup).',
      },
    ],
  },
];

export function displayVersion(version = APP_VERSION): string {
  return `v${version}`;
}
