# Changelog

RelayHorizon releases, newest first. The console version in the top bar opens this history.

The app reads `src/lib/releases.ts`. Update both files when you cut a version.

## Unreleased

BYO SES request, dual SES/SMTP DNS with platform-relay failover records, a compact public header, published legal pages, send-path caps plus suppression, sending-pool assignment, and a tenant Abuse tab.

### Added

- Tenant console **Abuse** tab shows pool, used caps, 24-hour bounce/complaint rates, suppressions, and what happens next; Sending shows a dismissible warning when one is open
- Portal Customers → Manage assigns a sending pool (probation / shared / BYO / dedicated) and billing mode (exempt / invoiced); changing the pool resets hour / day / month caps
- Hour / day / month sending caps (defaults 5,000 / 20,000 / 100,000) enforced on HTTPS and SMTP send; SES hard bounces and complaints are suppressed
- Public **Terms**, **Privacy**, and **Imprint** at `/legal` (EN/DE/HU, version `2026-09-04`); landing footer links; self-signup must accept the current version
- Tenant Sending **Request bring-your-own SES**; portal Customers → Manage **Approve / Deny** and a registry filter for requested or approved BYO
- Domains keep both SES and SMTP record sets; the unused set is dimmed; switching Sending rebuilds and re-checks the live set
- When the platform SMTP relay is enabled, SES records also authorize that host and publish RelayHorizon DKIM so failover can send without a DNS change (bounce MX stays Amazon)
- Public landing header uses icon buttons on small screens so Sign in stays visible

### Changed

- Platform SES secrets stay hidden; bring-your-own SES is sold (request + admin allow), not a self-serve toggle
- Empty tenant SMTP host uses the platform relay in SMTP DNS; RelayHorizon signs DKIM because the uplink only forwards

## 1.9.2 — 2026-09-02

List paging, tenant Danger zone, and Sending URL copy.

### Added

- Portal Customers **Manage** panel to rename or delete a tenant (the platform tenant stays)
- Tenant **Organization** Danger zone so owners can erase their organization (two-step typed-name confirmation)
- Shared pager on logs, customers, API keys, agents, and platform users, with 5 / 10 / 25 / 50 rows per page
- Domain column on the API keys table

### Changed

- Sending tab shows the Resend base URL as `https://<host>/api` and only the fields that match the chosen ingress and egress
- Domain delete sits in the domain toolbar; Hungarian create copy uses létrehozás

### Fixed

- API key delete is tenant-scoped, so any tenant member can remove a provisioned key (missing keys return 404)

## 1.9.1 — 2026-09-01

Guides, profile, OIDC, password reset, system domain, and locale-aware system mail.

### Added

- Portal Configuration → System domain attaches the web host (or another name) as the platform sending domain and locks the programmatic From to it
- Portal and tenant consoles include a Guide tab (administrator and sending walkthroughs)
- Console profile menu with optional picture upload
- Portal Configuration → OIDC for Authentik (or another OpenID Connect provider), with a JIT account-creation toggle and optional administrator group
- Configurable OIDC sign-in button label in Portal Configuration → OIDC
- Forgot-password flow on the sign-in page, with a one-hour reset link
- Portal Configuration → Basics for the platform sender address used for system mail
- Shared RelayHorizon HTML frame for platform system mail (waitlist, password reset, config test)

### Changed

- Sign-in and self-signup copy clarify the shared console login versus creating a new organization
- Waitlist, password-reset, and configuration-test mail use the recipient’s last website locale (EN, DE, or HU)

### Fixed

- Configuration Save referenced an undefined TLS field and failed from every settings section

## 1.9.0 — 2026-09-01

First changelog-backed RelayHorizon release: portal ops, Dokploy-ready Compose, and RelayHorizon slugs.

### Added

- Portal Health, Logs, Backups, Users, and Agents, plus tenant Agents
- MCP tools for platform and tenant agents (list tenants, setup customer, health, traffic)
- Compose `db-backup` sidecar, loopback host ports, and `/api/health` Postgres ping

### Changed

- Runtime pin is Node.js 24 LTS
- SMTP username, DKIM selector, and SES configuration-set fallback are now `relayhorizon` / `relayhorizon-prod`

### Fixed

- Dokploy docs match the Compose stack (`postgres`, `web`, `db-backup`)
