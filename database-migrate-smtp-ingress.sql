ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS smtp_listen_ports TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_mode TEXT DEFAULT 'off',
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_cert TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_key TEXT;
