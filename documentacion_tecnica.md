# documentacion_tecnica

## Arquitectura
- Frontend: React.
- Backend: Node.js + Express.
- ORM: Sequelize.
- Base de datos: PostgreSQL.

## Modulos previstos
- Auth: login, roles (admin/user).
- Grupos: creacion, miembros, roles, baja logica.
- Invitaciones: links generales y especificos por jugador.
- Jugadores: CRUD, elo, genero, rol arquero, historial, baja logica.
- Partidos/Fechas: CRUD, equipos, resultados, MVP, distinciones.
- Equipos: generacion por algoritmo (Elo + social + genero + arquero).
- Canchas: CRUD por grupo.
- Recalculo: actualizacion historica de Elo al editar resultados y al eliminar partidos.

## Contexto de grupos
- Todas las entidades de negocio son por grupo (group_id).
- Header requerido para endpoints con scope de grupo: X-Group-Id: <int>.
- Excepciones sin X-Group-Id: /health, /auth/*, /groups (GET/POST), /invites/:slug/:token/join.
- Roles globales: users.role (admin/user). Roles por grupo: group_members.role (admin/member).

## Modelo de datos (resumen)
- groups: id, name, slug, deleted_at, created_at, updated_at.
- group_members: id, group_id, user_id, role (admin/member), deleted_at, created_at, updated_at.
- group_invites: id, group_id, player_id, created_by, token, type (general/specific), expires_at, max_uses, used_count, revoked_at.
- users: id, name, email, password_hash, role (admin/user), gender (h/m), created_at, updated_at.
- players: id, name, gender (h/m), elo, initial_elo, is_goalkeeper, wins, losses, group_id, user_id, deleted_at.
- matches: id, match_date, status, notes, group_id.
- teams: id, match_id, name, group_id.
- team_players: id, team_id, player_id, group_id.
- match_results: id, match_id, winning_team_id, is_draw, goal_diff, mvp_player_id, group_id.
- distinctions: id, match_id, player_id, type, notes, group_id.
- elo_history: id, match_id, player_id, elo_before, elo_after, delta, group_id.
- app_config: id, group_id, w_elo, w_genero, w_social, gender_tolerance, win_delta, draw_delta, loss_delta, use_social_default.
- config_history: id, config_id, group_id, changed_by, changes.
- courts: id, name, address, group_id.

## Algoritmo
- Entrada: jugadores disponibles del grupo, elo, genero, rol arquero, historial ultimo 12 meses.
- Filtra players con deleted_at = null.
- Usa config del grupo (app_config) para pesos y tolerancias.

## Algoritmo (propuesta)
1) Filtrar jugadores disponibles y validar cantidad par (equipos iguales).
2) Identificar arqueros: si hay 2+, preasignar 1 por equipo (los de Elo mas cercano).
3) Generar combinaciones candidatas (heuristica greedy o busqueda limitada) para repartir el resto.
4) Score de cada reparto:
   - diff_elo = abs(sum_elo_A - sum_elo_B) / n
   - diff_genero = abs(mujeres_A - mujeres_B)
   - social = suma de pares repetidos en el mismo equipo en ultimos 12 meses
   - score = w_elo * diff_elo + w_genero * diff_genero + w_social * social
5) Elegir reparto con menor score; si empate, priorizar menor social, luego menor diff_elo.

## Pesos sugeridos (editables)
- w_elo: 1.0
- w_genero: 5.0 (para reforzar paridad)
- w_social: 0.5
- win_delta: 100
- draw_delta: 0
- loss_delta: -100

## Integraciones
- CSV de referencia para validacion: Habilidad y Historial.

## Migraciones
- Usar Sequelize CLI: `npm run migrate` en `backend`.
- Seeders: `npm run seed` crea admin, config base y membership en grupo default.
- Admin seed: `admin@local.com` / `adminpass`.
- Grupo default: `Fuchibol oculto` (slug: `fuchiboloculto`).

## Quick Start (backend)
1) `cd D:\Dev\Fuchibol\backend`
2) `npm install`
3) `npm run migrate`
4) `npm run seed`
5) `npm start`

## API
### Headers
- Authorization: Bearer <token>
- X-Group-Id: <int> requerido para endpoints con scope de grupo

### Health
- GET /health

### Auth
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/change-password

### Groups
- GET /groups
- POST /groups
- PATCH /groups/:id (admin)
- DELETE /groups/:id (admin)
- GET /groups/members
- POST /groups/leave
- POST /groups/transfer-admin

### Invites
- POST /invites/general (admin)
- POST /invites/specific (admin)
- POST /invites/:slug/:token/join

### Users
- GET /users (admin)
- POST /users (admin)
- PATCH /users/:id (admin)
- DELETE /users/:id (admin)
- POST /users/:id/reset-password (admin)

### Players
- GET /players
- POST /players (admin)
- PATCH /players/:id (admin)
- DELETE /players/:id (admin)
- GET /players/:id/elo-history
- GET /players/:id/stats
- GET /players/:id/matches

### Matches
- GET /matches
- GET /matches/:id
- POST /matches (admin)
- PATCH /matches/:id (admin)
- DELETE /matches/:id (admin)
- POST /matches/:id/generate-teams (admin)
- POST /matches/played (admin)
- GET /matches/summary

### Teams
- GET /teams?match_id= (admin)
- POST /teams (admin)
- PATCH /teams/:id (admin)
- DELETE /teams/:id (admin)

### Results
- POST /matches/:id/result (admin)
- PATCH /matches/:id/result (admin)
- GET /matches/:id/result

### Social
- GET /social-pairs?since_months=12

### Ranking
- GET /ranking?limit=20

### Config
- GET /config
- PUT /config (admin)
- GET /config/history?limit=50 (admin)

### Export
- GET /export?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

### Courts
- GET /courts
- POST /courts (admin)
- PATCH /courts/:id (admin)
- DELETE /courts/:id (admin)

## Contratos
### POST /auth/login
Request:
```
{
  "email": "user@domain.com",
  "password": "string"
}
```
Response:
```
{
  "token": "jwt",
  "user": { "id": 1, "name": "Admin", "role": "admin" }
}
```

### GET /groups
Response:
```
{
  "groups": [
    { "id": 1, "name": "Fuchibol oculto", "slug": "fuchiboloculto", "role": "admin" }
  ]
}
```

### POST /groups
Request:
```
{
  "name": "Nombre del grupo",
  "slug": "grupo123"
}
```
Response:
```
{ "id": 2, "name": "Nombre del grupo", "slug": "grupo123" }
```

### POST /groups/transfer-admin
Request:
```
{ "user_id": 10 }
```
Response:
```
{ "ok": true }
```

### POST /invites/general
Response:
```
{
  "id": 1,
  "token": "hex",
  "expires_at": "2026-01-25T15:00:00.000Z",
  "max_uses": 30,
  "used_count": 0,
  "url": "/invites/fuchiboloculto/<token>/join"
}
```

### POST /invites/specific
Request:
```
{ "player_id": 12, "regenerate": false }
```
Response:
```
{
  "id": 2,
  "token": "hex",
  "expires_at": "2026-01-25T15:00:00.000Z",
  "max_uses": 1,
  "used_count": 0,
  "url": "/invites/fuchiboloculto/<token>/join"
}
```

### POST /invites/:slug/:token/join
Request:
```
{
  "email": "user@domain.com",
  "password": "string",
  "nickname": "Jugador",
  "gender": "h",
  "elo": 500
}
```
Response:
```
{
  "group_id": 1,
  "player_id": 10,
  "user_id": 3
}
```

### POST /players
Request:
```
{
  "name": "Jugador",
  "gender": "h",
  "elo": 600,
  "initial_elo": 600,
  "is_goalkeeper": false,
  "user_id": null
}
```
Response:
```
{
  "id": 10,
  "name": "Jugador",
  "gender": "h",
  "elo": 600,
  "initial_elo": 600,
  "is_goalkeeper": false,
  "group_id": 1
}
```

### POST /matches/:id/generate-teams
Request:
```
{
  "player_ids": [1, 2, 3, 4, 5, 6],
  "use_social": true,
  "weights": { "w_elo": 1.0, "w_genero": 5.0, "w_social": 0.5 }
}
```
Response:
```
{
  "match_id": 15,
  "teamA": { "id": 22, "players": [{ "id": 1, "name": "A", "elo": 1200 }] },
  "teamB": { "id": 23, "players": [{ "id": 2, "name": "B", "elo": 1190 }] },
  "meta": { "used_strict_gender": true, "diff_elo": 0.1, "diff_gender": 0, "social_score": 2 }
}
```

### POST /matches/played
Request:
```
{
  "match_date": "YYYY-MM-DD",
  "court_id": 1,
  "team_a_player_ids": [1, 2, 3, 4, 5],
  "team_b_player_ids": [6, 7, 8, 9, 10],
  "winning_team": "A"
}
```
Response:
```
{
  "match_id": 15,
  "team_a_id": 21,
  "team_b_id": 22,
  "status": "completed"
}
```

## Errores y respuestas
- 400 Bad Request: validacion de datos, slug invalido, limites de grupo.
- 401 Unauthorized: token invalido o expirado.
- 403 Forbidden: rol insuficiente o no pertenece al grupo.
- 404 Not Found: recurso inexistente o grupo no encontrado.
- 409 Conflict: nickname/slug duplicado, jugador ya vinculado.
- 410 Gone: invitacion expirada.
- 500 Internal Server Error: error inesperado.

## Validaciones
- Groups: slug obligatorio, lowercase, [a-z0-9], max 40, no reserved; un usuario solo puede ser admin de un grupo.
- Group members: un usuario no puede tener mas de un miembro activo por grupo.
- Invites: general max_uses=30, specific max_uses=1, expiracion 4h.
- Jugadores: name obligatorio, gender en {h,m}, elo entre 300 y 1000, initial_elo entre 300 y 1000.
- Jugadores por grupo: max 30 activos, nickname unico por grupo (solo activos).
- Matches: match_date obligatorio, equipos con tamanos iguales, sin jugadores duplicados.
- Results: winning_team_id xor is_draw, goal_diff >= 0, mvp_player_id opcional.

## Esquema DB
- groups: id PK, name varchar(120), slug varchar(40) unique, deleted_at, created_at, updated_at.
- group_members: id PK, group_id FK->groups.id, user_id FK->users.id, role enum('admin','member'), deleted_at, created_at, updated_at.
- group_invites: id PK, group_id FK->groups.id, player_id FK->players.id null, created_by FK->users.id null, token varchar(120) unique, type enum('general','specific'), expires_at, max_uses, used_count, revoked_at.
- users: id PK, name varchar(120), email varchar(120) unique, password_hash varchar(255), role enum('admin','user'), gender enum('h','m'), created_at, updated_at.
- players: id PK, name varchar(120), gender enum('h','m'), elo int, initial_elo int, is_goalkeeper boolean, wins int, losses int, group_id FK->groups.id, user_id FK->users.id null, deleted_at.
- matches: id PK, match_date date, status enum('pending','completed'), notes text, group_id FK->groups.id.
- teams: id PK, match_id FK->matches.id, name varchar(120), group_id FK->groups.id.
- team_players: id PK, team_id FK->teams.id, player_id FK->players.id, group_id FK->groups.id, unique(team_id, player_id).
- match_results: id PK, match_id FK->matches.id unique, winning_team_id FK->teams.id null, is_draw boolean, goal_diff int, mvp_player_id FK->players.id null, group_id FK->groups.id.
- distinctions: id PK, match_id FK->matches.id, player_id FK->players.id, type varchar(50), notes text, group_id FK->groups.id.
- elo_history: id PK, match_id FK->matches.id, player_id FK->players.id, elo_before int, elo_after int, delta int, group_id FK->groups.id.
- app_config: id PK, group_id FK->groups.id unique, w_elo float, w_genero float, w_social float, gender_tolerance int, win_delta int, draw_delta int, loss_delta int, use_social_default boolean.
- config_history: id PK, config_id FK->app_config.id, group_id FK->groups.id, changed_by FK->users.id, changes jsonb.
- courts: id PK, name varchar(120), address varchar(255), group_id FK->groups.id.
