# facturIA — Análisis Pre-Fase 2
## Auditoría de Fase 1 + Diagnóstico de Agentes Cursor + Plan Fase 2

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fecha:** 06 de febrero de 2026  
**Stack:** Next.js 15.5 · React 19 · JavaScript · Supabase · Tailwind 4 · Cloud Run

---

# 1. AUDITORÍA DE FASE 1 — Estado Actual

## 1.1 Checklist de Entregables Completados

Basado en el README del proyecto y la estructura de código existente:

| # | Entregable | Estado | Evidencia |
|---|-----------|--------|-----------|
| 1 | Proyecto Next.js 15.5 configurado | ✅ Completado | `package.json`, `next.config.mjs`, Dockerfile presente |
| 2 | Sistema de diseño Glass/Ethereal | ✅ Completado | 8 componentes en `src/components/ui/` (GlassCard, GlassButton, GlassInput, GlassSelect, GlassModal, GlassTable, GlassAlert, GlassBadge) |
| 3 | Layout dashboard mobile-first | ✅ Completado | Sidebar, Topbar, BottomNav, MobileMenu en `src/components/layout/` |
| 4 | Autenticación Supabase | ✅ Completado | Rutas `(auth)/login`, `(auth)/registro`, `(auth)/recuperar`, clients en `src/lib/supabase/` |
| 5 | Schema BD multi-tenant con RLS | ✅ Completado | Migración `001_initial_schema.sql` en `supabase/migrations/` |
| 6 | Auth Guard + middleware | ✅ Completado | `src/lib/supabase/middleware.js`, rutas protegidas en `(dashboard)/` |
| 7 | CI/CD Pipeline | ✅ Completado | 3 workflows en `.github/workflows/` (ci, staging, production) |
| 8 | Landing page | ✅ Completado | `src/app/page.js` como landing pública |

## 1.2 Estructura de Código Verificada

```
facturia/
├── .github/workflows/          ✅ CI/CD (ci.yml, deploy-staging.yml, deploy-production.yml)
├── .cursor/
│   ├── rules/                  ✅ 3 project rules (.mdc)
│   │   ├── project.mdc
│   │   ├── agents.mdc
│   │   └── sri-ecuador.mdc
│   └── agents/                 ⚠️ Archivos MD presentes pero NO funcionales como subagentes
│       ├── planner.md
│       ├── backend-dev.md
│       ├── frontend-dev.md
│       ├── sri-specialist.md
│       ├── db-architect.md
│       ├── qa-tester.md
│       └── devops-engineer.md
├── Dockerfile                  ✅ Multi-stage build para Cloud Run
├── src/
│   ├── app/
│   │   ├── layout.js           ✅ Root layout con Inter font + Toaster
│   │   ├── page.js             ✅ Landing
│   │   ├── (auth)/             ✅ Login, registro, recuperar
│   │   └── (dashboard)/        ✅ Layout dashboard + rutas placeholder
│   ├── components/
│   │   ├── ui/                 ✅ 8 componentes Glass
│   │   ├── layout/             ✅ Sidebar, Topbar, BottomNav, MobileMenu
│   │   └── shared/             ✅ Logo, LoadingSpinner, EmptyState
│   ├── lib/
│   │   ├── supabase/           ✅ client.js, server.js, middleware.js
│   │   ├── validations/        ✅ auth.js, empresa.js, common.js
│   │   └── utils/              ✅ constants.js, formatters.js, sri-catalogs.js
│   ├── stores/                 ✅ useAuthStore.js, useEmpresaStore.js, useUIStore.js
│   └── styles/globals.css      ✅ Tokens Glass + gradiente oscuro
├── supabase/migrations/        ✅ Schema inicial
└── tests/                      ✅ Estructura (unit/, integration/, e2e/)
```

## 1.3 Tokens de Diseño Actuales (Fase 1)

El sistema actual usa colores y gradientes que **deben modificarse** para la Fase 2:

```css
/* ESTADO ACTUAL — Fase 1 (a cambiar) */
--color-bg-primary: #0f0c29;       /* Fondo oscuro azul-púrpura */
--color-bg-secondary: #302b63;     /* Gradiente secundario */
--color-bg-tertiary: #24243e;      /* Gradiente terciario */
--color-primary: #6366f1;          /* Indigo (acento) */
--color-primary-light: #818cf8;    /* Indigo claro */
--color-accent: #06b6d4;           /* Cyan (acento secundario) */
--color-accent-light: #22d3ee;     /* Cyan claro */

body {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}
```

