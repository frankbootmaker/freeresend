-- Authentik / generic OpenID Connect for console sign-in.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS oidc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS oidc_issuer TEXT,
  ADD COLUMN IF NOT EXISTS oidc_client_id TEXT,
  ADD COLUMN IF NOT EXISTS oidc_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS oidc_jit_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS oidc_admin_group TEXT;
