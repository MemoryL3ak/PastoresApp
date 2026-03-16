-- Add degree, photo and expiry fields to pastors
ALTER TABLE core.pastors
  ADD COLUMN IF NOT EXISTS degree_title TEXT,
  ADD COLUMN IF NOT EXISTS photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date  DATE;