---

# 2. DIAGNÓSTICO: POR QUÉ NO SE IMPLEMENTARON LOS AGENTES Y SUBAGENTES EN CURSOR

## 2.1 Cronología del Problema

| Fecha | Evento |
|-------|--------|
| 22 ene 2026 | Cursor 2.4 lanza SubAgentes oficialmente |
| 06 feb 2026 | Se crea el plan de Fase 1 con 7 agentes, 5 skills, 3 commands |
| 06 feb 2026 | Se completa la Fase 1... pero sin agentes funcionales |

**Conclusión:** Los SubAgentes de Cursor tenían apenas **2 semanas de existencia** cuando se elaboró el plan. La documentación era incompleta y el ecosistema aún no estaba maduro.

## 2.2 Causas Raíz Identificadas

### Causa 1: Formato Incorrecto de los Archivos de Agentes

**Lo que se planificó:**
```markdown
<!-- .cursor/agents/planner.md -->
# Agente: Planner — Planificador de Features

## Rol
Eres el arquitecto de soluciones de facturIA...

## Instrucciones
1. Restablecer el requerimiento...
```

**Lo que Cursor 2.4 realmente requiere:**
```markdown
<!-- .cursor/agents/planner.md -->
---
name: planner
description: "Planificador de features. Analiza requerimientos, identifica riesgos y produce planes de implementación antes de escribir código."
tools: Read, Grep, Glob
---

# Planner — Planificador de Features

## Proceso
1. Restablecer el requerimiento en propias palabras...
```

**Problema:** Los archivos creados son Markdown plano sin el **frontmatter YAML** que Cursor necesita para registrar el subagente. Sin `name`, `description` y `tools` en el frontmatter, Cursor simplemente los ignora.

### Causa 2: Confusión entre "Roles/Personas" y SubAgentes Reales

El plan define 7 "agentes" que son en realidad **personas de instrucción** (prompts de rol), no subagentes ejecutables. En Cursor 2.4, un subagente:

- Es **invocado automáticamente** por el agente principal cuando detecta una tarea que encaja con su `description`.
- Corre en **paralelo** con su propio contexto aislado.
- Tiene **acceso limitado a herramientas** (Read, Grep, Glob, Edit, Terminal, etc.).
- **Retorna resultados** al agente padre.

Los archivos del plan son instrucciones de prompt, no definiciones de agentes ejecutables.

### Causa 3: Los Skills No Tenían el Formato SKILL.md Correcto

**Lo que se planificó:**
```
.cursor/skills/
├── supabase-rls/SKILL.md
├── xml-sri/SKILL.md
├── glass-ui/SKILL.md
├── nextjs-patterns/SKILL.md
└── ci-cd-cloudrun/SKILL.md
```

**Lo que Cursor 2.4 requiere:**
- Los Skills necesitan un frontmatter con `description` mínimo.
- Pueden incluir **scripts ejecutables** (bash, Python) que el agente puede correr.
- Se descubren dinámicamente cuando el agente determina que son relevantes para la tarea.

**Formato correcto:**
```markdown
---
description: "Patrones de Row Level Security para Supabase multi-tenant. Usar cuando se creen o modifiquen tablas, políticas RLS o migraciones."
---

# Skill: Supabase RLS Multi-Tenant

## Cuándo Usar
- Crear nueva tabla con aislamiento por empresa
- Escribir políticas RLS
...
```

Los Skills planificados tenían descripciones dentro del Markdown pero **no en el frontmatter YAML**, por lo que Cursor no los descubre automáticamente.

### Causa 4: Los Commands Usaban Formato Incorrecto

**Lo planificado:**
```markdown
<!-- .cursor/commands/plan.md -->
# Comando: /plan

Genera un plan de implementación detallado...
```

**Lo correcto en Cursor 2.4:**
- Los commands en `.cursor/commands/` son **Markdown plano** (sin frontmatter) — esto SÍ era correcto en el plan.
- Se invocan con `/` en el chat.
- Sin embargo, la referencia a "invocar agentes" dentro del command no funciona porque los agentes no estaban bien definidos.

