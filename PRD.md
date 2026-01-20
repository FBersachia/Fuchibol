# PRD
# Contexto general del sistema (<=100 lineas)

## Vision
Sistema para gestionar jugadores, generar equipos equilibrados por Elo y registrar partidos con resultados e historial.

## Objetivo principal
Crear equipos parejos en habilidad y con paridad de genero (tolerancia 1), evitando repetir combinaciones frecuentes mediante emparejamiento social.

## Usuarios
- Admin: gestiona jugadores, fechas/partidos, resultados y ajustes.
- Usuario: consulta equipos, calendario y estadisticas personales.

## Alcance funcional
- CRUD de jugadores, fechas/partidos, equipos y resultados.
- Generacion de equipos por fecha con algoritmo tipo Elo.
- Emparejamiento social basado en historial de 12 meses.
- Registro manual de resultados, diferencia de gol y distinciones (MVP y futuras).
- Recalculo de Elo al editar resultados pasados.

## Datos clave
Jugador: nombre, genero, rol arquero (si aplica), elo inicial, historial W/L, distinciones.
Partido: fecha, equipos, resultado, diferencia de gol, MVP, notas.

## Reglas
- Equipos enfrentados siempre con misma cantidad de jugadores (5v5, 6v6, 7v7).
- Si hay dos arqueros disponibles, asignar uno por equipo; si no, flexible.
- Actualizacion de habilidad: editable, default ganar +1, empatar 0, perder -1.
- Emparejamiento social: priorizar jugadores que no suelen jugar juntos.
- Frontend: no agregar elementos innecesarios. Solo los solicitados por el desarrollador. Antes de agregar un elemento en el frontend, validarlo con el desarrollador.

## Tecnologias
Frontend: React. Backend: Node.js. ORM: Sequelize. DB: PostgreSQL.

## Fuera de alcance inicial
- Gestion de disponibilidad de jugadores (se maneja externamente).
- Forzar/bloquear parejas especificas.
