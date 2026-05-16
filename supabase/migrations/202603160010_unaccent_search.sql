-- Enable accent-insensitive search for churches.name and pastors.full_name.
--
-- Strategy:
--   1. Enable the unaccent extension.
--   2. Wrap unaccent() in an IMMUTABLE function so it can be used in
--      STORED generated columns (the extension's function is marked STABLE).
--   3. Add generated columns that store lower+unaccented versions of the
--      searchable text. PostgREST/Supabase can then filter via .ilike() on
--      these columns directly.
--   4. Add trigram indexes so ilike '%query%' is fast even with thousands of rows.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- IMMUTABLE wrapper so the function can be referenced from generated columns.
-- Pinning the dictionary ('public.unaccent') makes the result deterministic.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

-- ── core.churches.name_unaccent ─────────────────────────────────────
ALTER TABLE core.churches
  ADD COLUMN IF NOT EXISTS name_unaccent TEXT
  GENERATED ALWAYS AS (lower(public.immutable_unaccent(name))) STORED;

CREATE INDEX IF NOT EXISTS idx_churches_name_unaccent_trgm
  ON core.churches USING gin (name_unaccent gin_trgm_ops);

-- ── core.pastors.full_name_unaccent ─────────────────────────────────
-- full_name itself is a generated column (trim(first_name || ' ' || last_name)),
-- and Postgres forbids generated columns referencing other generated columns.
-- So we recompute from the base columns directly.
ALTER TABLE core.pastors
  ADD COLUMN IF NOT EXISTS full_name_unaccent TEXT
  GENERATED ALWAYS AS (
    lower(public.immutable_unaccent(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_pastors_full_name_unaccent_trgm
  ON core.pastors USING gin (full_name_unaccent gin_trgm_ops);
