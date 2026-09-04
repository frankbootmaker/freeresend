export const APP_VERSION = '1.9.2';

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
    date: '2026-09-04',
    summary:
      'BYO SES request, dual SES/SMTP DNS with platform-relay failover records, a compact public header, published legal pages, and send-path caps plus suppression.',
    changes: [
      {
        kind: 'added',
        text: 'Hour, day, and month sending caps (defaults 5,000 / 20,000 / 100,000) enforced on HTTPS and SMTP send; SES hard bounces and complaints are suppressed.',
      },
      {
        kind: 'added',
        text: 'Public Terms, Privacy, and Imprint at /legal (EN/DE/HU, version 2026-09-04); landing footer links; self-signup must accept the current version.',
      },
      {
        kind: 'added',
        text: 'Tenant Sending Request bring-your-own SES; portal Customers Manage Approve / Deny and a registry filter for requested or approved BYO.',
      },
      {
        kind: 'added',
        text: 'Domains keep both SES and SMTP record sets; the unused set is dimmed; switching Sending rebuilds and re-checks the live set.',
      },
      {
        kind: 'added',
        text: 'When the platform SMTP relay is enabled, SES records also authorize that host and publish RelayHorizon DKIM so failover can send without a DNS change (bounce MX stays Amazon).',
      },
      {
        kind: 'added',
        text: 'Public landing header uses icon buttons on small screens so Sign in stays visible.',
      },
      {
        kind: 'changed',
        text: 'Platform SES secrets stay hidden; bring-your-own SES is sold (request + admin allow), not a self-serve toggle.',
      },
      {
        kind: 'changed',
        text: 'Empty tenant SMTP host uses the platform relay in SMTP DNS; RelayHorizon signs DKIM because the uplink only forwards.',
      },
    ],
  },
  {
    version: '1.9.2',
    date: '2026-09-02',
    summary: 'List paging, tenant Danger zone, and Sending URL copy.',
    changes: [
      {
        kind: 'added',
        text: 'Portal Customers Manage panel to rename or delete a tenant (the platform tenant stays).',
      },
      {
        kind: 'added',
        text: 'Tenant Organization Danger zone so owners can erase their organization (two-step typed-name confirmation).',
      },
      {
        kind: 'added',
        text: 'Shared pager on logs, customers, API keys, agents, and platform users, with 5 / 10 / 25 / 50 rows per page.',
      },
      {
        kind: 'added',
        text: 'Domain column on the API keys table.',
      },
      {
        kind: 'changed',
        text: 'Sending tab shows the Resend base URL as https://<host>/api and only the fields that match the chosen ingress and egress.',
      },
      {
        kind: 'changed',
        text: 'Domain delete sits in the domain toolbar; Hungarian create copy uses létrehozás.',
      },
      {
        kind: 'fixed',
        text: 'API key delete is tenant-scoped, so any tenant member can remove a provisioned key (missing keys return 404).',
      },
    ],
  },
  {
    version: '1.9.1',
    date: '2026-09-01',
    summary:
      'Guides, profile, OIDC, password reset, system domain, and locale-aware system mail.',
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
