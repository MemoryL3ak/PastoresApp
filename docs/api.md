# API base (`/v1`)

## Salud
- `GET /health`

## Dashboard
- `GET /dashboard/summary`

## Pastores
- `GET /pastors?church_id=<uuid>&search=<text>`
- `POST /pastors`
- `PATCH /pastors/:id`

## Eventos
- `GET /events`
- `POST /events`
- `PATCH /events/:eventId`
- `POST /events/:eventId/sessions`
- `GET /events/:eventId/sessions`

## Iglesias
- `GET /churches`
- `POST /churches`
- `PATCH /churches/:id`

## Asistencia
- `GET /attendance?event_session_id=<uuid>`
- `POST /attendance/checkin`

## Reportes
- `GET /reports/attendance-summary?event_id=<uuid>`

## Credenciales
- `POST /credentials/issue`
- `GET /credentials?pastor_id=<uuid>`

## Usuarios y roles
- `GET /users`
- `POST /users`
- `PATCH /users/:id`
