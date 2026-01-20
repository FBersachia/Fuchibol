# documentacion_tecnica

## Arquitectura
- Frontend: React.
- Backend: Node.js + Express.
- ORM: Sequelize.
- Base de datos: PostgreSQL.

## Modulos previstos
- Auth: login, roles (admin/usuario).
- Jugadores: CRUD, elo, genero, rol arquero, historial.
- Partidos/Fechas: CRUD, equipos, resultados, MVP, distinciones.
- Equipos: generacion por algoritmo (Elo + social + genero + arquero).
- Recalculo: actualizacion historica de Elo al editar resultados.

## Modelo de datos
- users: id, name, email, password_hash, role (admin/user), created_at.
- players: id, name, gender (h/m), elo, initial_elo, is_goalkeeper, wins, losses, created_at.
- matches: id, match_date, status, notes, created_at.
- teams: id, match_id, name, created_at.
- team_players: id, team_id, player_id.
- match_results: id, match_id, winning_team_id (nullable), is_draw, goal_diff, mvp_player_id (nullable).
- distinctions: id, match_id, player_id, type, notes.
- elo_history: id, match_id, player_id, elo_before, elo_after, delta.
- app_config: id, w_elo, w_genero, w_social, gender_tolerance, win_delta, draw_delta, loss_delta, use_social_default.

## Algoritmo
- Entrada: lista de jugadores disponibles, elo, genero, rol arquero, historial ultimo 12 meses.
- Objetivo: minimizar diferencia de elo total y maximizar diversidad social.
- Restricciones: tamanos iguales, paridad de genero (tolerancia 1), arquero si hay dos.
- Salida: dos equipos balanceados.

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

## Integraciones
- CSV de referencia para validacion: Habilidad y Historial.

## Migraciones
- Usar Sequelize CLI: `npm run migrate` en `backend`.
- Seeders: `npm run seed` crea admin y config base.
- Admin seed: `admin@local.com` / `adminpass`.

## Quick Start (backend)
1) `cd C:\Users\fbersachia\Documents\Dev\Fuchibol\backend`
2) `npm install`
3) `npm run migrate`
4) `npm run seed`
5) `npm start`

## API
### Auth
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/change-password

## Seguridad
- JWT en header Authorization: Bearer <token>.
- Passwords hasheados con bcrypt.

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

## Contratos
### POST /auth/login
Request:
{
  "email": "user@domain.com",
  "password": "string"
}
Response:
{
  "token": "jwt",
  "user": { "id": 1, "name": "Admin", "role": "admin" }
}

### GET /auth/me
Response:
{
  "id": 1,
  "name": "Admin",
  "email": "admin@local.com",
  "role": "admin"
}

### POST /auth/change-password
Request:
{
  "current_password": "old",
  "new_password": "new"
}
Response:
{
  "ok": true
}

### POST /users/:id/reset-password
Request:
{
  "new_password": "new"
}
Response:
{
  "ok": true
}

### POST /players
Request:
{
  "name": "Jugador",
  "gender": "h",
  "elo": 1200,
  "initial_elo": 1200,
  "is_goalkeeper": false
}
Response:
{
  "id": 10,
  "name": "Jugador",
  "gender": "h",
  "elo": 1200,
  "is_goalkeeper": false
}

### POST /matches
Request:
{
  "match_date": "2026-06-10",
  "notes": "texto opcional"
}
Response:
{
  "id": 15,
  "match_date": "2026-06-10",
  "status": "pending"
}

### POST /matches/:id/generate-teams
Request:
{
  "player_ids": [1, 2, 3, 4, 5, 6],
  "use_social": true,
  "weights": { "w_elo": 1.0, "w_genero": 5.0, "w_social": 0.5 }
}
Response:
{
  "match_id": 15,
  "teamA": { "id": 22, "players": [{ "id": 1, "name": "A", "elo": 1200 }] },
  "teamB": { "id": 23, "players": [{ "id": 2, "name": "B", "elo": 1190 }] },
  "meta": { "used_strict_gender": true, "diff_elo": 0.1, "diff_gender": 0, "social_score": 2 }
}

### GET /matches/:id
Response:
{
  "id": 15,
  "match_date": "2026-06-10",
  "status": "pending",
  "Teams": [],
  "MatchResult": null,
  "Distinctions": []
}

### GET /matches/:id/result
Response:
{
  "match_id": 15,
  "result": { "winning_team_id": 22, "is_draw": false, "goal_diff": 2 },
  "distinctions": []
}

