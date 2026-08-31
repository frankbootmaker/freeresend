# Changelog

RelayHorizon releases, newest first. The console version in the top bar opens this history.

The app reads `src/lib/releases.ts`. Update both files when you cut a version.

## Unreleased

- Portal and tenant consoles include a Guide tab (administrator and sending walkthroughs).
- Console profile menu with optional picture upload.

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
