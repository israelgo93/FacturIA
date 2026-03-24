# AGENTS.md

## Cursor Cloud Agent — Instrucciones de entorno

facturIA es una aplicación Next.js 16 (App Router) single-product. No es monorepo.

### Servicios

| Servicio | Comando | Puerto | Notas |
|----------|---------|--------|-------|
| Next.js dev server | `npm run dev` | 3000 | Único servicio necesario para desarrollo |
| Supabase (PostgreSQL + Auth + Storage) | Externo (cloud) | — | Requerido para auth y datos; credenciales via secretos |

### Lint / Test / Build / Dev

Comandos estándar en `package.json`:

- **Tests**: `npm run test` (Vitest, 14 archivos, 102 tests, ~1s). No requiere Supabase.
- **Build**: `npm run build` (Turbopack, ~15s).
- **Dev server**: `npm run dev` (puerto 3000).
- **Lint**: `npm run lint` — invoca `eslint src/` con `eslint.config.mjs` (flat config ESLint 9). `next lint` fue eliminado en Next.js 16.
- **Lint estricto**: `npm run lint:strict` — igual pero falla si hay cualquier warning.

### Variables de entorno

Todas las variables necesarias están inyectadas como secretos del Cloud Agent. Para que Next.js las lea, crear `.env.local` expandiendo las variables del shell:

```bash
cat > .env.local << ENVEOF
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
RESEND_API_KEY=${RESEND_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_PRICE_STARTER=${STRIPE_PRICE_STARTER}
STRIPE_PRICE_PROFESSIONAL=${STRIPE_PRICE_PROFESSIONAL}
STRIPE_PRICE_ENTERPRISE=${STRIPE_PRICE_ENTERPRISE}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
NEXT_PUBLIC_APP_NAME=facturIA
ENVEOF
```

### Credenciales de prueba

Los secretos `TEST_LOGIN_USERNAME` y `TEST_LOGIN_PASSWORD` contienen credenciales de una cuenta real en el proyecto Supabase. Permiten hacer login y navegar toda la app autenticada (dashboard, comprobantes, clientes, productos, reportes).

### Notas importantes

- El registro/login requiere un proyecto Supabase funcional con las migraciones aplicadas (`supabase/migrations/`). Sin esto, auth retorna errores genéricos.
- Los tests unitarios (`npm run test`) son independientes de Supabase y siempre deben pasar.
- No hay `docker-compose`. El `Dockerfile` es solo para producción (AWS App Runner).
- El proyecto usa JavaScript (ES2024), no TypeScript. No hay `tsconfig.json`.
- El CI ejecuta: `npm ci` → `npm run lint` → `npm run build` → `npm test`.
- Tras login, la app redirige a `/dashboard` con KPIs, gráficos Recharts y métricas del negocio.
- **Deuda técnica activa**: 27 warnings de ESLint documentados en issues #8–#12. Las reglas están degradadas a `warn` temporalmente — no introducir nuevos patrones de los mismos tipos.

### Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth + DB**: Supabase (PostgreSQL + Row Level Security)
- **UI**: Tailwind CSS 4, Framer Motion, Recharts
- **Formularios**: React Hook Form + Zod
- **Pagos**: Stripe
- **Email**: Resend
- **IA**: Gemini (Google Generative AI)
- **SRI**: SOAP WS (comprobantes electrónicos Ecuador)
- **Testing**: Vitest
- **Deploy**: AWS App Runner (ECR)
