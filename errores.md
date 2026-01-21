# errores
- [2026-01-20] Tests fallaban por falta de driver sqlite3. Solucion: instalar devDependency `sqlite3` y habilitar DB_DIALECT=sqlite para tests.
- [2026-01-20] Tests fallaban por validacion de email (admin@local). Solucion: usar email valido `admin@local.com`.
- [2026-01-20] `npm audit` reporta vulnerabilidades high en cadena `tar/node-gyp` aun con `sqlite3@5.0.2`. Solucion pendiente: ejecutar `npm audit fix --force` si se acepta breaking change.
- [2026-01-21] Vercel backend 500 por "Please install pg package manually". Solucion: forzar inclusion de `pg` en `backend/src/config/database.js` con `require('pg')` y redeploy.
- [2026-01-21] Vercel backend con pooler Supabase devuelve `SELF_SIGNED_CERT_IN_CHAIN`. Solucion: `DB_SSL=1` y `DATABASE_URL` con `sslmode=no-verify` (o forzar SSL sin verificacion).
