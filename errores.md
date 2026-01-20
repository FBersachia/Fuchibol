# errores
- [2026-01-20] Tests fallaban por falta de driver sqlite3. Solucion: instalar devDependency `sqlite3` y habilitar DB_DIALECT=sqlite para tests.
- [2026-01-20] Tests fallaban por validacion de email (admin@local). Solucion: usar email valido `admin@local.com`.
- [2026-01-20] `npm audit` reporta vulnerabilidades high en cadena `tar/node-gyp` aun con `sqlite3@5.0.2`. Solucion pendiente: ejecutar `npm audit fix --force` si se acepta breaking change.