### Causa 5: La Orquestación Planificada No Existe en Cursor

El plan describe un flujo de orquestación tipo "equipo":

```
Usuario pide feature → [planner] analiza → aprueba →
[db-architect] crea tablas → [backend-dev] server actions →
[frontend-dev] UI → [qa-tester] tests
```

**Esto no existe nativamente en Cursor.** Los subagentes:
- Son invocados por el agente principal, no entre ellos.
- No tienen un "director" que orqueste la secuencia.
- Corren tareas aisladas en paralelo, no en cadena secuencial.

El patrón más cercano es **chaining** (cadena) donde el usuario le dice al agente principal: "Primero usa el repo-scout para encontrar archivos, luego implementa el cambio, luego usa el verifier para confirmar."

## 2.3 Qué SÍ Funcionaba del Plan Original

| Elemento | Estado | Nota |
|----------|--------|------|
| `.cursor/rules/*.mdc` | ✅ Correcto | El formato `.mdc` con frontmatter es correcto |
| Ubicación `.cursor/agents/` | ✅ Correcto | La ruta es la correcta |
| Ubicación `.cursor/skills/` | ✅ Correcto | La ruta es la correcta |
| Ubicación `.cursor/commands/` | ✅ Correcto | La ruta es la correcta |
| MCP Servers (mcp.json) | ✅ Correcto | Supabase MCP y Playwright MCP son válidos |
| Contenido conceptual de agentes | ✅ Valioso | Las instrucciones de cada rol son útiles como contexto |

## 2.4 Plan de Corrección de Agentes (Implementar en Fase 2)

Para que los agentes funcionen realmente en Cursor 2.4+, se necesita:

**Reducir de 7 agentes a 4 subagentes enfocados:**

| SubAgente | Propósito | Tools |
|-----------|-----------|-------|
| `repo-scout` | Explorar codebase, encontrar archivos relevantes, reportar estructura | Read, Grep, Glob |
| `sri-validator` | Validar XML, catálogos SRI, cálculos tributarios, clave de acceso | Read, Grep, Terminal |
| `test-writer` | Generar tests unitarios, integración y E2E siguiendo patrones existentes | Read, Grep, Glob, Edit, Terminal |
| `db-migrator` | Crear migraciones SQL, políticas RLS, verificar schema | Read, Grep, Terminal |

**Convertir 3 agentes restantes en Skills:**

| Skill | Antes era Agente | Propósito |
|-------|------------------|-----------|
| `glass-ui/SKILL.md` | frontend-dev | Sistema de diseño Glass + Ethereal B&W |
| `nextjs-patterns/SKILL.md` | backend-dev | Server Actions, Server Components, Zustand |
| `ci-cd-cloudrun/SKILL.md` | devops-engineer | Docker, GitHub Actions, Cloud Run |

**Razón:** Los Skills son mejores que subagentes para conocimiento declarativo "cómo hacer X". Los subagentes son para tareas concretas que requieren exploración y ejecución independiente.

---

# 3. CAMBIO DE INTERFAZ: GLASS + ETHEREAL EN BLANCO Y NEGRO

## 3.1 Concepto: Ethereal Glass Monochrome

La nueva paleta elimina todos los colores (indigo, cyan, púrpura) y adopta una estética **monochrome minimalista** que combina:

- **Glass:** Transparencias, blur, bordes sutiles.
- **Ethereal:** Gradientes suaves, luminosidad etérea, sensación de profundidad.
- **Monocromo:** Exclusivamente blanco, negro y escalas de grises.

## 3.2 Nuevos Tokens de Diseño

