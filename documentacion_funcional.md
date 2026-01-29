# documentacion_funcional

## Contexto de grupos
- La aplicacion soporta multiples grupos independientes.
- Todas las entidades de negocio pertenecen a un grupo.
- Un usuario puede ser miembro de varios grupos.
- El cliente selecciona un grupo activo para operar.

## Gestion de grupos y miembros
- Crear grupo con nombre y slug.
- Editar nombre/slug del grupo.
- Eliminar grupo (baja logica).
- Transferir rol admin a otro miembro.
- Salir del grupo (solo miembros, no admin).
- Listar miembros con rol.

## Invitaciones y altas
- Invitacion general: link con max 30 usos, expira a las 4h, regenerar invalida la anterior.
- Invitacion especifica: link por jugador, max 1 uso, expira a las 4h.
- Alta por invitacion:
  - General: crea usuario si no existe, requiere nickname, genero y elo inicial.
  - Especifica: vincula usuario con jugador existente (restaura si estaba dado de baja).
- Limite funcional: max 30 jugadores activos por grupo.

## Gestion de jugadores
- Alta, baja logica, edicion y consulta por grupo.
- Definicion de genero, elo inicial y rol arquero.
- Nickname unico por grupo (solo jugadores activos).

## Generacion de equipos
- Seleccion de jugadores disponibles del grupo.
- Generacion automatica de dos equipos parejos por Elo.
- Considera paridad de genero y emparejamiento social.
- En caso de 2 arqueros disponibles, se asigna 1 por equipo; si no, flexible.

## Registro de partidos
- Carga manual de resultado (ganador/perdedor/empate).
- Diferencia de gol (solo informativa).
- Distinciones: MVP (uno total) y futuras.
- Carga manual de partido jugado: definir fecha, cancha, equipos y ganador (flujo por pasos).

## Recalculo de Elo
- Al editar un resultado pasado, el sistema recalcula el Elo desde ese partido en adelante.
- El historial de Elo se guarda por partido para auditoria.
- El Elo base por jugador se define al crear el jugador (initial_elo).

## Configuracion
- Pesos del algoritmo (w_elo, w_genero, w_social) configurables por grupo.
- Tolerancia de genero configurable.
- Ajustes de puntos por resultado (ganar/empatar/perder) configurables.
- Toggle: social por defecto.

## Historial y estadisticas
- Historial de partidos por jugador.
- Evolucion de Elo.
- Estadisticas de jugador: partidos jugados, ganados/perdidos y distinciones.
- Resumen de partidos: totales, completados y pendientes.

## Canchas
- CRUD de canchas por grupo.

## Roles y permisos
- Admin global: gestiona usuarios del sistema.
- Admin de grupo: puede crear/editar/eliminar jugadores, partidos, equipos, resultados, canchas y configuracion; gestiona miembros e invitaciones.
- Miembro: consulta informacion general, ranking, historial, exportaciones y puede salir del grupo.

## Regla de UI
- No agregar elementos innecesarios en el frontend. Solo los solicitados por el desarrollador. Antes de agregar un elemento en el frontend, validarlo con el desarrollador.

## Criterios de aceptacion (borrador)
- Grupos: se puede crear, editar, transferir admin, salir y listar miembros.
- Invitaciones: se generan links generales/especificos y el alta funciona segun el tipo.
- Jugadores: se puede crear/editar/eliminar y listar con datos completos.
- Equipos: se generan dos equipos balanceados cumpliendo restricciones.
- Partidos: se registra resultado, MVP y distinciones manualmente.
- Elo: se actualiza por partido y se recalcula al editar resultados.

## Paginas sugeridas (contenido)
### Login
- Campos: email, contrasena.
- Boton: ingresar.
- Mensaje de error en credenciales invalidas.

### Seleccion de grupo
- Lista de grupos del usuario.
- Boton para ingresar al grupo seleccionado.
- Accion para crear grupo (si aplica).

### Unirse por invitacion (publica)
- Campos: email, contrasena.
- Campos extra para invitacion general: nickname, genero, elo inicial.
- Boton: unirse.
- Mensaje de exito o error.

### Gestion de grupo
- Datos: nombre, slug.
- Acciones: editar, transferir admin, eliminar.
- Listado de miembros con rol.
- Boton: salir del grupo (si no es admin).

### Invitaciones
- Generar invitacion general.
- Generar invitacion especifica por jugador.
- Mostrar link, expiracion y usos.

### Listado jugadores
- Tabla: nombre, genero, elo, wins, losses, arquero.
- Acciones admin: crear, editar, eliminar.
- Busqueda/filtro basico (nombre).

### Generar equipos por fecha
- Selector de fecha/partido.
- Selector de jugadores disponibles (lista + multiseleccion).
- Toggle: emparejamiento social.
- Inputs: w_elo, w_genero.
- Boton: previsualizar equipos.
- Boton: confirmar equipos para la fecha.

### Carga de resultados
- Switch: alterna entre "Cargar partido manualmente" y "Cargar resultado".
- Modo "Cargar partido manualmente":
  - Fecha y cancha.
  - Seleccion por pasos: Equipo A y luego Equipo B.
  - Equipo ganador.
  - Boton: cargar partido.
- Modo "Cargar resultado":
  - Selector de partido.
  - Resultado: ganador/equipo A/B o empate.
  - Diferencia de gol.
  - MVP (selector jugador).
  - Distinciones (lista desplegable).
  - Boton: guardar resultado.

### Edicion de partido/fecha
- Selector de partido/fecha.
- Editar: fecha, notas, estado (pendiente/completado).
- Editar jugadores disponibles si el partido aun no se jugo.
- Boton: guardar cambios.

### Historial y estadisticas
- Selector de jugador.
- Historial de partidos (fecha, resultado, equipo).
- Evolucion Elo (lista).
- Stats: jugados, ganados, perdidos, MVP.

### Admin usuarios
- Tabla: nombre, email, rol.
- Acciones: crear, editar, reset password, eliminar.

### Configuracion
- Algoritmo (w_elo, w_genero, w_social).
- Tolerancia de genero.
- Puntos por resultado (win/draw/loss).
- Toggle: social por defecto.
- Boton: guardar cambios.
- Historial de cambios (lista).

### Canchas
- Lista de canchas (nombre, direccion).
- Acciones admin: crear, editar, eliminar.

### Exportacion
- Rango de fechas (desde/hasta).
- Boton: exportar CSV.
- Nota: incluye jugadores, partidos, resultados, Elo.

### Ranking
- Tabla: jugador, elo, wins/losses, MVPs.
- Filtro: top N (limit).
