# Tasklist (Epic Format)

## Epica: Base y diseño
- [x] Definir modelo de datos (Sequelize) (borrador en documentacion_tecnica.md)
- [x] Disenar algoritmo de emparejamiento (Elo + social) (propuesta en documentacion_tecnica.md)

## Epica: Autenticacion y roles
- [x] Implementar autenticacion y roles (P1)

## Epica: Jugadores
- [x] Implementar CRUD jugadores (P1)

## Epica: Partidos y equipos
- [x] Implementar CRUD fechas/partidos (P1)
- [x] Implementar CRUD equipos (P1)
- [x] Implementar carga de resultados y distinciones (P1)
- [x] Implementar recalculo de Elo (P1)

## Epica: UI
- [ ] UI: listado jugadores (P1)
- [ ] UI: generar equipos por fecha (P1)
- [ ] UI: carga de resultados (P1)
- [ ] UI: historial y estadisticas (P2)
- [ ] UI: login (P1)
- [ ] UI: admin usuarios (P2)
- [ ] UI: configuracion (P2)
- [ ] UI: exportacion (P2)
- [ ] UI: ranking (P2)

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
