# Deploy Vercel + Supabase

Este proyecto queda dividido en dos deploys en Vercel:
- Backend: carpeta `backend` (Express + Sequelize).
- Frontend: carpeta `frontend` (Vite + React).

Se usa Supabase como Postgres administrado.

## Valores de este proyecto
- DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>
- Frontend domain: https://fuchibol.fbersachia.com.ar

## 1) Crear base en Supabase
1. Crear un proyecto en Supabase.
2. Ir a Project Settings -> Database y copiar:
   - Host
   - Database name
   - User
   - Password
   - Port
3. Usar conexion con SSL (requerida por Supabase).

Opcional: usar `DATABASE_URL` de Supabase en vez de variables separadas.

## 2) Backend en Vercel
1. Crear un nuevo proyecto en Vercel y apuntar el root a `backend`.
2. Framework: Other.
3. Variables de entorno (Production y Preview):
   - JWT_SECRET=un-secreto-largo
   - DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>
   - DB_SSL=1
   - CORS_ORIGIN=https://fuchibol.fbersachia.com.ar

   Si preferis variables separadas:
   - DB_DIALECT=postgres
   - DB_HOST=<host>
   - DB_PORT=5432
   - DB_NAME=<db>
   - DB_USER=<user>
   - DB_PASSWORD=<password>
   - DB_SSL=1

4. Deploy.
5. Ejecutar migraciones/seed contra Supabase (una vez):
   ```powershell
   cd D:\Dev\Fuchibol\backend
   $env:DATABASE_URL='postgresql://<user>:<password>@<host>:5432/<db>'
   $env:DB_SSL='1'
   $env:JWT_SECRET='un-secreto-largo'
   npm install
   npm run migrate
   npm run seed
   ```

## 3) Frontend en Vercel
1. Crear un proyecto en Vercel y apuntar el root a `frontend`.
2. Framework: Vite.
3. Variables de entorno (Production y Preview):
   - VITE_API_URL=https://<tu-backend>.vercel.app
4. Deploy.
5. Agregar dominio custom `fuchibol.fbersachia.com.ar` en el proyecto de frontend.

## 4) Verificacion
1. Backend health:
   - `https://<tu-backend>.vercel.app/health` -> {"status":"ok"}
2. Frontend:
   - Login con `admin@local.com / adminpass` (si corriste seed).
   - Seleccionar grupo y navegar.

## Notas
- El backend en Vercel usa `backend/vercel.json` para redirigir todas las rutas a `api/index.js`.
- Si cambias el dominio del frontend, actualiza `CORS_ORIGIN` en el backend.
- Para reinstalar seed en Supabase, primero limpia tablas o recrea la base.
