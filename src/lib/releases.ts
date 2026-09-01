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
      'Work on main since 1.9.0: guides, profile, OIDC (custom button label), password reset, and branded system mail.',
    changes: [
      {
        kind: 'added',
        text: 'Portal Configuration → System domain attaches the web host (or another name) as the platform sending domain and locks the programmatic From to it.',
      },
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
        kind: 'added',
        text: 'Configurable OIDC sign-in button label in Portal Configuration → OIDC.',
      },
      {
        kind: 'added',
        text: 'Forgot-password flow on the sign-in page, with a one-hour reset link.',
      },
      {
        kind: 'added',
        text: 'Portal Configuration → Basics for the platform sender address used for system mail.',
      },
      {
        kind: 'added',
        text: 'Shared RelayHorizon HTML frame for platform system mail (waitlist, password reset, config test).',
      },
      {
        kind: 'changed',
        text: 'Waitlist, password-reset, and configuration-test mail use the recipient’s last website locale (EN, DE, or HU).',
      },
      {
        kind: 'changed',
        text: 'Sign-in and self-signup copy clarify the shared console login versus creating a new organization.',
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
