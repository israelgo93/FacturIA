# AGENTS.md

## Cursor Cloud specific instructions

### Servicios

facturIA es una aplicación Next.js 16 (App Router) single-product. No es monorepo.

| Servicio | Comando | Puerto | Notas |
|----------|---------|--------|-------|
| Next.js dev server | `npm run dev` | 3000 | Único servicio necesario para desarrollo |
| Supabase (PostgreSQL + Auth + Storage) | Externo (cloud) | — | Requerido para auth y datos; credenciales via secretos |

### Lint / Test / Build / Dev

Comandos estándar en `package.json`:

- **Tests**: `npm run test` (Vitest, 14 archivos, 102 tests, ~1s). No requiere Supabase.
- **Build**: `npm run build` (Turbopack, ~15s).
- **Dev server**: `npm run dev` (puerto 3000).
- **Lint**: `next lint` fue eliminado en Next.js 16. Usar `npx eslint src/` directamente con el `eslint.config.mjs` flat config que existe en la raíz del proyecto. Se necesitan `eslint` y `eslint-config-next` como devDependencies (ya incluidos en `package.json`).

### Variables de entorno

Todas las variables de entorno necesarias están inyectadas como secretos del Cloud Agent. Para que Next.js las lea, se debe crear `.env.local` expandiendo las variables del entorno del shell. Ejemplo:

```bash
cat > .env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
...
ENVEOF
```

Las variables requeridas están listadas en el README (sección "Variables de entorno").

### Credenciales de prueba

Los secretos `TEST_LOGIN_USERNAME` y `TEST_LOGIN_PASSWORD` contienen credenciales de una cuenta real en el proyecto Supabase. Con ellas se puede hacer login y navegar toda la app autenticada (dashboard, comprobantes, clientes, productos, etc.).

### Notas importantes

- El registro/login requiere un proyecto Supabase funcional con las migraciones aplicadas (`supabase/migrations/`). Sin esto, auth retorna errores genéricos.
- Los tests unitarios (`npm run test`) son independientes de Supabase y siempre deben pasar.
- No hay `docker-compose` en el repo. El `Dockerfile` es solo para producción (AWS App Runner).
- El proyecto usa JavaScript (ES2024), no TypeScript. No hay `tsconfig.json`.
- El CI pipeline (`.github/workflows/ci.yml`) ejecuta: `npm ci` → `npm run lint` → `npm run build` → `npm test`. Nota: `npm run lint` invoca `next lint` que no existe en Next.js 16; el CI puede fallar por esto hasta que se actualice el script.
- Tras hacer login, la app redirige al `/dashboard` que muestra KPIs, gráficos Recharts y métricas del negocio. Desde ahí se navega a Comprobantes, Clientes, Productos, Reportes, etc.
