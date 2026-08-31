-- Platform log retention + S3 offsite settings, and email_logs search indexes.

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS log_retention_days INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS log_strip_body_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS log_last_rotate_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS log_last_purged INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS log_last_stripped INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS backup_s3_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS backup_s3_endpoint TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_region TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_bucket TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_prefix TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_access_key_id TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_secret_access_key TEXT,
  ADD COLUMN IF NOT EXISTS backup_s3_force_path_style BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_email_logs_created
  ON email_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_created
  ON email_logs (tenant_id, created_at DESC);
