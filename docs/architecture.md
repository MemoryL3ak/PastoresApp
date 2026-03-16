# Arquitectura de referencia

## Objetivo
Plataforma institucional para gestion pastoral con enfoque multi-tenant (por institucion), auditoria y seguridad por defecto.

## Estructura
- `apps/frontend`: interfaz React (Vite) para operacion administrativa.
- `apps/backend`: API REST en Fastify + TypeScript.
- `supabase/migrations`: esquema SQL versionado.
- `supabase/seed.sql`: datos iniciales no sensibles.
- `infra`: carpeta reservada para IaC (Terraform/Pulumi) y despliegues.

## Schemas de BD
- `core`: perfiles, iglesias, pastores, institucion.
- `events`: eventos, sesiones, asistencia.
- `credentials`: plantillas y credenciales.
- `reporting`: exportaciones y analitica.

## Principios
- Diseno simplificado para operacion de una sola institucion.
- Row Level Security opcional segun estrategia de acceso.
- Backend sin acceso directo desde cliente al `service_role`.
- IDs UUID y timestamps UTC.
- Auditoria mediante eventos exportables y control de estados.

## Dominio cubierto
- Pastores y su adscripcion a iglesias.
- Eventos y sesiones.
- Registro de asistencia por sesion.
- Credenciales y templates.
- Reportes de asistencia por evento.
