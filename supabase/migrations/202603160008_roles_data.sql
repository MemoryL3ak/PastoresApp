-- Add assigned_country column
alter table core.profiles add column if not exists assigned_country text;

-- Migrate existing roles to new simplified set
update core.profiles set role = 'admin'  where role in ('super_admin', 'institution_admin');
update core.profiles set role = 'viewer' where role = 'event_manager';
