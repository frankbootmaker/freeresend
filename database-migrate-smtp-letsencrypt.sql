ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_source TEXT DEFAULT 'letsencrypt',
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_domain TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_account_key TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_renew_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_status TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_error TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_tls_status_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_http_token TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_http_key_auth TEXT;
