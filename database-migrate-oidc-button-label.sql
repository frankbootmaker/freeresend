-- Optional label for the console OIDC sign-in button.
ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS oidc_button_label TEXT;
