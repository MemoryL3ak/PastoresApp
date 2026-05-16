-- Add 'fallecido' and 'descontinuado' to pastoral_status enum.
-- Used by the pastors bulk import to preserve historical state from the legacy CSV.
-- Note: ALTER TYPE ADD VALUE must be in its own transaction before usage,
-- so this migration must run before any INSERT/UPDATE that references the new values.

alter type public.pastoral_status add value if not exists 'fallecido';
alter type public.pastoral_status add value if not exists 'descontinuado';