### GET /players/:id/elo-history
Response:
{
  "player_id": 1,
  "current_elo": 1210,
  "history": []
}

### GET /players/:id/stats
Response:
{
  "player_id": 1,
  "elo": 1210,
  "wins": 3,
  "losses": 2,
  "matches_played": 5,
  "mvp_count": 1,
  "distinctions": { "mvp": 1 }
}

### GET /players/:id/matches
Response:
{
  "player_id": 1,
  "matches": []
}

### GET /matches/summary
Response:
{
  "filters": { "since_months": 12 },
  "total_matches": 10,
  "completed_matches": 7,
  "pending_matches": 3,
  "total_players": 20,
  "total_results": 7
}

### GET /social-pairs
Response:
{
  "since_months": 12,
  "pairs": [{ "player_a": 1, "player_b": 2, "times": 3 }]
}

### GET /ranking
Response:
{
  "limit": 20,
  "ranking": [
    { "id": 1, "name": "Jugador", "elo": 1200, "wins": 2, "losses": 1, "distinctions": { "mvp": 1 } }
  ]
}

### GET /config
Response:
{
  "id": 1,
  "w_elo": 1.0,
  "w_genero": 5.0,
  "w_social": 0.5,
  "gender_tolerance": 1,
  "win_delta": 1,
  "draw_delta": 0,
  "loss_delta": -1,
  "use_social_default": true
}

### PUT /config
Request:
{
  "w_elo": 1.2,
  "w_genero": 6,
  "gender_tolerance": 1,
  "win_delta": 2,
  "loss_delta": -2,
  "use_social_default": false
}

### GET /config/history
Response:
{
  "limit": 50,
  "history": [
    { "id": 1, "config_id": 1, "changed_by": 1, "changes": { "w_elo": { "from": 1.0, "to": 1.2 } } }
  ]
}

### GET /export
Response:
CSV con secciones: [players], [matches], [results], [elo_history]

### POST /teams
Request:
{
  "match_id": 15,
  "name": "Equipo A",
  "players": [1, 2, 3, 4, 5]
}
Response:
{
  "id": 22,
  "match_id": 15,
  "name": "Equipo A"
}

### POST /matches/:id/result
Request:
{
  "winning_team_id": 22,
  "is_draw": false,
  "goal_diff": 2,
  "mvp_player_id": 3,
  "distinctions": [
    { "player_id": 3, "type": "mvp", "notes": "" }
  ]
}
Response:
{
  "match_id": 15,
  "status": "completed"
}

## Errores y respuestas
- 400 Bad Request: validacion de datos (ej. jugadores duplicados).
- 401 Unauthorized: token invalido o expirado.
- 403 Forbidden: rol insuficiente.
- 404 Not Found: recurso inexistente.
- 409 Conflict: estado invalido (ej. resultado duplicado).
- 500 Internal Server Error: error inesperado.

## Validaciones
- Jugadores: name obligatorio, gender en {h,m}, elo >= 0, initial_elo >= 0 (default = elo), is_goalkeeper boolean.
- Matches: match_date obligatorio, equipos con tamanos iguales, sin jugadores duplicados.
- Teams: match_id obligatorio, lista de jugadores par y sin repetidos.
- Results: winning_team_id xor is_draw, goal_diff >= 0, mvp_player_id opcional.

## Esquema DB
- users: id PK, name varchar(120), email varchar(120) unique, password_hash varchar(255), role enum('admin','user'), created_at, updated_at.
- players: id PK, name varchar(120), gender enum('h','m'), elo int, initial_elo int, is_goalkeeper boolean, wins int, losses int, created_at, updated_at.
- matches: id PK, match_date date, status enum('pending','completed'), notes text, created_at, updated_at.
- teams: id PK, match_id FK->matches.id, name varchar(120), created_at, updated_at.
- team_players: id PK, team_id FK->teams.id, player_id FK->players.id, unique(team_id, player_id).
- match_results: id PK, match_id FK->matches.id unique, winning_team_id FK->teams.id nullable, is_draw boolean, goal_diff int, mvp_player_id FK->players.id nullable, created_at, updated_at.
- distinctions: id PK, match_id FK->matches.id, player_id FK->players.id, type varchar(50), notes text, created_at, updated_at.
- elo_history: id PK, match_id FK->matches.id, player_id FK->players.id, elo_before int, elo_after int, delta int, created_at.
