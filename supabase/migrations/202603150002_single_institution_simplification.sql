drop policy if exists "profiles_institution_scope_select" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "churches_institution_scope" on public.churches;
drop policy if exists "pastors_institution_scope" on public.pastors;
drop policy if exists "events_institution_scope" on public.events;
drop policy if exists "event_sessions_institution_scope" on public.event_sessions;
drop policy if exists "attendance_institution_scope" on public.attendance_records;
drop policy if exists "templates_institution_scope" on public.credential_templates;
drop policy if exists "credentials_institution_scope" on public.credentials;
drop policy if exists "exports_institution_scope" on public.report_exports;

alter table public.institutions disable row level security;
alter table public.profiles disable row level security;
alter table public.churches disable row level security;
alter table public.pastors disable row level security;
alter table public.events disable row level security;
alter table public.event_sessions disable row level security;
alter table public.attendance_records disable row level security;
alter table public.credential_templates disable row level security;
alter table public.credentials disable row level security;
alter table public.report_exports disable row level security;

drop index if exists idx_profiles_institution;
drop index if exists idx_churches_institution;
drop index if exists idx_pastors_institution;
drop index if exists idx_pastors_full_name;
drop index if exists idx_events_institution;

alter table public.profiles drop column if exists institution_id;
alter table public.churches drop column if exists institution_id;
alter table public.pastors drop column if exists institution_id;
alter table public.events drop column if exists institution_id;
alter table public.event_sessions drop column if exists institution_id;
alter table public.attendance_records drop column if exists institution_id;
alter table public.credential_templates drop column if exists institution_id;
alter table public.credentials drop column if exists institution_id;
alter table public.report_exports drop column if exists institution_id;

alter table public.churches drop constraint if exists churches_institution_id_code_key;
alter table public.pastors drop constraint if exists pastors_institution_id_document_number_key;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'churches_code_key'
  ) then
    alter table public.churches add constraint churches_code_key unique (code);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pastors_document_number_key'
  ) then
    alter table public.pastors add constraint pastors_document_number_key unique (document_number);
  end if;
end
$$;

create index if not exists idx_pastors_full_name on public.pastors(full_name);
create index if not exists idx_events_starts_at on public.events(starts_at);

drop function if exists public.current_institution_id();
