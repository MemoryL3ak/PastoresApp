# Arquitectura de referencia

## Objetivo
Plataforma institucional para gestion pastoral con enfoque multi-tenant (por institucion), auditoria y seguridad por defecto.

## Estructura
- `apps/frontend`: interfaz React (Vite) para operacion administrativa.
- `apps/backend`: API REST en Fastify + TypeScript.
- `supabase/migrations`: esquema SQL versionado.
- `supabase/seed.sql`: datos iniciales no sensibles.
- `infra`: carpeta reservada para IaC (Terraform/Pulumi) y despliegues.

## Principios
- Multi-tenant por `institution_id` en todas las entidades de negocio.
- Row Level Security habilitado en todas las tablas de dominio.
- Backend sin acceso directo desde cliente al `service_role`.
- IDs UUID y timestamps UTC.
- Auditoria mediante eventos exportables y control de estados.

## Dominio cubierto
- Pastores y su adscripcion a iglesias.
- Eventos y sesiones.
- Registro de asistencia por sesion.
- Credenciales y templates.
- Reportes de asistencia por evento.
