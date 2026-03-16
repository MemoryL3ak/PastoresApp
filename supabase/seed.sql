insert into core.institutions (id, name, legal_name, country_code)
values
  ('11111111-1111-1111-1111-111111111111', 'Institucion Demo', 'Institucion Eclesiastica Demo', 'CL')
on conflict (id) do nothing;

insert into core.churches (id, code, name, city)
values
  ('22222222-2222-2222-2222-222222222221', 'CENTRAL', 'Iglesia Central', 'Santiago'),
  ('22222222-2222-2222-2222-222222222222', 'NORTE', 'Iglesia Norte', 'Santiago'),
  ('22222222-2222-2222-2222-222222222223', 'SUR', 'Iglesia Sur', 'Concepcion')
on conflict (id) do nothing;

insert into core.pastors (id, church_id, first_name, last_name, document_number, email, phone, pastoral_status)
values
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 'Carlos', 'Perez', '12.345.678-9', 'carlos.perez@demo.cl', '+56911111111', 'active'),
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 'Ramon', 'Arriagada', '13.456.789-0', 'ramon.arriagada@demo.cl', '+56922222222', 'active'),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222223', 'Juan', 'Diaz', '14.567.890-1', 'juan.diaz@demo.cl', '+56933333333', 'active'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222221', 'Ana', 'Lopez', '15.678.901-2', 'ana.lopez@demo.cl', '+56944444444', 'inactive'),
  ('44444444-4444-4444-4444-444444444445', '22222222-2222-2222-2222-222222222222', 'Meda', 'Zehata', '16.789.012-3', 'meda.zehata@demo.cl', '+56955555555', 'active')
on conflict (id) do nothing;

insert into events.events (id, title, description, location, starts_at, ends_at, status)
values
  ('55555555-5555-5555-5555-555555555551', 'Conferencia Internacional de Pastores', 'Encuentro anual ministerial', 'Santiago Centro', now() - interval '1 day', now() + interval '2 days', 'active'),
  ('55555555-5555-5555-5555-555555555552', 'Seminario Liderazgo Pastoral', 'Formacion para lideres regionales', 'Concepcion', now() + interval '15 days', now() + interval '16 days', 'planned')
on conflict (id) do nothing;

insert into events.event_sessions (id, event_id, label, starts_at, ends_at)
values
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'Sesion AM', now() - interval '1 day', now() - interval '1 day' + interval '3 hours'),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', 'Sesion PM', now() - interval '3 hours', now() - interval '1 hour'),
  ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555552', 'Sesion Unica', now() + interval '15 days', now() + interval '15 days' + interval '4 hours')
on conflict (id) do nothing;

insert into events.attendance_records (id, event_session_id, pastor_id, checkin_method, checked_in_at)
values
  ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444441', 'manual', now() - interval '22 hours'),
  ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666661', '44444444-4444-4444-4444-444444444442', 'manual', now() - interval '21 hours'),
  ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444441', 'qr', now() - interval '2 hours'),
  ('77777777-7777-7777-7777-777777777774', '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444443', 'manual', now() - interval '90 minutes'),
  ('77777777-7777-7777-7777-777777777775', '66666666-6666-6666-6666-666666666662', '44444444-4444-4444-4444-444444444445', 'barcode', now() - interval '45 minutes')
on conflict (id) do nothing;

insert into credentials.credential_templates (id, name, is_default)
values
  ('33333333-3333-3333-3333-333333333331', 'Credencial Base 2026', true),
  ('33333333-3333-3333-3333-333333333332', 'Credencial Eventos', false)
on conflict (id) do nothing;

insert into credentials.credentials (id, pastor_id, template_id, qr_payload, status, issued_at)
values
  ('88888888-8888-8888-8888-888888888881', '44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'PASTOR:44444444-4444-4444-4444-444444444441', 'active', now() - interval '30 days'),
  ('88888888-8888-8888-8888-888888888882', '44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'PASTOR:44444444-4444-4444-4444-444444444442', 'active', now() - interval '20 days'),
  ('88888888-8888-8888-8888-888888888883', '44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333332', 'PASTOR:44444444-4444-4444-4444-444444444443', 'active', now() - interval '10 days')
on conflict (id) do nothing;
