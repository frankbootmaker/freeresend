-- Optional display name already exists. Avatar is a small data-URL image.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar TEXT;
