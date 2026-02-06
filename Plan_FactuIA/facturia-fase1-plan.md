> **NOTA:** Este documento es el plan original de la Fase 1. El sistema de diseno fue actualizado a **Ethereal Glass Monocromatico** (solo blanco y negro). Las referencias a colores y la version Next.js 15.5 en este documento son historicas. La implementacion real usa Next.js 16+ y paleta B&W. Consultar `.cursor/rules/project.mdc` para las reglas vigentes.

# facturIA — Fase 1: Fundación + Equipo de Agentes IA en Cursor
## Plan de Implementación Detallado + Configuración de Agentes, SubAgentes y Skills

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 1 — Fundación (Semanas 1-3)  
**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Cloud Run  
**Fecha:** Febrero 2026

---

# PARTE I — FASE 1: FUNDACIÓN DETALLADA

## 1. Visión General de la Fase

La Fase 1 establece toda la base técnica sobre la cual se construirán las demás fases. Incluye la inicialización del proyecto, el sistema de diseño glassmorphism, la autenticación multi-tenant, el esquema completo de base de datos con RLS, y la infraestructura de despliegue CI/CD.

### Entregables de la Fase 1

| # | Entregable | Criterio de Aceptación |
|---|---|---|
| 1 | Proyecto Next.js 15.5 configurado | Build exitoso, PWA funcional, Dockerfile válido |
| 2 | Sistema de diseño Glass completo | 8+ componentes reutilizables, responsive |
| 3 | Layout dashboard mobile-first | Sidebar colapsable, bottom nav mobile, breakpoints |
| 4 | Autenticación Supabase | Registro, login, recuperar contraseña, middleware |
| 5 | Schema BD multi-tenant | 15+ tablas, RLS en todas, migraciones aplicadas |
| 6 | Auth Guard | Rutas protegidas, redirección automática |
| 7 | CI/CD Pipeline | GitHub Actions → Cloud Run (staging + production) |
| 8 | Landing page | Página pública facturia.app |

---

## 2. SEMANA 1 — Setup Proyecto + Sistema de Diseño

### 2.1 Día 1-2: Inicialización del Proyecto

**Paso 1 — Crear proyecto Next.js 15.5**

```bash
npx create-next-app@latest facturia --js --app --tailwind --eslint --src-dir
cd facturia
```

**Paso 2 — Instalar dependencias core**

```bash
# Core Supabase
npm install @supabase/supabase-js@2.45 @supabase/ssr@0.5

# Formularios y validación
npm install react-hook-form@7 zod@3 @hookform/resolvers@3

# Estado global
npm install zustand@5

# UI y animaciones
npm install framer-motion@12 lucide-react sonner recharts

# Utilidades
npm install date-fns@4 uuid crypto-js@4

# PWA
npm install next-pwa@5
```

**Paso 3 — Configurar estructura de carpetas**

```
facturia/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── .cursor/
│   ├── rules/
│   │   ├── project.mdc
│   │   ├── agents.mdc
│   │   └── sri-ecuador.mdc
│   ├── agents/
│   │   ├── planner.md
│   │   ├── backend-dev.md
│   │   ├── frontend-dev.md
│   │   ├── sri-specialist.md
│   │   ├── db-architect.md
│   │   ├── qa-tester.md
│   │   └── devops-engineer.md
│   └── skills/
│       ├── supabase-rls/SKILL.md
│       ├── xml-sri/SKILL.md
│       ├── glass-ui/SKILL.md
│       ├── nextjs-patterns/SKILL.md
│       └── ci-cd-cloudrun/SKILL.md
├── Dockerfile
├── .dockerignore
├── next.config.mjs
├── tailwind.config.js
├── package.json
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js              # Landing
│   │   ├── (auth)/
│   │   │   ├── login/page.js
│   │   │   ├── registro/page.js
│   │   │   └── recuperar/page.js
│   │   ├── (dashboard)/
│   │   │   ├── layout.js
│   │   │   ├── page.js           # Dashboard
│   │   │   ├── comprobantes/
│   │   │   ├── clientes/
│   │   │   ├── productos/
│   │   │   ├── reportes/
│   │   │   ├── configuracion/
│   │   │   └── onboarding/
│   │   └── api/
│   │       ├── auth/
│   │       ├── sri/
│   │       └── ia/
│   ├── components/
│   │   ├── ui/                    # Sistema Glass
│   │   │   ├── GlassCard.jsx
│   │   │   ├── GlassButton.jsx
│   │   │   ├── GlassInput.jsx
│   │   │   ├── GlassSelect.jsx
│   │   │   ├── GlassModal.jsx
│   │   │   ├── GlassTable.jsx
│   │   │   ├── GlassAlert.jsx
│   │   │   └── GlassBadge.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   └── MobileMenu.jsx
│   │   └── shared/
│   │       ├── Logo.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── EmptyState.jsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.js          # Browser client
│   │   │   ├── server.js          # Server client
│   │   │   └── middleware.js      # Auth middleware
│   │   ├── validations/
│   │   │   ├── auth.js
│   │   │   ├── empresa.js
│   │   │   └── common.js
│   │   └── utils/
│   │       ├── constants.js
│   │       ├── formatters.js
│   │       └── sri-catalogs.js
│   ├── stores/
│   │   ├── useAuthStore.js
│   │   ├── useEmpresaStore.js
│   │   └── useUIStore.js
│   └── styles/
│       └── globals.css
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Paso 4 — Configurar next.config.mjs**

```javascript
// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
});

