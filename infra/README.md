# Infraestructura

Esta carpeta queda preparada para IaC y despliegues.

## Recomendacion de stack
- IaC: Terraform
- Runtime backend: contenedor en Fly.io / Render / ECS Fargate
- Frontend: Vercel / Netlify
- Base de datos y auth: Supabase
- Observabilidad: Sentry + logs estructurados

## Estructura sugerida
- `infra/terraform/modules/*`
- `infra/terraform/envs/dev`
- `infra/terraform/envs/staging`
- `infra/terraform/envs/prod`
