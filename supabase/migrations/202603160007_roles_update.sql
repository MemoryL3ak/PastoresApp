-- Add new role values (must be in its own transaction before usage)
alter type public.app_role add value if not exists 'admin';
alter type public.app_role add value if not exists 'country_assigned';