```css
/* src/styles/globals.css — FASE 2: Ethereal Glass Monochrome */
@import "tailwindcss";

@theme {
  /* ══════════════════════════════════════════════
     ETHEREAL GLASS MONOCHROME — Solo B&N
     ══════════════════════════════════════════════ */

  /* Fondos base */
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #111111;
  --color-bg-tertiary: #1a1a1a;
  --color-bg-elevated: #0f0f0f;

  /* Superficies Glass */
  --color-glass: rgba(255, 255, 255, 0.04);
  --color-glass-hover: rgba(255, 255, 255, 0.08);
  --color-glass-active: rgba(255, 255, 255, 0.12);
  --color-glass-border: rgba(255, 255, 255, 0.10);
  --color-glass-border-hover: rgba(255, 255, 255, 0.18);

  /* Texto */
  --color-text-primary: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.60);
  --color-text-tertiary: rgba(255, 255, 255, 0.40);
  --color-text-disabled: rgba(255, 255, 255, 0.20);

  /* Acento principal (blanco puro para acción) */
  --color-primary: #ffffff;
  --color-primary-hover: rgba(255, 255, 255, 0.90);
  --color-primary-muted: rgba(255, 255, 255, 0.15);

  /* Ethereal glow (resplandor sutil) */
  --color-glow: rgba(255, 255, 255, 0.06);
  --color-glow-strong: rgba(255, 255, 255, 0.12);

  /* Estados SRI (EXCEPCIÓN: los estados mantienen color semántico) */
  --color-status-creado: rgba(255, 255, 255, 0.40);
  --color-status-firmado: rgba(255, 255, 255, 0.55);
  --color-status-enviado: rgba(255, 255, 255, 0.70);
  --color-status-autorizado: rgba(255, 255, 255, 0.95);
  --color-status-no-autorizado: rgba(255, 255, 255, 0.30);
  --color-status-anulado: rgba(255, 255, 255, 0.15);

  /* Feedback (mínimo color, basado en luminosidad) */
  --color-success: rgba(255, 255, 255, 0.90);
  --color-warning: rgba(255, 255, 255, 0.65);
  --color-error: rgba(255, 255, 255, 0.45);
  --color-info: rgba(255, 255, 255, 0.55);

  /* Separadores */
  --color-divider: rgba(255, 255, 255, 0.06);
  --color-divider-strong: rgba(255, 255, 255, 0.12);

  /* Sombras Ethereal */
  --shadow-glass: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-glass-lg: 0 8px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 20px rgba(255, 255, 255, 0.03);
  --shadow-inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  /* Blur */
  --blur-glass: 16px;
  --blur-glass-heavy: 24px;

  /* Radios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
}

body {
  background: #0a0a0a;
  min-height: 100vh;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'Inter', system-ui, sans-serif;
}

/* Efecto ethereal sutil en el fondo */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.03), transparent),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255, 255, 255, 0.02), transparent);
  pointer-events: none;
  z-index: 0;
}
```

## 3.3 Ejemplo de GlassCard Actualizado

```jsx
// Antes (Fase 1) — colores
<div className="bg-white/8 backdrop-blur-md border border-white/15 rounded-xl">

// Después (Fase 2) — Ethereal Glass Monochrome
<div className="bg-[var(--color-glass)] backdrop-blur-[var(--blur-glass)]
               border border-[var(--color-glass-border)]
               rounded-[var(--radius-lg)]
               shadow-[var(--shadow-glass)]
               hover:bg-[var(--color-glass-hover)]
               hover:border-[var(--color-glass-border-hover)]
               hover:shadow-[var(--shadow-glow)]
               transition-all duration-300">
```

## 3.4 Impacto en Componentes Existentes

| Componente | Cambio Requerido |
|------------|------------------|
| `GlassCard` | Tokens actualizados, agregar `shadow-glow` en hover |
| `GlassButton` | Eliminar variantes de color, solo blanco/gris/ghost |
| `GlassInput` | Border sutil, focus con glow blanco |
| `GlassSelect` | Dropdown monochrome |
| `GlassModal` | Overlay más oscuro, borde glow |
| `GlassTable` | Header sutil, hover rows con glass-hover |
| `GlassAlert` | Sin colores semánticos, usar íconos + opacidad |
| `GlassBadge` | Solo variantes de opacidad (claro/medio/fuerte) |
| `Sidebar` | Gradiente eliminado, fondo glass puro |
| `Topbar` | Border bottom sutil, sin color |
| `Landing page` | Re-hacer con nueva paleta monochrome |

---

# 4. FASE 2: ONBOARDING IA + CATÁLOGOS — Plan Detallado

## 4.1 Alcance (Semanas 4-5)

