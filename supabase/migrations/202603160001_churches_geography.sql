-- Add geography fields to churches and make code auto-generated

ALTER TABLE core.churches
  ADD COLUMN IF NOT EXISTS country  TEXT,
  ADD COLUMN IF NOT EXISTS region   TEXT,
  ADD COLUMN IF NOT EXISTS commune  TEXT;

-- Make code optional (auto-generated in app layer)
ALTER TABLE core.churches
  ALTER COLUMN code DROP NOT NULL;

-- Auto-generate code from name if not provided
CREATE OR REPLACE FUNCTION core.generate_church_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := upper(substring(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '', 'g'), 1, 6))
                || '_' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_church_code ON core.churches;
CREATE TRIGGER trg_church_code
  BEFORE INSERT ON core.churches
  FOR EACH ROW EXECUTE FUNCTION core.generate_church_code();
