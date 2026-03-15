# Git workflow institucional

## Ramas base
- `main`: produccion, solo merge desde `release/*` o hotfix aprobado.
- `develop`: integracion continua de funcionalidades.
- `staging`: rama opcional para certificacion pre-produccion.

## Ramas temporales
- `feature/<modulo>-<ticket>`: nuevas funcionalidades.
- `fix/<modulo>-<ticket>`: correcciones no urgentes.
- `hotfix/<incidente>`: correcciones urgentes desde `main`.
- `release/<version>`: estabilizacion antes de publicar.

## Reglas
- Pull request obligatorio hacia `develop` o `main`.
- CI obligatorio en verde para merge.
- 1 aprobacion minima para cambios menores; 2 para seguridad/BD.
- No hacer push directo a `main`.

## Convencion de commits
- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `chore:`