| # | Módulo | Descripción | Prioridad |
|---|--------|-------------|-----------|
| 1 | Actualización UI B&W | Migrar tokens y componentes a Ethereal Glass Monochrome | P0 |
| 2 | Corrección Agentes Cursor | Reformatear subagentes, skills y commands con frontmatter correcto | P0 |
| 3 | Configuración Empresa | CRUD empresa + establecimiento + punto de emisión | P0 |
| 4 | Upload certificado .p12 | Subida, validación y almacenamiento cifrado AES-256 | P0 |
| 5 | Onboarding IA | Chat guiado con Gemini para configurar empresa | P1 |
| 6 | CRUD Clientes | Alta, edición, búsqueda, importación CSV, validación cédula/RUC | P1 |
| 7 | CRUD Productos | Alta con configuración IVA/ICE, categorías, importación CSV | P1 |

## 4.2 Semana 4: Configuración Empresa + Certificado + Migración UI

### Día 1: Migración Tokens + Componentes a Ethereal Glass B&W

**Archivos a modificar:**
```
src/styles/globals.css              → Nuevos tokens monochrome
src/components/ui/GlassCard.jsx     → Tokens actualizados
src/components/ui/GlassButton.jsx   → Solo variantes B&W
src/components/ui/GlassInput.jsx    → Focus glow blanco
src/components/ui/GlassSelect.jsx   → Dropdown monochrome
src/components/ui/GlassModal.jsx    → Overlay + glow
src/components/ui/GlassTable.jsx    → Headers sutiles
src/components/ui/GlassAlert.jsx    → Sin colores semánticos
src/components/ui/GlassBadge.jsx    → Solo opacidades
src/components/layout/Sidebar.jsx   → Sin gradiente color
src/components/layout/Topbar.jsx    → Border sutil
src/app/page.js                     → Landing monochrome
```

### Día 2: Corrección de Agentes Cursor

**Archivos a crear/reformatear:**

```
.cursor/agents/repo-scout.md        → NUEVO (con frontmatter YAML)
.cursor/agents/sri-validator.md     → REFORMATEAR desde sri-specialist.md
.cursor/agents/test-writer.md       → REFORMATEAR desde qa-tester.md
.cursor/agents/db-migrator.md       → REFORMATEAR desde db-architect.md

.cursor/skills/supabase-rls/SKILL.md    → AGREGAR frontmatter
.cursor/skills/xml-sri/SKILL.md         → AGREGAR frontmatter
.cursor/skills/glass-ui/SKILL.md        → ACTUALIZAR a Ethereal Glass B&W
.cursor/skills/nextjs-patterns/SKILL.md → AGREGAR frontmatter
.cursor/skills/ci-cd-cloudrun/SKILL.md  → AGREGAR frontmatter

.cursor/agents/planner.md          → ELIMINAR (usar skill + rules)
.cursor/agents/backend-dev.md      → ELIMINAR (convertir a skill)
.cursor/agents/frontend-dev.md     → ELIMINAR (convertir a skill)
.cursor/agents/devops-engineer.md  → ELIMINAR (convertir a skill)
```

### Día 3-4: Schema BD — Tablas Empresa + Establecimiento + Punto Emisión

**Migración:** `supabase/migrations/002_empresa_config.sql`

