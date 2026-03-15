create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'institution_admin', 'event_manager', 'viewer');
create type public.pastoral_status as enum ('active', 'inactive', 'suspended');
create type public.event_status as enum ('planned', 'active', 'completed', 'cancelled');
create type public.checkin_method as enum ('manual', 'qr', 'barcode');
create type public.credential_status as enum ('active', 'revoked', 'expired');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_institution_id()
returns uuid
language sql
stable
as $$
  select nullif((auth.jwt() ->> 'institution_id'), '')::uuid;
$$;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legal_name text,
  country_code text not null default 'CL',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  full_name text not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  code text not null,
  name text not null,
  city text,
  address text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (institution_id, code)
);

create table if not exists public.pastors (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  church_id uuid not null references public.churches(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  document_number text not null,
  email text,
  phone text,
  birth_date date,
  ordination_date date,
  pastoral_status public.pastoral_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (institution_id, document_number)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.event_status not null default 'planned',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at >= starts_at)
);

create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at >= starts_at)
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  event_session_id uuid not null references public.event_sessions(id) on delete cascade,
  pastor_id uuid not null references public.pastors(id) on delete restrict,
  checkin_method public.checkin_method not null default 'manual',
  checked_in_at timestamptz not null default timezone('utc', now()),
  checked_in_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_session_id, pastor_id)
);

create table if not exists public.credential_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  name text not null,
  background_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  pastor_id uuid not null references public.pastors(id) on delete restrict,
  template_id uuid not null references public.credential_templates(id) on delete restrict,
  qr_payload text not null,
  qr_hash text generated always as (encode(digest(qr_payload, 'sha256'), 'hex')) stored,
  status public.credential_status not null default 'active',
  issued_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  report_name text not null,
  filters jsonb not null default '{}'::jsonb,
  file_url text,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_institution on public.profiles(institution_id);
create index if not exists idx_churches_institution on public.churches(institution_id);
create index if not exists idx_pastors_institution on public.pastors(institution_id);
create index if not exists idx_pastors_full_name on public.pastors(institution_id, full_name);
create index if not exists idx_events_institution on public.events(institution_id, starts_at);
create index if not exists idx_sessions_event on public.event_sessions(event_id, starts_at);
create index if not exists idx_attendance_session on public.attendance_records(event_session_id, checked_in_at);
create index if not exists idx_credentials_pastor on public.credentials(pastor_id, issued_at desc);

create trigger trg_institutions_updated_at before update on public.institutions for each row execute function public.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_churches_updated_at before update on public.churches for each row execute function public.set_updated_at();
create trigger trg_pastors_updated_at before update on public.pastors for each row execute function public.set_updated_at();
create trigger trg_events_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger trg_event_sessions_updated_at before update on public.event_sessions for each row execute function public.set_updated_at();
create trigger trg_templates_updated_at before update on public.credential_templates for each row execute function public.set_updated_at();
create trigger trg_credentials_updated_at before update on public.credentials for each row execute function public.set_updated_at();

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.churches enable row level security;
alter table public.pastors enable row level security;
alter table public.events enable row level security;
alter table public.event_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.credential_templates enable row level security;
alter table public.credentials enable row level security;
alter table public.report_exports enable row level security;

create policy "profiles_institution_scope_select"
  on public.profiles for select
  using (institution_id = public.current_institution_id());

create policy "profiles_self_update"
  on public.profiles for update
  using (id = auth.uid());

create policy "churches_institution_scope"
  on public.churches for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "pastors_institution_scope"
  on public.pastors for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "events_institution_scope"
  on public.events for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "event_sessions_institution_scope"
  on public.event_sessions for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "attendance_institution_scope"
  on public.attendance_records for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "templates_institution_scope"
  on public.credential_templates for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "credentials_institution_scope"
  on public.credentials for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create policy "exports_institution_scope"
  on public.report_exports for all
  using (institution_id = public.current_institution_id())
  with check (institution_id = public.current_institution_id());

create or replace function public.attendance_summary_by_event(p_event_id uuid)
returns table (
  session_id uuid,
  session_label text,
  starts_at timestamptz,
  attendance_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as session_id,
    s.label as session_label,
    s.starts_at,
    count(a.id) as attendance_count
  from public.event_sessions s
  left join public.attendance_records a on a.event_session_id = s.id
  where s.event_id = p_event_id
  group by s.id, s.label, s.starts_at
  order by s.starts_at asc;
$$;

revoke all on function public.attendance_summary_by_event(uuid) from public;
grant execute on function public.attendance_summary_by_event(uuid) to authenticated;
