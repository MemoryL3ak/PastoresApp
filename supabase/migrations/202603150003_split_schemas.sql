create schema if not exists core;
create schema if not exists events;
create schema if not exists credentials;
create schema if not exists reporting;

alter table if exists public.institutions set schema core;
alter table if exists public.profiles set schema core;
alter table if exists public.churches set schema core;
alter table if exists public.pastors set schema core;

alter table if exists public.events set schema events;
alter table if exists public.event_sessions set schema events;
alter table if exists public.attendance_records set schema events;

alter table if exists public.credential_templates set schema credentials;
alter table if exists public.credentials set schema credentials;

alter table if exists public.report_exports set schema reporting;

create or replace function public.attendance_summary_by_event(p_event_id uuid)
returns table (
  session_id uuid,
  session_label text,
  starts_at timestamptz,
  attendance_count bigint
)
language sql
security definer
set search_path = public, events
as $$
  select
    s.id as session_id,
    s.label as session_label,
    s.starts_at,
    count(a.id) as attendance_count
  from events.event_sessions s
  left join events.attendance_records a on a.event_session_id = s.id
  where s.event_id = p_event_id
  group by s.id, s.label, s.starts_at
  order by s.starts_at asc;
$$;

grant usage on schema core to authenticated, service_role;
grant usage on schema events to authenticated, service_role;
grant usage on schema credentials to authenticated, service_role;
grant usage on schema reporting to authenticated, service_role;

grant all on all tables in schema core to service_role;
grant all on all tables in schema events to service_role;
grant all on all tables in schema credentials to service_role;
grant all on all tables in schema reporting to service_role;
