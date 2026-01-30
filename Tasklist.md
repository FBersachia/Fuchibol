# Tasklist (Epic Format)

## Epica: Base y diseno
- [x] Definir modelo de datos (Sequelize) (borrador en documentacion_tecnica.md)
- [x] Disenar algoritmo de emparejamiento (Elo + social) (propuesta en documentacion_tecnica.md)

## Epica: Autenticacion y roles
- [x] Implementar autenticacion y roles (P1)
- [ ] Flujo post-registro: elegir unirse a grupo o crear grupo (P1)
- [ ] Registro: validar password minimo 8 caracteres (P1)
- [ ] Unirse por link reusable desde pantalla inicial (P1)
- [ ] Crear grupo desde pantalla inicial y asignar admin (P1)
- [ ] Permitir multiples grupos por usuario (P1)

## Epica: Grupos y membresias
- [x] Definir modelos y relaciones: groups, group_members, group_invites (general y especifico)
- [x] Migraciones: crear tablas de grupos/membresias/invitaciones
- [x] Migraciones: agregar group_id a players, matches, teams, team_players, match_results, distinctions, elo_history, app_config
- [x] Migraciones: agregar soft delete (deleted_at o is_deleted) para grupos, jugadores, membresias
- [x] Migracion de datos actuales al grupo "fuchibol oculto" + config inicial por grupo
- [x] Validaciones: slug unico (lowercase, alfanumerico, max 40, palabras prohibidas)
- [x] Validaciones: nickname unico por grupo (y obligatorio)
- [x] Limite de 30 jugadores activos por grupo (bloquear alta/unirse)
- [x] Middleware: validar X-Group-Id y pertenencia del usuario al grupo
- [x] Scoping: filtrar todas las consultas por group_id (players, matches, teams, results, ranking, config, export, social)
- [x] Endpoints grupos: listar del usuario, crear (solo si no admin de otro), editar, borrar logico
- [x] Endpoints membresias: listar miembros, salir de grupo (soft delete), transferir admin
- [x] Endpoints invitaciones: generar link general, generar link especifico por jugador, regenerar link (invalida anterior)
- [x] Flujo join por link: crear cuenta si no existe, crear jugador con nickname/genero/elo inicial
- [x] Flujo link especifico: vincular usuario a jugador existente (restaurar si estaba soft delete)
- [x] Persistencia de ultimo grupo activo en frontend (localStorage)
- [x] Ajustar config para que sea por grupo (CRUD y seeders)
- [x] Ajustar recalcAllElo para operar por grupo

## Epica: Jugadores
- [x] Implementar CRUD jugadores (P1)

## Epica: Partidos y equipos
- [x] Implementar CRUD fechas/partidos (P1)
- [x] Implementar CRUD equipos (P1)
- [x] Implementar carga de resultados y distinciones (P1)
- [x] Implementar recalculo de Elo (P1)
- [ ] Implementar carga manual de partido jugado con empate, diferencia de gol, MVP/distinciones y notas (P1)
- [ ] Validaciones en partido jugado: tamanos permitidos 5v5, 6v6, 7v7 (P1)

## Epica: UI
- [x] UI: selector de grupos (cards) + guardar ultimo grupo (P1)
- [ ] UI: tutorial en inicio debajo del selector (P1)
- [x] UI: crear/editar grupo (admin) (P1)
- [x] UI: pagina de inicio con tutorial detallado y accesos a secciones (P1)
- [x] UI: panel admin de grupo separado de /groups (P1)
- [x] UI: slug auto desde nombre de grupo (P1)
- [x] UI: gestion de miembros (listar/salir/transferir admin) (P2)
- [x] UI: links de invitacion (general/especifico, regenerar, expiracion) (P1)
- [x] UI: flujo join por link (registro + datos jugador) (P1)
- [x] UI: listado jugadores (P1)
- [x] UI: generar equipos por fecha (P1)
- [x] UI: carga de resultados (P1)
- [ ] UI: cargar partido jugado con empate, diferencia de gol, MVP/distinciones y notas (P1)
- [x] UI: historial y estadisticas (P2)
- [x] UI: login (P1)
- [x] UI: boton "Crear usuario" en login (P1)
- [x] UI: admin usuarios (P2)
- [x] UI: configuracion (P2)
- [x] UI: exportacion (P2)
- [x] UI: ranking (P2)
- [x] UI: titulos por seccion + orden visual en pantallas principales (P1)

## Epica: Calidad
- [ ] Pruebas y validacion (P2)

## Epica: Backend testing
- [x] Backend testing (P2)
- [x] Tests: authController.login/logout
- [x] Tests: userController.list/create/update/delete
- [x] Tests: playerController.list/create/update/delete
- [x] Tests: matchController.list/create/update/delete
- [x] Tests: teamController.list/create/update/delete
- [x] Tests: resultController.create/update/get
- [x] Tests: eloService.recalcAllElo/upsertResult/replaceDistinctions
- [x] Tests: middleware.authenticate/requireRole
- [x] Tests: errorHandler
- [x] Tests: matches.generate-teams
- [x] Tests: players.elo-history
- [x] Tests: social-pairs
- [x] Tests: players.stats
- [x] Tests: matches.summary
- [x] Tests: players.matches
- [x] Tests: ranking
- [x] Tests: config
- [x] Tests: config.history
- [x] Tests: auth.me
- [x] Tests: auth.change-password
- [x] Tests: users.reset-password
- [x] Tests: export
- [x] Tests: middleware group scoping y X-Group-Id
- [x] Tests: groups CRUD y validaciones de slug
- [x] Tests: group_members (salida, transfer admin, soft delete)
- [x] Tests: group_invites (general/especifico, expiracion, regenerar, usos)
- [x] Tests: join por link (crear user, crear player, restaurar player)
- [x] Tests: limite 30 jugadores activos por grupo
- [x] Tests: auth requiere X-Group-Id para endpoints group-scoped
- [x] Tests: players CRUD con scoping, nickname unico y borrado logico
- [x] Tests: matches CRUD con scoping y courts por grupo
- [x] Tests: teams CRUD con scoping y team_players.group_id
- [x] Tests: results scoping y recalcAllElo por grupo
- [ ] Tests: matches.played (crear partido jugado manual)
- [x] Tests: config por grupo y config_history con group_id
- [x] Tests: ranking/social/export scoping por grupo
