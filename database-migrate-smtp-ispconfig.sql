ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS smtp_ingress_ispconfig_url TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_ispconfig_user TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_ispconfig_password TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_ispconfig_insecure BOOLEAN NOT NULL DEFAULT FALSE;
