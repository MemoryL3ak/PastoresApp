# Setup local

## 1) Requisitos
- Node.js 20+
- npm 10+
- Supabase CLI (opcional para flujo local de migraciones)

## 2) Instalar dependencias
```bash
npm install
```

## 3) Variables de entorno
- Copiar `.env.example` en raiz a `.env`.
- Copiar `apps/backend/.env.example` a `apps/backend/.env`.
- Copiar `apps/frontend/.env.example` a `apps/frontend/.env`.

## 4) Ejecutar servicios
```bash
npm run dev:backend
npm run dev:frontend
```

## 5) Aplicar esquema en Supabase
En SQL Editor de Supabase:
1. Ejecutar `supabase/migrations/202603150001_initial_schema.sql`.
2. Ejecutar `supabase/migrations/202603150002_single_institution_simplification.sql`.
3. Ejecutar `supabase/migrations/202603150003_split_schemas.sql`.
4. Ejecutar `supabase/seed.sql` (entorno de pruebas).

En Supabase Dashboard -> Project Settings -> API -> Exposed schemas:
- agregar `core`
- agregar `events`
- agregar `credentials`
- agregar `reporting`

## 6) Validaciones
```bash
npm run lint
npm run typecheck
npm run build
```
