# documentacion_funcional

## Gestion de jugadores
- Alta, baja, edicion y consulta de jugadores.
- Definicion de genero, elo inicial y rol arquero.

## Generacion de equipos
- Seleccion de jugadores disponibles (externo al sistema).
- Generacion automatica de dos equipos parejos por Elo.
- Considera paridad de genero y emparejamiento social.
- En caso de 2 arqueros disponibles, se asigna 1 por equipo; si no, flexible.

## Registro de partidos
- Carga manual de resultado (ganador/perdedor/empate).
- Diferencia de gol (solo informativa).
- Distinciones: MVP (uno total) y futuras.

## Recalculo de Elo
- Al editar un resultado pasado, el sistema recalcula el Elo desde ese partido en adelante.
- El historial de Elo se guarda por partido para auditoria.
- El Elo base por jugador se define al crear el jugador (initial_elo).

## Configuracion
- Pesos del algoritmo (w_elo, w_genero, w_social) configurables.
- Tolerancia de genero configurable.
- Ajustes de puntos por resultado (ganar/empatar/perder) configurables.

## Historial y estadisticas
- Historial de partidos por jugador.
- Evolucion de Elo.
- Estadisticas de jugador: partidos jugados, ganados/perdidos y distinciones.
- Resumen de partidos: totales, completados y pendientes.

## Roles
- Admin: acceso total a CRUD y resultados.
- Usuario: consulta de informacion.

## Permisos
- Admin: puede crear/editar/eliminar jugadores, partidos, equipos, resultados y distinciones.
- Usuario: puede ver informacion general, equipos y estadisticas.

## Regla de UI
- No agregar elementos innecesarios en el frontend. Solo los solicitados por el desarrollador. Antes de agregar un elemento en el frontend, validarlo con el desarrollador.

## Criterios de aceptacion (borrador)
- Jugadores: se puede crear/editar/eliminar y listar con datos completos.
- Equipos: se generan dos equipos balanceados cumpliendo restricciones.
- Partidos: se registra resultado, MVP y distinciones manualmente.
- Elo: se actualiza por partido y se recalcula al editar resultados.

## Paginas sugeridas (contenido)
### Login
- Campos: email, contraseña.
- Botón: ingresar.
- Mensaje de error en credenciales inválidas.

### Listado jugadores
- Tabla: nombre, género, elo, wins, losses, arquero.
- Acciones admin: crear, editar, eliminar.
- Búsqueda/filtro básico (nombre).

### Generar equipos por fecha
- Selector de fecha/partido.
- Selector de jugadores disponibles (lista + multiselección).
- Toggle: emparejamiento social.
- Inputs: w_elo, w_genero.
- Botón: generar equipos.
- Resultado: equipos A/B con sumatoria de Elo y diferencia.
- Botón: confirmar equipos para la próxima fecha.

### Carga de resultados
- Selector de partido.
- Resultado: ganador/equipo A/B o empate.
- Diferencia de gol.
- MVP (selector jugador).
- Distinciones (lista desplegable).
- Botón: guardar resultado.

### Edición de partido/fecha
- Selector de partido/fecha.
- Editar: fecha, notas, estado (pendiente/completado).
- Editar jugadores disponibles si el partido aún no se jugó.
- Botón: guardar cambios.

### Historial y estadísticas
- Selector de jugador.
- Historial de partidos (fecha, resultado, equipo).
- Evolución Elo (lista).
- Stats: jugados, ganados, perdidos, MVP.

### Admin usuarios
- Tabla: nombre, email, rol.
- Acciones: crear, editar, reset password, eliminar.

### Configuración
- algoritmo (w_elo, w_genero, w_social).
- Tolerancia de género.
- Puntos por resultado (win/draw/loss).
- Toggle: social por defecto.
- Botón: guardar cambios.
- Historial de cambios (lista).
- Gestión de distinciones para poblar el desplegable.

### Exportación
- Rango de fechas (desde/hasta).
- Botón: exportar CSV.
- Nota: incluye jugadores, partidos, resultados, Elo.

### Ranking
- Tabla: jugador, elo, wins/losses, MVPs.
- Filtro: top N (limit).
