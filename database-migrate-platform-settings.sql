-- Apply to existing OutPost databases created before platform settings.

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  ses_region TEXT,
  ses_access_key_id TEXT,
  ses_secret_access_key TEXT,
  ses_configuration_set TEXT,
  smtp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure BOOLEAN NOT NULL DEFAULT TRUE,
  smtp_username TEXT,
  smtp_password TEXT,
  alert_email TEXT,
  alert_from TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