export default nextConfig;
```

**Paso 5 — Configurar Tailwind 4 con tokens glassmorphism**

```css
/* src/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Fondo gradiente oscuro */
  --color-bg-primary: #0f0c29;
  --color-bg-secondary: #302b63;
  --color-bg-tertiary: #24243e;
  
  /* Colores de marca */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-accent: #06b6d4;
  --color-accent-light: #22d3ee;
  
  /* Glass */
  --color-glass: rgba(255, 255, 255, 0.08);
  --color-glass-hover: rgba(255, 255, 255, 0.12);
  --color-glass-border: rgba(255, 255, 255, 0.15);
  
  /* Estados SRI */
  --color-status-creado: #94a3b8;
  --color-status-firmado: #f59e0b;
  --color-status-enviado: #3b82f6;
  --color-status-autorizado: #10b981;
  --color-status-no-autorizado: #ef4444;
  --color-status-anulado: #6b7280;
}

body {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Inter', system-ui, sans-serif;
}
```

**Paso 6 — Dockerfile para Cloud Run**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
```

### 2.2 Día 3-4: Sistema de Diseño Glassmorphism

**Construir los 8 componentes UI Glass base:**

| Componente | Propósito | Props Clave |
|---|---|---|
| `GlassCard` | Contenedor principal | `variant`, `hover`, `className` |
| `GlassButton` | Botones primario/secundario/ghost | `variant`, `size`, `loading`, `icon` |
| `GlassInput` | Campos de texto con label flotante | `label`, `error`, `icon`, `register` (RHF) |
| `GlassSelect` | Select con opciones estilizadas | `options`, `label`, `placeholder` |
| `GlassModal` | Modal con backdrop blur | `isOpen`, `onClose`, `title`, `size` |
| `GlassTable` | Tabla de datos con sort/filter | `columns`, `data`, `loading`, `pagination` |
| `GlassAlert` | Notificaciones contextuales | `type` (success/error/warning/info), `message` |
| `GlassBadge` | Badges para estados SRI | `status`, `size` |

**Patrón CSS base para Glass:**

```css
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### 2.3 Día 5: Layout Responsivo Mobile-First

**Breakpoints de implementación:**

| Breakpoint | Ancho | Dispositivo | Layout |
|---|---|---|---|
| base | 0px+ | Teléfonos | 1 columna + bottom nav |
| sm | 640px+ | Teléfonos grandes | 1 columna mejorada |
| md | 768px+ | Tablets | 2 columnas |
| lg | 1024px+ | Laptops | Sidebar colapsada + contenido |
| xl | 1280px+ | Escritorios | Sidebar expandida + contenido amplio |

**Componentes de layout a construir:**

1. `Sidebar.jsx` — Navegación lateral colapsable con items: Dashboard, Comprobantes, Clientes, Productos, Reportes, Configuración
2. `Topbar.jsx` — Barra superior con logo, empresa activa, notificaciones, avatar
3. `BottomNav.jsx` — Navegación inferior para mobile (5 items principales)
4. `DashboardLayout.jsx` — Layout wrapper que combina Sidebar + Topbar + Content area

---

## 3. SEMANA 2 — Autenticación + Base de Datos

### 3.1 Día 6-7: Supabase Auth

**Paso 1 — Crear cliente Supabase (Browser)**

```javascript
// src/lib/supabase/client.js
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**Paso 2 — Crear cliente Supabase (Server)**