```sql
-- ═══════════════════════════════════════════
-- TABLA: empresas (ya existe en 001, pero verificar campos)
-- ═══════════════════════════════════════════

-- Agregar campos faltantes si no existen
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS
  logo_url TEXT,
  email_notificaciones TEXT,
  telefono TEXT,
  direccion_matriz TEXT NOT NULL DEFAULT '',
  obligado_contabilidad BOOLEAN NOT NULL DEFAULT false,
  contribuyente_especial TEXT,  -- Nro resolución si aplica
  agente_retencion BOOLEAN NOT NULL DEFAULT false,
  regimen TEXT NOT NULL DEFAULT 'GENERAL'
    CHECK (regimen IN ('GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_NEGOCIO_POPULAR')),
  ambiente_sri INTEGER NOT NULL DEFAULT 1
    CHECK (ambiente_sri IN (1, 2)),  -- 1=Pruebas, 2=Producción
  onboarding_completado BOOLEAN NOT NULL DEFAULT false,
  onboarding_paso INTEGER NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════
-- TABLA: establecimientos
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS establecimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'),  -- 001, 002, etc.
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);

-- RLS
ALTER TABLE establecimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON establecimientos
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════
-- TABLA: puntos_emision
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS puntos_emision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL CHECK (codigo ~ '^\d{3}$'),  -- 001, 002, etc.
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(establecimiento_id, codigo)
);

-- RLS
ALTER TABLE puntos_emision ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON puntos_emision
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════
-- TABLA: certificados_digitales
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS certificados_digitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,           -- Ruta en Supabase Storage
  password_cifrado TEXT NOT NULL,       -- AES-256 encrypted
  propietario TEXT,                     -- CN del certificado
  emisor TEXT,                          -- Issuer
  serial TEXT,
  valido_desde TIMESTAMPTZ,
  valido_hasta TIMESTAMPTZ,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, activo) WHERE (activo = true)  -- Solo 1 cert activo por empresa
);

-- RLS
ALTER TABLE certificados_digitales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON certificados_digitales
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- ═══════════════════════════════════════════
-- TABLA: secuenciales
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS secuenciales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  punto_emision_id UUID NOT NULL REFERENCES puntos_emision(id),
  tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('01','04','05','06','07','08')),
  ultimo_secuencial INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, establecimiento_id, punto_emision_id, tipo_comprobante)
);

-- RLS
ALTER TABLE secuenciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON secuenciales
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

-- Índices
CREATE INDEX idx_establecimientos_empresa ON establecimientos(empresa_id);
CREATE INDEX idx_puntos_emision_empresa ON puntos_emision(empresa_id);
CREATE INDEX idx_certificados_empresa ON certificados_digitales(empresa_id);
CREATE INDEX idx_secuenciales_empresa ON secuenciales(empresa_id);
```

### Día 5: Server Actions — Empresa + Establecimiento + Punto Emisión

**Archivos a crear:**
```
src/app/(dashboard)/configuracion/
├── page.js                          → Vista principal config
├── empresa/
│   ├── page.js                      → Formulario empresa
│   └── actions.js                   → Server Actions empresa
├── establecimientos/
│   ├── page.js                      → Lista + CRUD establecimientos
│   └── actions.js                   → Server Actions establecimientos
├── puntos-emision/
│   ├── page.js                      → Lista + CRUD puntos emisión
│   └── actions.js                   → Server Actions puntos emisión
└── certificado/
    ├── page.js                      → Upload + estado certificado
    └── actions.js                   → Server Actions certificado
```

**Validaciones Zod para empresa:**
```
src/lib/validations/empresa.js       → Schema Zod (RUC mod11, campos obligatorios)
src/lib/validations/establecimiento.js → Schema Zod (código 3 dígitos)
src/lib/validations/certificado.js   → Schema Zod (archivo .p12, password)
```

### Día 6-7: Upload y Validación de Certificado .p12

**Flujo:**
1. Usuario sube archivo `.p12` + ingresa contraseña.
2. Server Action valida que sea un PKCS#12 válido con la contraseña.
3. Extrae metadatos: propietario (CN), emisor, serial, fechas de validez.
4. Cifra la contraseña con AES-256 usando `ENCRYPTION_KEY`.
5. Sube el .p12 a Supabase Storage en bucket `certificados/{empresa_id}/`.
6. Guarda registro en tabla `certificados_digitales`.
7. Alerta si el certificado vence en menos de 30 días.

**Archivos a crear:**
```
src/lib/sri/certificate-parser.js    → Parseo .p12 con node:crypto
src/lib/crypto/aes.js                → Cifrado/descifrado AES-256
```

## 4.3 Semana 5: Onboarding IA + CRUD Catálogos

### Día 8-9: Onboarding IA con Gemini

