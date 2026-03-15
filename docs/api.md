# API base (`/v1`)

## Salud
- `GET /health`

## Pastores
- `GET /pastors?church_id=<uuid>&search=<text>`
- `POST /pastors`

## Eventos
- `GET /events`
- `POST /events`
- `POST /events/:eventId/sessions`

## Asistencia
- `POST /attendance/checkin`

## Reportes
- `GET /reports/attendance-summary?event_id=<uuid>`

## Credenciales
- `POST /credentials/issue`
- `GET /credentials?pastor_id=<uuid>`
