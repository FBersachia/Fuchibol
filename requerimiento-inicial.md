## Requerimiento inicial
Necesito crear un sistema que funcione de la siguiente forma:
- Objetivo: Poder generar equipos de futbol emparejados según un algoritmo para que sean parejos en habilidad.
- Funcionamiento: En cada fecha, los equipos se enfrentarán y según su resultado se sumarán o se restarán puntos de habilidad para cada jugador.
- Habrá una gestión de "jugadores" -> Cada jugador contará con Nombre, nivel de habilidad inicial, historial de partidos perdidos y ganados, genero(h/m).
- Además será necesario evitar la repetición de jugadores en un mismo equipo, se podrá habilitar una opción que sea "emparejamiento social" el cual le dará prioridad a emparejar jugadores que no suelen jugar en el mismo equipo.
- Cada fecha representa un partido. Cada partido tendrá un equipo que gana y uno que pierde o dos que empatan.
- Podés encontrar un ejemplo en los archivos C:\Users\fbersachia\Documents\Dev\Fuchibol\Matriz de equipos - fuchibol 2026 - Habilidad.csv y C:\Users\fbersachia\Documents\Dev\Fuchibol\Matriz de equipos - fuchibol 2026 - Historial.csv

Stack tecnológico:
- React, nodejs, sequelize.



## Consultas del agente
Acá podés insertar las consultas que necesites realizar para poder relevar en profundidad el sistema.
### Preguntas
- ¿Cómo se define el "algoritmo" de emparejamiento? ¿Elo, suma de habilidades, balance de roles, otro? -> Diseñá un algoritmo tipo elo.
- ¿Cantidad fija de jugadores por equipo y por fecha? ¿Puede haber suplentes? -> No hay una cantidad fija, algunos partidos pueden ser de 5, 6 o 7 en cada equipo.
- ¿Cómo se actualiza la habilidad tras cada partido? ¿Reglas exactas para ganar, perder, empatar? -> Hacerlo editable, pero en un principio: Ganar +1, empatar +0, perder -1
- ¿Cómo se mide y aplica el "emparejamiento social"? ¿Peso configurable? ¿Historial desde cuándo? -> Historial desde los últimos 12 meses.
- ¿Hay restricciones por género al armar equipos o es solo un dato informativo? -> La idea es tener misma cantidad de hombres que de mujeres.
- ¿Qué entidades necesitan pantalla/CRUD inicial (jugadores, fechas/partidos, equipos, resultados)? -> Sí, esas mencionadas.
- ¿Cómo se combina el balance de habilidad con el emparejamiento social (peso relativo o prioridad)? -> Proponé un algoritmo para esto. 
- ¿Cuál es el rating inicial (Elo) y el K-factor por defecto? ¿La "habilidad inicial" se mapea a Elo? -> La habilidad inicial sería el elo. Cada jugador cuando es creado se le asigna un valor inicial según su habilidad previa a incorporarse.
- ¿Cómo se calcula la fuerza del equipo con tamaños distintos (suma, promedio, ponderado)? -> Los equipos que se enfrenten siempre tendrán la misma cantidad de jugadores. 
- ¿Qué tolerancia se permite si no se puede lograr paridad exacta de género? -> La tolerancia no debería exceder de una persona. 

### Preguntas adicionales
- ¿Se consideran posiciones/roles de juego (arquero, defensa, etc.) en el emparejamiento? -> Se puede considerar el rol de arquero, si. 
- ¿Cómo se eligen los jugadores disponibles para una fecha (lista manual, invitaciones, disponibilidad por calendario)? -> Se gestionan externamente al sistema. 
- ¿Se permite bloquear/forzar parejas o separar jugadores específicos (ej. por lesiones o preferencias)? -> No por el momento.
- ¿Cómo se registra el resultado del partido (manual, marcador) y qué datos se guardan en el historial? -> De manera manual. Se puede guardar la diferencia de gol, pero solo como un dato, no tendrá influencia en ningun calculo por el momento. Se agregará tambien "distinciones". En principio "mvp" que sería el mejor jugador del partido. 
- ¿Se requiere autenticación/roles de usuario (admin vs. participante) para CRUD y carga de resultados? -> Si. Habrá un rol de usuario y un rol de admin. 

### Preguntas adicionales 2
- ¿Cuál es la regla exacta para arqueros (uno por equipo, qué pasa si faltan o sobran)? -> Si faltan o sobran arqueros se manejará de manera flexible. Lo util es que en caso de que haya dos arqueros, se asigne uno a cada equipo. 
- ¿Qué ocurre si la cantidad de jugadores disponibles es impar? -> La cantidad de jugadores disponibles siempre será la exacta a repartir. Por ejemplo si es un 6v6, siempre habrá 12 jugadores disponibles. 
- ¿Se permite editar resultados pasados y recalcular el Elo histórico? -> Si. 
- ¿Cómo se define el MVP (uno total o uno por equipo)? ¿Habrá otras distinciones a futuro? -> Uno en total. Si, habrá distinciones.