**Flujo del chat guiado:**
```
Paso 0: Bienvenida
  IA: "¡Hola! Soy el asistente de facturIA. Vamos a configurar
       tu empresa para que puedas empezar a facturar. ¿Cuál
       es el RUC de tu empresa?"

Paso 1: RUC → IA valida Módulo 11, si es válido pregunta razón social
Paso 2: Razón Social + Nombre Comercial
Paso 3: Dirección Matriz
Paso 4: ¿Obligado a llevar contabilidad?
Paso 5: Régimen: General, RIMPE Emprendedor, RIMPE Negocio Popular
Paso 6: ¿Contribuyente especial? (Nro resolución)
Paso 7: ¿Agente de retención?
Paso 8: Establecimiento principal (código 001 + dirección)
Paso 9: Punto de emisión principal (código 001)
Paso 10: Upload certificado .p12
Paso 11: Resumen → IA muestra todo, usuario confirma
Paso 12: IA guarda todo en BD → marca onboarding_completado = true
```

**Archivos a crear:**
```
src/app/(dashboard)/onboarding/
├── page.js                          → Chat UI onboarding
├── actions.js                       → Server Actions del flujo
└── components/
    ├── OnboardingChat.jsx           → Componente chat IA
    ├── OnboardingMessage.jsx        → Burbuja de mensaje
    ├── OnboardingInput.jsx          → Input del usuario
    └── OnboardingProgress.jsx       → Indicador de pasos

src/lib/ia/
├── gemini-client.js                 → Cliente Google Gemini
├── onboarding-prompts.js            → System prompts del onboarding
└── onboarding-flow.js               → Lógica de flujo paso a paso

src/app/api/ia/
└── onboarding/route.js              → API route streaming Gemini
```

**Integración Gemini:**
- Modelo: `gemini-2.0-flash` (rápido, económico para chat guiado).
- El system prompt contiene las reglas de validación del SRI.
- La IA valida en tiempo real: RUC (Módulo 11), formato de códigos, etc.
- Streaming response para UX fluida.

### Día 10-11: CRUD Clientes

**Migración:** `supabase/migrations/003_clientes_productos.sql`

```sql
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_identificacion TEXT NOT NULL CHECK (tipo_identificacion IN ('04','05','06','07','08')),
  identificacion TEXT NOT NULL,
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  email TEXT,
  telefono TEXT,
  direccion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, identificacion)
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON clientes
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_identificacion ON clientes(empresa_id, identificacion);
CREATE INDEX idx_clientes_razon_social ON clientes(empresa_id, razon_social);
```

**Archivos a crear:**
```
src/app/(dashboard)/clientes/
├── page.js                          → Lista con GlassTable + filtros
├── actions.js                       → CRUD Server Actions
├── nuevo/page.js                    → Formulario crear
├── [id]/page.js                     → Formulario editar
└── importar/page.js                 → Importador CSV

src/lib/validations/cliente.js       → Zod schema con validación RUC/Cédula
src/lib/validators/
├── ruc.js                           → Validador RUC Módulo 11
├── cedula.js                        → Validador Cédula Módulo 10
└── index.js                         → Exports centralizados
```

**Funcionalidades:**
- Tabla paginada con búsqueda por razón social, identificación.
- Filtros: tipo de identificación, activo/inactivo.
- Validación en tiempo real de RUC (Módulo 11) y Cédula (Módulo 10).
- Importación masiva CSV con validación por fila.
- Exportación a CSV.

### Día 12-13: CRUD Productos

```sql
-- En 003_clientes_productos.sql (continuación)
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo_principal TEXT NOT NULL,
  codigo_auxiliar TEXT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_unitario DECIMAL(14,6) NOT NULL DEFAULT 0,
  tipo_iva TEXT NOT NULL DEFAULT '2'
    CHECK (tipo_iva IN ('0','2','3','4','5','6','7','8','10')),
  tiene_ice BOOLEAN NOT NULL DEFAULT false,
  codigo_ice TEXT,
  valor_ice DECIMAL(14,6),
  categoria TEXT,
  unidad_medida TEXT DEFAULT 'unidad',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, codigo_principal)
);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aislamiento por empresa" ON productos
  USING (empresa_id = (SELECT empresa_id FROM perfiles WHERE user_id = auth.uid()));

CREATE INDEX idx_productos_empresa ON productos(empresa_id);
CREATE INDEX idx_productos_codigo ON productos(empresa_id, codigo_principal);
CREATE INDEX idx_productos_nombre ON productos(empresa_id, nombre);
```

