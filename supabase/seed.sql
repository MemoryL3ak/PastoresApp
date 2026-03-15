insert into public.institutions (id, name, legal_name, country_code)
values
  ('11111111-1111-1111-1111-111111111111', 'Institucion Demo', 'Institucion Eclesiastica Demo', 'CL')
on conflict (id) do nothing;

insert into public.churches (id, institution_id, code, name, city)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'CENTRAL', 'Iglesia Central', 'Santiago'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'NORTE', 'Iglesia Norte', 'Santiago')
on conflict (id) do nothing;

insert into public.credential_templates (id, institution_id, name, is_default)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Credencial Base 2026', true)
on conflict (id) do nothing;
