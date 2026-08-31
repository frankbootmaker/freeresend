ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_challenge TEXT DEFAULT 'dns-manual',
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_dns_name TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_dns_value TEXT,
  ADD COLUMN IF NOT EXISTS smtp_ingress_acme_order TEXT;