**Archivos a crear:**
```
src/app/(dashboard)/productos/
├── page.js                          → Lista con GlassTable + filtros
├── actions.js                       → CRUD Server Actions
├── nuevo/page.js                    → Formulario crear con config IVA/ICE
├── [id]/page.js                     → Formulario editar
└── importar/page.js                 → Importador CSV

src/lib/validations/producto.js      → Zod schema con tarifas IVA válidas
```

**Funcionalidades:**
- Tabla con búsqueda por nombre, código.
- Selector de tarifa IVA (0%, 5%, 12%, 13%, 14%, 15%, No Objeto, Exento).
- Configuración ICE opcional con código y valor.
- Importación masiva CSV.
- Categorías personalizables.

### Día 14-15: Testing + QA + Deployment

**Tests a crear:**
```
tests/unit/
├── validators/
│   ├── ruc.test.js                  → Módulo 11 (RUC naturales, jurídicas, públicas)
│   ├── cedula.test.js               → Módulo 10
│   └── empresa.test.js              → Validación schema empresa
├── crypto/
│   └── aes.test.js                  → Cifrado/descifrado AES-256
└── formatters/
    └── sri-catalogs.test.js         → Catálogos SRI correctos

tests/integration/
├── empresa.test.js                  → CRUD empresa completo con RLS
├── clientes.test.js                 → CRUD clientes + validación
└── productos.test.js                → CRUD productos + IVA/ICE

tests/e2e/
├── onboarding.spec.js               → Flujo completo onboarding IA
└── catalogos.spec.js                → Crear cliente → crear producto
```

---

# 5. RESUMEN EJECUTIVO

## 5.1 Entregables Fase 2

| # | Entregable | Criterio de Aceptación |
|---|-----------|------------------------|
| 1 | UI Ethereal Glass B&W | Todos los componentes migrados, sin ningún color, solo B&N |
| 2 | Agentes Cursor funcionales | 4 subagentes con frontmatter, 5 skills con frontmatter, commands operativos |
| 3 | Config empresa completa | CRUD empresa, establecimientos, puntos emisión con RLS |
| 4 | Certificado .p12 | Upload, validación, cifrado AES-256, metadata extraída |
| 5 | Onboarding IA | Chat Gemini funcional, 12 pasos, datos guardados en BD |
| 6 | CRUD Clientes | Alta, edición, búsqueda, CSV, validación RUC/Cédula |
| 7 | CRUD Productos | Alta con IVA/ICE, categorías, CSV import |
| 8 | Tests | Unit + Integration + E2E para todos los módulos |

## 5.2 Riesgos Identificados

| Riesgo | Nivel | Mitigación |
|--------|-------|------------|
| Gemini API rate limits en onboarding | MEDIO | Implementar retry con backoff, cachear respuestas comunes |
| Parsing .p12 en Node.js sin OpenSSL nativo | MEDIO | Usar `node-forge` como fallback si `node:crypto` falla |
| SubAgentes Cursor aún inestables (v2.4 reciente) | BAJO | Mantener Skills como backup, no depender 100% de subagentes |
| Migración UI B&W rompe Landing page | BAJO | La landing se rehace completa con nueva paleta |

## 5.3 Dependencias Críticas

```
Fase 2 depende de:
├── ✅ Fase 1 completada (auth, BD, CI/CD, componentes base)
├── 🔑 GEMINI_API_KEY configurada en env
├── 🔑 ENCRYPTION_KEY de 32 caracteres para AES-256
├── 🔑 Supabase Storage bucket "certificados" creado
└── 🔑 Cursor 2.4+ instalado para agentes funcionales
```

## 5.4 Cronograma

| Día | Tarea | Módulo |
|-----|-------|--------|
| 1 | Migración tokens + componentes B&W | UI |
| 2 | Corrección agentes/skills/commands Cursor | DevEx |
| 3-4 | Schema BD empresa + establecimiento + punto emisión | Backend |
| 5 | Server Actions config empresa | Backend |
| 6-7 | Upload .p12 + cifrado + validación | Backend |
| 8-9 | Onboarding IA con Gemini | IA + Frontend |
| 10-11 | CRUD Clientes + validadores RUC/Cédula | Full Stack |
| 12-13 | CRUD Productos + config IVA/ICE | Full Stack |
| 14-15 | Tests + QA + Deploy staging | QA |