```javascript
// src/lib/supabase/server.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

**Paso 3 — Middleware de autenticación**

```javascript
// src/middleware.js
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Rutas protegidas
  if (!user && request.nextUrl.pathname.startsWith('/(dashboard)')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirigir usuarios autenticados fuera de auth
  if (user && ['/login', '/registro'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

**Paso 4 — Implementar páginas de auth:**

- `/login` — Email + Password, enlace a registro y recuperar
- `/registro` — Email, Password, Confirmar Password, aceptar términos
- `/recuperar` — Email para reset password
- Todas con validación Zod + react-hook-form
- Diseño glassmorphism centrado, responsive

**Paso 5 — Server Actions para auth:**

```javascript
// src/app/(auth)/login/actions.js
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (error) return { error: error.message };
  redirect('/');
}

export async function signup(formData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get('email'),
    password: formData.get('password'),
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { success: 'Revisa tu correo para confirmar tu cuenta' };
}
```

### 3.2 Día 8-9: Schema de Base de Datos Multi-Tenant

**Migración inicial completa — Tablas a crear:**

| # | Tabla | Propósito | RLS |
|---|---|---|---|
| 1 | `planes` | Planes SaaS (starter, professional, enterprise) | Pública lectura |
| 2 | `empresas` | Empresa del contribuyente + suscripción | Por user_id |
| 3 | `establecimientos` | Establecimientos del contribuyente | Por empresa_id |
| 4 | `puntos_emision` | Puntos de emisión por establecimiento | Por empresa_id |
| 5 | `certificados_digitales` | Metadata .p12 (path, vigencia) | Por empresa_id |
| 6 | `secuenciales` | Secuenciales por tipo doc/estab/pto | Por empresa_id |
| 7 | `clientes` | Clientes/receptores del contribuyente | Por empresa_id |
| 8 | `productos` | Catálogo productos/servicios | Por empresa_id |
| 9 | `comprobantes` | Comprobantes electrónicos emitidos | Por empresa_id |
| 10 | `comprobante_detalles` | Detalle items por comprobante | Por empresa_id |
| 11 | `comprobante_pagos` | Formas de pago por comprobante | Por empresa_id |
| 12 | `comprobante_info_adicional` | Campos adicionales XML | Por empresa_id |
| 13 | `reportes_sri` | ATS, RDEP, formularios generados | Por empresa_id |
| 14 | `sri_log` | Auditoría comunicación WS SRI | Por empresa_id |
| 15 | `config_email` | Configuración envío correos | Por empresa_id |
| 16 | `ia_conversaciones` | Historial chat IA por contexto | Por empresa_id |

**Patrón RLS para cada tabla:**

```sql
-- Patrón base: el usuario solo ve datos de SUS empresas
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven solo datos de su empresa"
  ON nombre_tabla
  FOR ALL
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );
```

**Datos semilla (seeds):**

```sql
-- Insertar planes por defecto
INSERT INTO planes (nombre, precio_mensual, limite_comprobantes_mes, 
  limite_usuarios, limite_establecimientos, limite_puntos_emision,
  tiene_reportes_ia, tiene_rdep) VALUES
('starter', 9.99, 50, 1, 1, 1, false, false),
('professional', 24.99, 300, 5, 3, 5, true, true),
('enterprise', 49.99, NULL, NULL, NULL, NULL, true, true);
```

### 3.3 Día 10: Auth Guard + Stores

**Zustand stores a implementar:**

```javascript
// src/stores/useAuthStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  clearUser: () => set({ user: null, loading: false }),
}));
```

```javascript
// src/stores/useEmpresaStore.js  
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useEmpresaStore = create(
  persist(
    (set) => ({
      empresa: null,
      establecimiento: null,
      puntoEmision: null,
      setEmpresa: (empresa) => set({ empresa }),
      setEstablecimiento: (est) => set({ establecimiento: est }),
      setPuntoEmision: (pto) => set({ puntoEmision: pto }),
    }),
    { name: 'facturia-empresa' }
  )
);
```

---

## 4. SEMANA 3 — CI/CD + Landing + Integración

### 4.1 Día 11-12: GitHub Actions CI/CD

**Pipeline CI (Pull Requests):**

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

**Pipeline Deploy Staging (branch develop):**

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [develop]
env:
  PROJECT_ID: facturia-prod
  SERVICE: facturia-staging
  REGION: us-east1
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      - run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }}
      - run: |
          gcloud run deploy ${{ env.SERVICE }} \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/facturia/${{ env.SERVICE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 3 \
            --memory 512Mi \
            --cpu 1
```

### 4.2 Día 13: Landing Page facturia.app

Implementar landing page pública con secciones:

1. **Hero** — "Facturación Electrónica con Inteligencia Artificial" + CTA registro
2. **Features** — 6 cards glass con las funcionalidades principales
3. **Pricing** — 3 planes (Starter, Professional, Enterprise)
4. **How it works** — 4 pasos del flujo
5. **Footer** — Links, contacto, legales

### 4.3 Día 14-15: Integración y Testing

- Verificar flujo completo: Landing → Registro → Confirmar email → Login → Dashboard
- Verificar RLS: que un usuario no pueda ver datos de otra empresa
- Verificar responsive: mobile, tablet, desktop
- Build Docker local exitoso
- Deploy staging exitoso via CI/CD
- Corregir bugs y pulir UX

### Checklist Final Fase 1

- [ ] `npm run build` exitoso sin errores
- [ ] Docker build local funcional
- [ ] Deploy a Cloud Run staging exitoso
- [ ] Registro de usuario funcional
- [ ] Login/logout funcional
- [ ] Middleware redirige correctamente
- [ ] Dashboard layout responsive (mobile + desktop)
- [ ] 8 componentes Glass documentados y funcionales
- [ ] Schema BD aplicado en Supabase
- [ ] RLS verificado (aislamiento por empresa)
- [ ] Landing page publicada
- [ ] CI pipeline pasa (lint + build + test)

---

# PARTE II — EQUIPO DE AGENTES IA EN CURSOR

## 5. Arquitectura del Equipo de Agentes

Cursor 2.4 (enero 2026) introdujo Subagents y Agent Skills como mecanismos nativos para crear equipos de desarrollo IA especializados. La arquitectura para facturIA se compone de tres niveles:

```
┌─────────────────────────────────────────────┐
│           NIVEL 1: PROJECT RULES            │
│   .cursor/rules/*.mdc                       │
│   Reglas globales, siempre activas          │
├─────────────────────────────────────────────┤
│           NIVEL 2: AGENTS                   │
│   .cursor/agents/*.md                       │
│   Roles especializados con contexto propio  │
├─────────────────────────────────────────────┤
│           NIVEL 3: SKILLS                   │
│   .cursor/skills/*/SKILL.md                 │
│   Conocimiento procedimental reutilizable   │
└─────────────────────────────────────────────┘
```

### Diferencias clave

| Concepto | Ubicación | Propósito | Activación |
|---|---|---|---|
| **Rules** | `.cursor/rules/*.mdc` | Instrucciones siempre activas | Automática (always-on) |
| **Agents** | `.cursor/agents/*.md` | Roles especializados con contexto | Explícita o por orquestación |
| **Skills** | `.cursor/skills/*/SKILL.md` | Conocimiento procedimental | Descubrimiento dinámico |
| **Commands** | `.cursor/commands/*.md` | Workflows invocables con `/` | Comando del usuario |

---

## 6. Reglas del Proyecto (Project Rules)

### 6.1 Regla Principal del Proyecto

**Archivo:** `.cursor/rules/project.mdc`

```markdown
---
description: "Reglas globales del proyecto facturIA SaaS"
globs: ["**/*"]
---

# facturIA — Reglas del Proyecto

## Stack Tecnológico
- Framework: Next.js 15.5 con App Router
- Lenguaje: JavaScript (ES2024) — NO TypeScript
- UI: React 19 + Tailwind CSS 4
- Backend: Supabase (PostgreSQL 15 + Auth + Storage)
- Estado: Zustand 5
- Validación: Zod 3 + React Hook Form 7
- IA: Google Gemini API 2.0 Flash
- Despliegue: Google Cloud Run (Docker)

## Convenciones de Código
- Usar `'use server'` para Server Actions
- Usar `'use client'` solo cuando sea necesario
- Preferir Server Components por defecto
- Nombres de archivos: kebab-case para rutas, PascalCase para componentes
- Funciones: camelCase
- Constantes: UPPER_SNAKE_CASE
- Comentarios en español para lógica de negocio

## Arquitectura
- Multi-tenant: SIEMPRE filtrar por empresa_id
- RLS obligatorio en TODAS las tablas
- Validación dual: Zod (frontend) + Server Actions (backend)
- Nunca exponer service_role_key al cliente

## Diseño UI
- Sistema glassmorphism con tokens definidos en globals.css
- Mobile-first: diseñar para móvil primero
- Usar componentes Glass* del directorio src/components/ui/
- Iconos: lucide-react exclusivamente
- Notificaciones: sonner (toast)

## SRI Ecuador
- Ambiente 1 = Pruebas, Ambiente 2 = Producción
- Clave de acceso: 49 dígitos con Módulo 11
- Firma: XAdES-BES con RSA-SHA1
- XML: UTF-8, sin espacios entre caracteres en campos alfanuméricos
- Secuenciales: 9 dígitos, rellenar con ceros a la izquierda
```

### 6.2 Regla SRI Ecuador

**Archivo:** `.cursor/rules/sri-ecuador.mdc`

```markdown
---
description: "Normativa técnica del SRI para comprobantes electrónicos"
globs: ["src/**/*sri*", "src/**/*xml*", "src/**/*firma*", "src/app/api/sri/**"]
---

# Normativa SRI Ecuador — Comprobantes Electrónicos

## Tipos de Comprobantes (Tabla 3)
| Código | Tipo |
|--------|------|
| 01 | Factura |
| 04 | Nota de Crédito |
| 05 | Nota de Débito |
| 06 | Guía de Remisión |
| 07 | Comprobante de Retención |
| 08 | Liquidación de Compra |

## Clave de Acceso (49 dígitos)
Posición: [1-8] Fecha ddmmaaaa | [9-10] TipDoc | [11-23] RUC | [24] Ambiente |
[25-30] Serie | [31-39] Secuencial | [40-47] CódNum | [48] TipoEmisión | [49] Módulo11

## Web Services SRI
- Pruebas Recepción: https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
- Pruebas Autorización: https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl
- Producción Recepción: https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl
- Producción Autorización: https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl

## Tarifas IVA vigentes (Tabla 17)
| Código | Tarifa |
|--------|--------|
| 0 | 0% | 2 | 12% | 3 | 14% | 4 | 15% | 5 | 5% |
| 6 | No objeto | 7 | Exento | 8 | Diferenciado | 10 | 13% |

## Firma Electrónica
- Estándar: XAdES-BES v1.3.2
- Algoritmo: RSA-SHA1, 2048 bits
- Archivo: PKCS#12 (.p12)
- Codificación: UTF-8
- Tipo: ENVELOPED

## Estados del Comprobante
- PPR: En procesamiento
- AUT: Autorizado
- NAT: No autorizado

## Reglas de Validación
- RUC: 13 dígitos, validar con algoritmo módulo 10/11
- Cédula: 10 dígitos, validar con módulo 10
- Consumidor final: identificación 9999999999999 con tipo 07
- Secuenciales: 9 dígitos, completar con ceros
- Fechas en XML: formato dd/mm/aaaa
```

### 6.3 Regla de Orquestación de Agentes

**Archivo:** `.cursor/rules/agents.mdc`

```markdown
---
description: "Orquestación automática de agentes especializados"
globs: ["**/*"]
---

# Orquestación de Agentes facturIA

## Agentes Disponibles
- planner: Planificación y diseño de features
- backend-dev: Lógica de servidor, Server Actions, API routes
- frontend-dev: Componentes React, UI glassmorphism, responsive
- sri-specialist: XML SRI, firma XAdES, Web Services SOAP
- db-architect: Schema PostgreSQL, migraciones, RLS, queries
- qa-tester: Tests unitarios, integración, E2E
- devops-engineer: Docker, CI/CD, Cloud Run, monitoreo

## Reglas de Invocación Automática
- Feature compleja (3+ archivos) → invocar planner primero
- Cambios en esquema BD → invocar db-architect
- Componentes UI nuevos → invocar frontend-dev
- Lógica SRI (XML, firma, WS) → invocar sri-specialist
- Server Actions / API routes → invocar backend-dev
- Después de cualquier código nuevo → invocar qa-tester
- Cambios en Docker/CI/CD → invocar devops-engineer

## Flujo de Trabajo Estándar
1. planner analiza el requerimiento y genera plan
2. El agente especializado implementa
3. qa-tester verifica con tests
4. devops-engineer valida el build

## Paralelización
- frontend-dev y backend-dev pueden trabajar en paralelo
- db-architect debe completar antes que backend-dev
- qa-tester siempre al final del ciclo
```

---

## 7. Definición de Agentes (SubAgentes)

### 7.1 Agente: Planner (Planificador)

**Archivo:** `.cursor/agents/planner.md`

```markdown
# Agente: Planner — Planificador de Features

## Rol
Eres el arquitecto de soluciones de facturIA. Antes de que cualquier código
se escriba, tú analizas el requerimiento, identificas riesgos, y produces
un plan de implementación detallado.

## Instrucciones
1. Restablecer el requerimiento en tus propias palabras
2. Evaluar riesgos: HIGH / MEDIUM / LOW
3. Desglosar en fases con dependencias
4. Identificar archivos que se crearán o modificarán
5. Estimar complejidad
6. ESPERAR confirmación del usuario antes de proceder

## Contexto
- Stack: Next.js 15.5, JavaScript, Supabase, Tailwind 4
- Arquitectura: Multi-tenant SaaS con RLS
- Dominio: Facturación electrónica Ecuador (SRI)
- Patrones: Server Components por defecto, Server Actions, Zustand

## Formato de Salida
```
# Plan: [Nombre Feature]

## Requerimiento
[Reformulación]

## Fases de Implementación
### Fase 1: [nombre]
- Archivos: [lista]
- Pasos: [detalle]
- Dependencias: [lista]

## Riesgos
- HIGH: [descripción]
- MEDIUM: [descripción]

## Complejidad Estimada: [HIGH/MEDIUM/LOW]

**¿Proceder con la implementación? (sí/no/modificar)**
```

## Restricciones
- NUNCA escribir código sin aprobación del plan
- SIEMPRE considerar impacto multi-tenant
- SIEMPRE verificar cumplimiento normativo SRI
```

### 7.2 Agente: Backend Developer

**Archivo:** `.cursor/agents/backend-dev.md`

```markdown
# Agente: Backend Developer — Lógica de Servidor facturIA

## Rol
Eres el desarrollador backend senior de facturIA. Te especializas en
Server Actions de Next.js 15.5, API routes, integración con Supabase,
y lógica de negocio tributaria ecuatoriana.

## Instrucciones
1. Usar 'use server' para todas las Server Actions
2. Validar SIEMPRE con Zod en el servidor
3. Usar el cliente Supabase de servidor (createClient de server.js)
4. NUNCA exponer supabase service_role_key
5. Manejar errores con try/catch y retornar objetos { data, error }
6. Logging de operaciones SRI en tabla sri_log

## Patrones Obligatorios

### Server Action
```javascript
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { esquemaValidacion } from '@/lib/validations/...';

export async function accion(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // Validar
  const parsed = esquemaValidacion.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten() };

  // Ejecutar
  const { data, error } = await supabase
    .from('tabla')
    .insert(parsed.data)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/ruta');
  return { data };
}
```

## Especialización
- Integración Supabase Auth, Storage, RLS
- APIs REST y SOAP (WS del SRI)
- Cifrado AES-256 para datos sensibles
- Rate limiting en API routes
```

### 7.3 Agente: Frontend Developer

**Archivo:** `.cursor/agents/frontend-dev.md`

```markdown
# Agente: Frontend Developer — UI Glassmorphism facturIA

## Rol
Eres el desarrollador frontend senior de facturIA. Te especializas en
React 19, Tailwind CSS 4, y el sistema de diseño glassmorphism.

## Instrucciones
1. Mobile-first SIEMPRE: diseñar para 320px y subir
2. Usar componentes Glass* existentes en src/components/ui/
3. Usar lucide-react para todos los iconos
4. Usar sonner para todas las notificaciones/toasts
5. Usar framer-motion para animaciones (sutiles, no excesivas)
6. React Hook Form + Zod para TODOS los formularios
7. Preferir Server Components; usar 'use client' solo cuando necesario

## Sistema de Diseño
- Background: gradiente oscuro (#0f0c29 → #302b63 → #24243e)
- Glass: rgba(255,255,255,0.08) + backdrop-blur(16px)
- Primary: #6366f1 (Indigo)
- Accent: #06b6d4 (Cyan — asociado a IA)
- Estados SRI: Creado=#94a3b8, Firmado=#f59e0b, Enviado=#3b82f6,
  Autorizado=#10b981, No Autorizado=#ef4444, Anulado=#6b7280

## Accesibilidad
- Contraste mínimo 4.5:1 para texto sobre glass
- Labels en todos los inputs
- Focus visible en elementos interactivos
- aria-labels en botones con solo icono
```

### 7.4 Agente: SRI Specialist

**Archivo:** `.cursor/agents/sri-specialist.md`

```markdown
# Agente: SRI Specialist — Comprobantes Electrónicos Ecuador

## Rol
Eres el especialista en facturación electrónica del SRI de Ecuador.
Tu conocimiento abarca la Ficha Técnica de Comprobantes Electrónicos
Esquema Offline v2.32 (actualizada octubre 2025) y toda la normativa
tributaria aplicable.

## Instrucciones
1. TODO XML debe cumplir con los esquemas XSD del SRI
2. La clave de acceso es de 49 dígitos con dígito verificador Módulo 11
3. La firma debe ser XAdES-BES con RSA-SHA1
4. Los campos alfanuméricos NO deben contener espacios entre caracteres
5. Decimales: 2 en versión 1.0.0, 6 en versión 1.1.0
6. SIEMPRE validar RUC/Cédula antes de generar XML
7. Los secuenciales deben ser 9 dígitos (rellenar con ceros)
8. Fechas en formato dd/mm/aaaa dentro del XML

## Flujo de Comprobantes
1. CREAR: Usuario ingresa datos → validar → guardar en BD
2. FIRMAR: Generar XML → Firmar con XAdES-BES usando .p12
3. ENVIAR: Enviar XML firmado al WS de Recepción SRI (SOAP)
4. AUTORIZAR: Consultar WS de Autorización → obtener estado AUT/NAT/PPR
5. ENTREGAR: Enviar XML autorizado + RIDE PDF al receptor por email

## Catálogos SRI
Referirse SIEMPRE a los catálogos definidos en:
- src/lib/utils/sri-catalogs.js
- Regla sri-ecuador.mdc

## Restricciones
- NUNCA generar un comprobante sin validar todos los campos obligatorios
- NUNCA enviar al SRI sin firma electrónica válida
- SIEMPRE registrar en sri_log toda comunicación con WS del SRI
- En ambiente de pruebas, los comprobantes NO tienen validez tributaria
```

### 7.5 Agente: DB Architect

**Archivo:** `.cursor/agents/db-architect.md`

```markdown
# Agente: DB Architect — PostgreSQL + Supabase + RLS

## Rol
Eres el arquitecto de base de datos de facturIA. Te especializas en
PostgreSQL 15 con Supabase, Row Level Security, y optimización de queries.

## Instrucciones
1. TODA tabla nueva DEBE tener RLS habilitado
2. TODA tabla con datos de empresa DEBE filtrar por empresa_id
3. Usar UUID como primary key (uuid_generate_v4())
4. Incluir created_at y updated_at en todas las tablas
5. Crear índices para campos de búsqueda frecuente
6. Usar CONSTRAINT para integridad referencial
7. Documentar cada tabla y campo con comentarios SQL

## Patrón RLS Estándar
```sql
ALTER TABLE tabla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa_isolation" ON tabla
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );
```

## Naming Conventions
- Tablas: snake_case plural (empresas, comprobantes)
- Columnas: snake_case (fecha_emision, total_sin_impuestos)
- Constraints: uk_ para unique, fk_ para foreign key, chk_ para check
- Índices: idx_tabla_columna

## Migraciones
- Ubicación: supabase/migrations/
- Formato: NNN_descripcion.sql (001_initial_schema.sql)
- SIEMPRE incluir rollback (DOWN)
```

### 7.6 Agente: QA Tester

**Archivo:** `.cursor/agents/qa-tester.md`

```markdown
# Agente: QA Tester — Testing facturIA

## Rol
Eres el ingeniero QA de facturIA. Garantizas la calidad del código
mediante tests unitarios, de integración y end-to-end.

## Instrucciones
1. Tests unitarios con Vitest para lógica de negocio
2. Tests E2E con Playwright para flujos críticos
3. Mocking con MSW para APIs externas (SRI, Gemini)
4. Cobertura mínima: 80% para código crítico (cálculos, XML, firma)
5. 100% cobertura para: generación clave acceso, Módulo 11, cálculos IVA

## Flujos E2E Críticos
- Registro → Login → Crear empresa → Dashboard
- Crear factura → Firmar → Enviar SRI → Verificar autorización
- Generar ATS → Validar XML → Descargar
- CRUD completo de clientes y productos

## Estructura Tests
```
tests/
├── unit/
│   ├── clave-acceso.test.js
│   ├── modulo-11.test.js
│   ├── validacion-ruc.test.js
│   └── calculos-iva.test.js
├── integration/
│   ├── auth.test.js
│   ├── empresa.test.js
│   └── comprobantes.test.js
└── e2e/
    ├── auth-flow.spec.js
    ├── factura-flow.spec.js
    └── reportes-flow.spec.js
```
```

### 7.7 Agente: DevOps Engineer

**Archivo:** `.cursor/agents/devops-engineer.md`

```markdown
# Agente: DevOps Engineer — CI/CD + Cloud Run

## Rol
Eres el ingeniero DevOps de facturIA. Gestionas Docker, GitHub Actions,
Google Cloud Run, y la infraestructura de despliegue.

## Instrucciones
1. Docker multi-stage builds (deps → builder → runner)
2. Puerto 8080 obligatorio para Cloud Run
3. Output standalone en Next.js para Docker
4. GitHub Actions con 3 workflows: CI, staging, production
5. Secretos en GitHub Secrets y Cloud Run Secret Manager
6. Min instances: 0 staging, 1 producción
7. Health checks configurados

## Ramas Git
| Rama | Propósito | Deploy |
|------|-----------|--------|
| main | Producción | Auto → Cloud Run prod |
| develop | Staging/QA | Auto → Cloud Run staging |
| feature/* | Features | PR → develop |
| hotfix/* | Correcciones | PR → main |

## Monitoreo
- Sentry para error tracking
- Cloud Monitoring para métricas
- Cloud Logging para logs de aplicación
- Alertas: error rate > 1%, latencia p95 > 2s
```

---

## 8. Definición de Skills

### 8.1 Skill: Supabase RLS

**Archivo:** `.cursor/skills/supabase-rls/SKILL.md`

```markdown
---
description: "Patrones de Row Level Security para Supabase en arquitectura multi-tenant. Usar cuando se creen nuevas tablas, políticas RLS, o queries que involucren aislamiento de datos por empresa."
---

# Skill: Supabase RLS Multi-Tenant

## Cuándo Usar
- Crear una nueva tabla en el schema
- Definir políticas de acceso a datos
- Debuggear problemas de acceso entre empresas
- Optimizar queries con RLS

## Patrón Base
Toda tabla con datos de empresa debe seguir este patrón:

```sql
-- 1. Crear tabla con empresa_id
CREATE TABLE nueva_tabla (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- ... otros campos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

-- 3. Política de aislamiento
CREATE POLICY "empresa_isolation" ON nueva_tabla
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- 4. Índice por empresa_id (performance)
CREATE INDEX idx_nueva_tabla_empresa ON nueva_tabla(empresa_id);
```

## Excepciones
- `planes`: lectura pública (sin RLS de empresa)
- `auth.users`: gestionado por Supabase Auth

## Anti-Patrones
- NUNCA usar service_role para bypass de RLS en el frontend
- NUNCA filtrar por empresa_id solo en el código (debe ser en RLS)
- NUNCA crear tablas sin RLS
```

### 8.2 Skill: XML SRI

**Archivo:** `.cursor/skills/xml-sri/SKILL.md`

```markdown
---
description: "Generación de XML para comprobantes electrónicos del SRI Ecuador conforme a la Ficha Técnica Offline v2.32. Usar cuando se construyan, validen, o debugueen XMLs de facturas, retenciones, notas de crédito, etc."
---

# Skill: XML Comprobantes Electrónicos SRI

## Cuándo Usar
- Generar XML de cualquier tipo de comprobante
- Validar estructura XML contra esquemas XSD
- Construir la clave de acceso de 49 dígitos
- Implementar el algoritmo Módulo 11

## Estructura XML Factura (versión 1.1.0)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>...</razonSocial>
    <ruc>1234567890001</ruc>
    <claveAcceso>[49 dígitos]</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>000000001</secuencial>
    <dirMatriz>...</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>06/02/2026</fechaEmision>
    <!-- ... campos obligatorios -->
  </infoFactura>
  <detalles>
    <detalle><!-- items --></detalle>
  </detalles>
</factura>
```

## Algoritmo Módulo 11
```javascript
function calcularDigitoVerificador(cadena48) {
  const factores = [2, 3, 4, 5, 6, 7];
  let suma = 0;
  let factorIndex = 0;
  
  for (let i = cadena48.length - 1; i >= 0; i--) {
    suma += parseInt(cadena48[i]) * factores[factorIndex];
    factorIndex = (factorIndex + 1) % factores.length;
  }
  
  const residuo = suma % 11;
  let digito = 11 - residuo;
  
  if (digito === 11) digito = 0;
  if (digito === 10) digito = 1;
  
  return digito;
}
```

## Reglas Críticas
- Campos alfanuméricos: SIN espacios entre caracteres
- Decimales: hasta 6 en versión 1.1.0
- Fechas: dd/mm/aaaa
- Secuenciales: SIEMPRE 9 dígitos con ceros
- Consumidor final: tipo 07, identificación 9999999999999
```

### 8.3 Skill: Glass UI

**Archivo:** `.cursor/skills/glass-ui/SKILL.md`

```markdown
---
description: "Sistema de diseño glassmorphism para facturIA. Usar cuando se creen componentes UI, páginas, o layouts con el estilo visual glass de la plataforma."
---

# Skill: Sistema Glass UI facturIA

## Cuándo Usar
- Crear nuevos componentes de interfaz
- Estilizar páginas o secciones
- Implementar variantes de componentes existentes

## Tokens de Diseño
```css
/* Glass base */
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

/* Hover */
background: rgba(255, 255, 255, 0.12);

/* Primary */
color: #6366f1; /* Indigo */

/* Accent (IA) */
color: #06b6d4; /* Cyan */
```

## Componentes Disponibles
Usar los componentes de `src/components/ui/`:
- GlassCard, GlassButton, GlassInput, GlassSelect
- GlassModal, GlassTable, GlassAlert, GlassBadge

## Principios
1. Mobile-first: diseñar desde 320px
2. Contraste: texto blanco (#ffffff) sobre glass oscuro
3. Animaciones sutiles: transiciones de 200-300ms
4. Spacing consistente: múltiplos de 4px (4, 8, 12, 16, 24, 32)
5. Iconos: lucide-react exclusivamente, tamaño 16-24px
```

### 8.4 Skill: Next.js Patterns

**Archivo:** `.cursor/skills/nextjs-patterns/SKILL.md`

```markdown
---
description: "Patrones de desarrollo Next.js 15.5 con App Router para facturIA. Usar cuando se implementen rutas, Server Actions, layouts, o loading states."
---

# Skill: Patrones Next.js 15.5 facturIA

## Cuándo Usar
- Crear nuevas páginas o layouts
- Implementar Server Actions
- Manejar loading/error states
- Configurar metadata y SEO

## Patrones

### Server Action con validación
```javascript
'use server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const schema = z.object({ /* ... */ });

export async function action(prevState, formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    const { data, error } = await supabase
      .from('tabla')
      .insert({ ...parsed.data, empresa_id: empresa.id })
      .select().single();
    if (error) throw error;
    revalidatePath('/ruta');
    return { success: true, data };
  } catch (err) {
    return { error: err.message };
  }
}
```

### Loading State
```javascript
// app/(dashboard)/ruta/loading.js
export default function Loading() {
  return <GlassCard className="animate-pulse">Cargando...</GlassCard>;
}
```

### Error Boundary
```javascript
// app/(dashboard)/ruta/error.js
'use client';
export default function Error({ error, reset }) {
  return (
    <GlassCard>
      <p>Error: {error.message}</p>
      <GlassButton onClick={reset}>Reintentar</GlassButton>
    </GlassCard>
  );
}
```
```

### 8.5 Skill: CI/CD Cloud Run

**Archivo:** `.cursor/skills/ci-cd-cloudrun/SKILL.md`

```markdown
---
description: "Configuración de CI/CD con GitHub Actions para despliegue en Google Cloud Run. Usar cuando se modifiquen pipelines, Dockerfile, o configuración de despliegue."
---

# Skill: CI/CD GitHub Actions → Cloud Run

## Cuándo Usar
- Modificar Dockerfile o docker-compose
- Configurar o debuggear GitHub Actions
- Gestionar secretos y variables de entorno
- Configurar Cloud Run (instancias, memoria, CPU)

## Pipelines
| Workflow | Trigger | Destino |
|----------|---------|---------|
| ci.yml | Pull Request | Solo validación |
| deploy-staging.yml | Push develop | Cloud Run staging |
| deploy-production.yml | Push main | Cloud Run production |

## Dockerfile Best Practices
- Multi-stage: deps → builder → runner
- Puerto: 8080 (obligatorio Cloud Run)
- User: nextjs (no root)
- Output: standalone
- .dockerignore: node_modules, .git, .next, .env*

## Secretos Necesarios
- GCP_SA_KEY: Service Account JSON
- Variables de entorno en Cloud Run Secret Manager
```

---

## 9. Commands (Workflows Invocables)

### 9.1 Comando: /plan

**Archivo:** `.cursor/commands/plan.md`

```markdown
# Comando: /plan

Genera un plan de implementación detallado antes de escribir código.

## Instrucciones
1. Leer el requerimiento del usuario
2. Invocar el agente `planner`
3. Generar plan con:
   - Requerimiento reformulado
   - Fases de implementación
   - Archivos afectados
   - Riesgos identificados
   - Estimación de complejidad
4. ESPERAR aprobación
5. Una vez aprobado, delegar al agente especializado correspondiente
```

### 9.2 Comando: /sri-validate

**Archivo:** `.cursor/commands/sri-validate.md`

```markdown
# Comando: /sri-validate

Valida un XML de comprobante electrónico contra las reglas del SRI.

## Instrucciones
1. Invocar el agente `sri-specialist`
2. Verificar:
   - Estructura XML conforme al XSD
   - Clave de acceso de 49 dígitos válida
   - Dígito verificador Módulo 11 correcto
   - Campos obligatorios presentes
   - Formato de fechas (dd/mm/aaaa)
   - Códigos de catálogos válidos
   - Cálculos de impuestos correctos
3. Reportar errores y advertencias
```

### 9.3 Comando: /glass-component

**Archivo:** `.cursor/commands/glass-component.md`

```markdown
# Comando: /glass-component

Genera un nuevo componente con el sistema de diseño glassmorphism.

## Instrucciones
1. Invocar el agente `frontend-dev`
2. Aplicar el skill `glass-ui`
3. Crear componente en src/components/ui/ o src/components/shared/
4. Incluir:
   - Props con valores por defecto
   - Variantes (si aplica)
   - Responsive design (mobile-first)
   - Accesibilidad (aria-labels, focus)
   - Animaciones con framer-motion
5. El componente debe usar los tokens de diseño glass
```

---

## 10. Estructura Final del Directorio .cursor

```
.cursor/
├── rules/
│   ├── project.mdc              # Reglas globales del proyecto
│   ├── sri-ecuador.mdc          # Normativa SRI
│   └── agents.mdc               # Orquestación de agentes
│
├── agents/
│   ├── planner.md               # Planificador de features
│   ├── backend-dev.md           # Desarrollador backend
│   ├── frontend-dev.md          # Desarrollador frontend
│   ├── sri-specialist.md        # Especialista SRI Ecuador
│   ├── db-architect.md          # Arquitecto de BD
│   ├── qa-tester.md             # Ingeniero QA
│   └── devops-engineer.md       # Ingeniero DevOps
│
├── skills/
│   ├── supabase-rls/
│   │   └── SKILL.md             # Patrones RLS multi-tenant
│   ├── xml-sri/
│   │   └── SKILL.md             # Generación XML SRI
│   ├── glass-ui/
│   │   └── SKILL.md             # Sistema diseño Glass
│   ├── nextjs-patterns/
│   │   └── SKILL.md             # Patrones Next.js 15.5
│   └── ci-cd-cloudrun/
│       └── SKILL.md             # CI/CD Cloud Run
│
└── commands/
    ├── plan.md                  # /plan
    ├── sri-validate.md          # /sri-validate
    └── glass-component.md       # /glass-component
```

---

## 11. Cómo Funciona el Equipo Completo

### Flujo de Ejemplo: "Crear el CRUD de Clientes"

```
Usuario: Necesito implementar el CRUD de clientes con
         validación de RUC/Cédula e importación CSV

  ↓ Se activa rule agents.mdc (feature compleja)

1. [planner] Analiza → genera plan:
   - Fase 1: Schema BD (tabla clientes)
   - Fase 2: Server Actions (CRUD + validación)
   - Fase 3: UI (formulario + tabla + importador CSV)
   - Fase 4: Tests

  ↓ Usuario aprueba

2. [db-architect] + skill supabase-rls:
   - CREATE TABLE clientes con RLS
   - Índices por empresa_id + identificacion
   - Constraint unique (empresa_id, identificacion)

3. [backend-dev] + skill nextjs-patterns:
   - Server Actions: crearCliente, editarCliente,
     eliminarCliente, buscarClientes, importarCSV
   - Validación Zod: RUC (Módulo 11), Cédula (Módulo 10)

4. [frontend-dev] + skill glass-ui:
   - Página /clientes con GlassTable
   - Modal crear/editar con GlassModal + GlassInput
   - Importador CSV con drag & drop
   - Responsive mobile-first

5. [qa-tester]:
   - Tests unitarios: validación RUC, Cédula
   - Test integración: CRUD completo
   - Test E2E: flujo crear → editar → eliminar
```

---

## 12. Configuración Adicional Recomendada

### 12.1 MCP Servers para Cursor

Para potenciar los agentes, se recomienda configurar estos MCP servers:

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "${NEXT_PUBLIC_SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"]
    }
  }
}
```

### 12.2 User Rules Globales (Cursor Settings)

```
- Idioma de comentarios y documentación: español
- Idioma de código (variables, funciones): inglés
- Siempre explicar el "por qué" antes del "cómo"
- Preferir soluciones simples sobre complejas
- Seguir el principio DRY (Don't Repeat Yourself)
- Todo código nuevo debe tener su test correspondiente
```

### 12.3 Plan Mode como Workflow Default

Configurar Cursor para usar siempre Plan Mode:
1. Abrir Settings → Agent
2. Activar "Always plan before coding"
3. Flujo: Research → Clarify → Plan → Build

---

## 13. Resumen Ejecutivo

| Elemento | Cantidad | Propósito |
|---|---|---|
| **Project Rules** | 3 | Gobernanza global del proyecto |
| **Agents** | 7 | Equipo completo de desarrollo especializado |
| **Skills** | 5 | Conocimiento procedimental reutilizable |
| **Commands** | 3 | Workflows invocables con `/` |
| **Fase 1 Entregables** | 8 | Base técnica completa del proyecto |
| **Duración Fase 1** | 3 semanas | 15 días hábiles |

Este plan proporciona una base sólida tanto para el desarrollo técnico de facturIA como para la configuración de un equipo de agentes IA en Cursor que acelere significativamente la productividad del desarrollo, manteniendo la calidad y el cumplimiento normativo del SRI de Ecuador.
