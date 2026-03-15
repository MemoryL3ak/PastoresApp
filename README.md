# Plataforma Pastoral Institucional

Base profesional para evolucionar el mockup a una plataforma productiva para gestion pastoral:
- Gestion de informacion pastoral
- Eventos y sesiones
- Control de asistencia
- Reportes
- Credenciales

## Estructura
- `apps/frontend`: React (Vite) con UI actual del mockup.
- `apps/backend`: API Fastify + TypeScript + Supabase.
- `supabase/migrations`: esquema SQL versionado con RLS.
- `docs`: arquitectura, flujo Git y setup operativo.

## Inicio rapido
```bash
npm install
npm run dev:backend
npm run dev:frontend
```

## Base de datos
Aplicar en Supabase:
1. `supabase/migrations/202603150001_initial_schema.sql`
2. `supabase/seed.sql` (solo pruebas)

## Calidad
```bash
npm run lint
npm run typecheck
npm run build
```

## Documentacion clave
- `docs/architecture.md`
- `docs/git-workflow.md`
- `docs/setup.md`
- `docs/api.md`
