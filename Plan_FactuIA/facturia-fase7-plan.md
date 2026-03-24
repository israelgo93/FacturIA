# facturIA — Fase 7: Chat IA Premium, Completación F6 y Preparación para Producción
## Plan de Implementación Detallado

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 7 — Chat IA Premium + Completación F6 + Pre-Producción (14 días hábiles)  
**Stack verificado:** Next.js 16 · React 19 · JavaScript · Supabase · Tailwind 4 · AWS App Runner  
**IA:** Google Gemini 3 Flash (`@ai-sdk/google`) + Vercel AI SDK 3.x (v6 UIMessage)  
**Fecha:** Marzo 2026

---

# 0. AUDITORÍA PRE-FASE 7 — Verificación Fase 6

## 0.1 Estado Real de Issues Linear (Proyecto FacturIA)

| Issue | Título | Estado Linear | Estado Real Código | Observación |
|-------|--------|:-------------:|:------------------:|-------------|
| DAT-172 | Seguridad + Migración BD 012 | ✅ Done | ✅ Aplicada | 3 tablas, 4 funciones, RLS, seed trial verificados |
| DAT-171 | Unificación UI/UX | ⬜ Todo | ⚠️ Parcial | StatusBadge mencionado como "ya no aplicaba", GlassBadge no eliminado formalmente |
| DAT-173 | Dashboard Analítico Recharts | ⬜ Todo | ⚠️ Sin verificar | Slack dice implementado por Cursor pero Linear está en Todo |
| DAT-174 | Motor Suscripciones | ⬜ Todo | ⚠️ Sin verificar | Misma discrepancia Slack vs Linear |
| DAT-175 | Notificaciones Motor + UI | ⬜ Todo | ⚠️ Sin verificar | Misma discrepancia |
| DAT-176 | Tests Vitest + SRI 03-07 | ⬜ Todo | ⚠️ Sin verificar | Misma discrepancia |
| DAT-179 | Dashboard (duplicado) | Duplicate | N/A | Correctamente marcado |
| DAT-182 | Tests (duplicado) | Duplicate | N/A | Correctamente marcado |

**⚠️ HALLAZGO CRÍTICO:** El mensaje de Slack del 23/Mar (21:24) enviado por Cursor afirma "Fase 6 Implementada" con todos los entregables completados, pero los 4 issues principales (DAT-171, 173, 174, 175, 176) siguen en estado **"Todo"** en Linear. Es necesario verificar el código real antes de implementar Fase 7.

## 0.2 Estado de Base de Datos (Verificado via Supabase MCP)

| Elemento | Estado | Detalle |
|----------|:------:|---------|
| Migraciones | ✅ | 20 migraciones aplicadas (última: `fix_column_names_fase6_functions`) |
| Tablas | ✅ | 26 tablas con RLS habilitado |
| `suscripciones` | ✅ | 1 registro: DATATENSEI trial/professional, 14 días |
| `notificaciones` | ✅ | 0 registros (tabla creada, sin datos) |
| `dashboard_cache` | ✅ | 1 registro: marzo 2026, $929.75 ventas, 19 comprobantes |
| `planes` | ✅ | 3 planes: starter/$9.99, professional/$24.99, enterprise/$49.99 |
| Funciones | ✅ | 8 funciones, todas con `search_path = public` |
| Vistas | ✅ | `v_comprobantes_resumen` + `v_dashboard_kpis` |
| `verificar_limite_plan()` | ✅ | Retorna {permitido, usados, limite, plan, features} |
| `calcular_metricas_dashboard()` | ✅ | KPIs con variación %, top clientes, distribución |

## 0.3 Datos Reales de Comprobantes (Verificados)

| Período | Tipo | Estado | Cantidad | Ventas | IVA |
|---------|------|--------|----------|--------|-----|
| Mar 2026 | Factura 01 | AUT | 9 | $929.75 | $114.75 |
| Mar 2026 | Factura 01 | PPR | 6 | $184.00 | $24.00 |
| Mar 2026 | Factura 01 | voided | 2 | $69.00 | $9.00 |
| Mar 2026 | Factura 01 | DEV | 2 | $57.50 | $7.50 |
| Feb 2026 | Factura 01 | AUT | 2 | $1,176.25 | $151.25 |
| Feb 2026 | NC 04 | AUT | 1 | $575.00 | $75.00 |
| Feb 2026 | ND 05 | AUT | 1 | $28.75 | $3.75 |
| Feb 2026 | Guía 06 | AUT | 1 | $0.00 | $0.00 |

## 0.4 Pendientes de Seguridad

| Alerta | Estado | Acción |
|--------|:------:|--------|
| `function_search_path_mutable` | ✅ Resuelto | Todas las funciones nuevas F6 tienen `SET search_path = public` |
| `auth_leaked_password_protection` | ❌ PENDIENTE | Requiere acción manual: Supabase Dashboard → Auth → Settings |

---

# 1. BUG CRÍTICO IDENTIFICADO — Chat IA Retorna $0.00

## 1.1 Evidencia

La captura de pantalla del chat "Asistente Tributario IA" muestra:
- Pregunta: "¿Cuántas facturas emití este mes?"
- Respuesta: "total de 0 facturas autorizadas... valor total de ventas $0.00... IVA $0.00"
- Pregunta: "¿Y en febrero?"
- Respuesta: "total de ventas $0.00 y un IVA $0.00... facturas emitidas fue de 0"

**Los datos reales son:** 9 facturas AUT, $929.75 ventas (marzo) y 2 facturas AUT, $1,176.25 ventas (febrero).

## 1.2 Causa Raíz (Análisis del Código)

**Archivo:** `src/app/(dashboard)/reportes/analisis/page.js`

```javascript
// ❌ BUG: DefaultChatTransport captura empresaId en el render inicial
// cuando empresa es null (useState(null))
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/reportes/chat',
    body: { empresaId: empresa?.id },  // ← empresa es null al inicio
  }),
});

// El useEffect que carga la empresa se ejecuta DESPUÉS del primer render
useEffect(() => {
  obtenerContextoEmpresa().then((result) => {
    if (result.data) setEmpresa(result.data);
  });
}, []);
```

**Flujo del bug:**
1. Componente se monta → `empresa = null` → `useChat` crea transport con `empresaId: undefined`
2. `useEffect` se ejecuta → carga empresa → `setEmpresa(data)` → re-render
3. Nuevo render crea NUEVO `DefaultChatTransport` con `empresaId` correcto
4. PERO `useChat` puede mantener referencia al transport original (closure stale)
5. Al enviar mensaje → `empresaId: undefined` → API route salta todos los `if (empresaId)` → datos = $0.00

**Archivo:** `src/app/api/reportes/chat/route.js`

```javascript
// En la API route, cuando empresaId es undefined:
let empresa = null;
if (empresaId) { /* SKIP - empresaId is undefined */ }

let kpis = {};
if (empresaId) { /* SKIP */ }

let contexto = {};
if (empresaId) { /* SKIP */ }

// Resultado: system prompt se construye con todos los valores en 0
```

## 1.3 Acciones Rápidas (Sugerencias) — Mismo Bug

Las sugerencias predefinidas (`¿Cuántas facturas emití este mes?`, etc.) ejecutan `handleSugerencia(texto)` que llama `sendMessage({ text: texto })`. Si el usuario cliquea una sugerencia antes de que `empresa` cargue, el `empresaId` será `undefined`.

## 1.4 Fix Requerido

```javascript
// ✅ FIX: Dos cambios necesarios

// 1. Deshabilitar chat hasta que empresa cargue
// 2. Pasar empresaId en cada sendMessage, no en el transport

function AnalisisPageInner() {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/reportes/chat',
    }),
  });

  useEffect(() => {
    obtenerContextoEmpresa().then((result) => {
      if (result.data) setEmpresa(result.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !empresa?.id) return;
    sendMessage({ text: input }, { body: { empresaId: empresa.id } });
    setInput('');
  };

  const handleSugerencia = (texto) => {
    if (!empresa?.id) return; // Guard
    sendMessage({ text: texto }, { body: { empresaId: empresa.id } });
  };
  
  // Deshabilitar input y sugerencias mientras loading
}
```

---

# 2. RESUMEN EJECUTIVO — FASE 7

La **Fase 7** tiene tres pilares estratégicos:

1. **Chat IA Premium** — Rediseño completo del Asistente Tributario con interfaz moderna, expansible, responsiva, fix del bug $0.00, acciones rápidas funcionales, y UX de nivel producto comercial.

2. **Completación Fase 6** — Verificar y cerrar los 4 issues pendientes en Linear (DAT-171, 173, 174, 175, 176). Validar código existente contra los entregables definidos. Cerrar gaps.

3. **Preparación para Producción** — Pasarela de pago (Stripe/PaymentEz), multi-usuario por empresa, monitoreo (Sentry), tests E2E (Playwright), optimización de rendimiento.

## 2.1 Entregables

| # | Entregable | Descripción | Prioridad | Días |
|---|-----------|-------------|:---------:|:----:|
| 1 | **Fix Bug Chat IA $0.00** | Corregir transmisión de empresaId en DefaultChatTransport | CRÍTICA | 1 |
| 2 | **Rediseño Chat IA Premium** | UI moderna, expansible, responsive, acciones rápidas, typing indicators, markdown rendering | CRÍTICA | 2-3 |
| 3 | **Verificación + Cierre F6** | Auditar código F6 vs entregables, cerrar issues Linear, fix gaps | ALTA | 1 |
| 4 | **Pasarela de Pago** | Integración Stripe (o PaymentEz Ecuador), checkout, webhooks, portal billing | ALTA | 3 |
| 5 | **Multi-Usuario por Empresa** | Invitaciones, roles (admin/contador/emisor), perfiles por empresa | ALTA | 2 |
| 6 | **Monitoreo + Logging** | Sentry para errores, logging estructurado, alertas | MEDIA | 1 |
| 7 | **Tests E2E Playwright** | Flujos críticos: login, crear factura, autorizar SRI, reportes | MEDIA | 1 |
| 8 | **Optimización Rendimiento** | Lazy loading, ISR, bundle analysis, Core Web Vitals | MEDIA | 1 |

**Duración total:** 14 días hábiles (≈3 semanas)

## 2.2 Reutilización de Infraestructura

| Componente existente | Reutilización en Fase 7 |
|---------------------|------------------------|
| `useChat` + `DefaultChatTransport` | Base del chat rediseñado (fix + mejora) |
| `/api/reportes/chat/route.js` | Backend del chat (mantener, mejorar contexto) |
| `reportes-prompts.js` | System prompts (ampliar con herramientas IA) |
| `gemini-client.js` | Cliente base Gemini (reutilizar) |
| Tabla `planes` (3 planes) | Base para Stripe pricing |
| Tabla `suscripciones` | Integrar con Stripe customer/subscription |
| `verificar_limite_plan()` | Enforcement existente (conectar con Stripe) |
| Glass UI completo | Diseño base para todos los nuevos componentes |
| RLS multi-tenant | Extender para multi-usuario |
| CI/CD AWS App Runner | Pipeline existente |

**Estimación de reutilización: ~60%**

---

# 3. MIGRACIÓN DE BASE DE DATOS — Fase 7

## 3.1 Migración `013_multiusuario_stripe_fase7.sql`

```sql
-- =============================================
-- MIGRACIÓN 013: Multi-Usuario + Stripe + Chat Mejorado
-- Fase 7 — facturIA SaaS
-- =============================================

-- 1. Tabla invitaciones (multi-usuario)
CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'contador', 'emisor', 'visor')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'expirada', 'revocada')),
  invitado_por UUID REFERENCES auth.users(id),
  aceptado_por UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitaciones_tenant" ON invitaciones
  USING (empresa_id IN (
    SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
  ));

-- 2. Tabla perfiles_empresa (relación N:N usuarios ↔ empresas)
CREATE TABLE IF NOT EXISTS perfiles_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'emisor' CHECK (rol IN ('propietario', 'admin', 'contador', 'emisor', 'visor')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

ALTER TABLE perfiles_empresa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfiles_empresa_tenant" ON perfiles_empresa
  USING (empresa_id IN (
    SELECT pe.empresa_id FROM perfiles_empresa pe WHERE pe.user_id = auth.uid()
  ) OR user_id = auth.uid());

-- 3. Campos Stripe en suscripciones
ALTER TABLE suscripciones
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 4. Campos Stripe en planes  
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- 5. Tabla chat_sesiones (historial persistente del chat IA)
CREATE TABLE IF NOT EXISTS chat_sesiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  titulo TEXT,
  periodo_contexto TEXT, -- 'YYYY-MM'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_sesiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sesiones_tenant" ON chat_sesiones
  USING (empresa_id IN (
    SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
  ));

-- 6. Tabla chat_mensajes (mensajes individuales)
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id UUID NOT NULL REFERENCES chat_sesiones(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user', 'assistant')),
  contenido TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_mensajes_tenant" ON chat_mensajes
  USING (sesion_id IN (
    SELECT id FROM chat_sesiones WHERE empresa_id IN (
      SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid()
    )
  ));

-- 7. Índices
CREATE INDEX idx_invitaciones_empresa ON invitaciones(empresa_id);
CREATE INDEX idx_invitaciones_email ON invitaciones(email);
CREATE INDEX idx_invitaciones_token ON invitaciones(token);
CREATE INDEX idx_perfiles_empresa_user ON perfiles_empresa(user_id);
CREATE INDEX idx_perfiles_empresa_empresa ON perfiles_empresa(empresa_id);
CREATE INDEX idx_chat_sesiones_empresa ON chat_sesiones(empresa_id);
CREATE INDEX idx_chat_sesiones_user ON chat_sesiones(user_id);
CREATE INDEX idx_chat_mensajes_sesion ON chat_mensajes(sesion_id);

-- 8. Triggers updated_at
CREATE TRIGGER set_updated_at_invitaciones BEFORE UPDATE ON invitaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_perfiles_empresa BEFORE UPDATE ON perfiles_empresa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_chat_sesiones BEFORE UPDATE ON chat_sesiones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. Migrar usuarios existentes a perfiles_empresa
-- (el propietario actual de cada empresa se crea como 'propietario')
INSERT INTO perfiles_empresa (user_id, empresa_id, rol)
SELECT user_id, id, 'propietario'
FROM empresas
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;
```

**Total tablas nuevas: 4** (`invitaciones`, `perfiles_empresa`, `chat_sesiones`, `chat_mensajes`)  
**Columnas nuevas: 6** (en `suscripciones` y `planes`)

---

# 4. ESTRUCTURA DE ARCHIVOS — Fase 7

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── asistente/                        # ★ NUEVO: Chat IA Premium (reemplaza /reportes/analisis)
│   │   │   ├── page.js                       # Página principal del asistente
│   │   │   └── components/
│   │   │       ├── ChatContainer.jsx          # ★ NUEVO: Contenedor principal del chat
│   │   │       ├── ChatHeader.jsx             # ★ NUEVO: Header con info empresa + expand/collapse
│   │   │       ├── ChatMessageBubble.jsx      # ★ NUEVO: Burbuja de mensaje con markdown
│   │   │       ├── ChatInput.jsx              # ★ NUEVO: Input con autosize + acciones
│   │   │       ├── ChatSuggestionChips.jsx    # ★ NUEVO: Chips de acciones rápidas
│   │   │       ├── ChatTypingIndicator.jsx    # ★ NUEVO: Indicador de escritura IA
│   │   │       ├── ChatEmptyState.jsx         # ★ NUEVO: Estado vacío con onboarding
│   │   │       ├── ChatSidebar.jsx            # ★ NUEVO: Sidebar con historial de sesiones
│   │   │       └── ChatKPIPreview.jsx         # ★ NUEVO: Mini dashboard dentro del chat
│   │   ├── equipo/                           # ★ NUEVO: Multi-usuario
│   │   │   ├── page.js                       # Lista de miembros + invitaciones
│   │   │   └── actions.js                    # Server Actions equipo
│   │   └── suscripcion/                      # ★ MEJORAR: Integrar Stripe
│   │       ├── page.js                       # Portal suscripción + Stripe
│   │       ├── actions.js                    # Server Actions suscripción + Stripe
│   │       └── success/page.js               # Página post-checkout
│   ├── api/
│   │   ├── reportes/chat/
│   │   │   └── route.js                      # ★ MEJORAR: Fix empresaId + historial
│   │   ├── stripe/
│   │   │   ├── checkout/route.js             # ★ NUEVO: Crear sesión checkout
│   │   │   ├── webhook/route.js              # ★ NUEVO: Webhooks Stripe
│   │   │   └── portal/route.js               # ★ NUEVO: Billing portal
│   │   └── equipo/
│   │       ├── invitar/route.js              # ★ NUEVO: Enviar invitación
│   │       └── aceptar/route.js              # ★ NUEVO: Aceptar invitación
│   └── invitacion/[token]/page.js            # ★ NUEVO: Página aceptar invitación
│
├── lib/
│   ├── stripe/
│   │   ├── stripe-client.js                  # ★ NUEVO: Cliente Stripe server-side
│   │   ├── stripe-webhooks.js                # ★ NUEVO: Handler de webhooks
│   │   └── pricing.js                        # ★ NUEVO: Mapeo planes → Stripe prices
│   ├── ia/
│   │   └── chat-tools.js                     # ★ NUEVO: Tool calling para el chat IA
│   └── monitoring/
│       └── sentry.js                         # ★ NUEVO: Configuración Sentry
│
├── components/
│   └── chat/                                 # ★ NUEVO: Componentes compartidos del chat
│       ├── MarkdownRenderer.jsx              # Renderizado markdown con syntax highlighting
│       └── DataCard.jsx                      # Card de datos inline en respuestas
│
├── __tests__/                                # ★ TESTS
│   ├── e2e/                                  # Playwright E2E
│   │   ├── auth.spec.js                      # Login/logout
│   │   ├── factura.spec.js                   # Crear + autorizar factura
│   │   ├── reportes.spec.js                  # Generar ATS/reportes
│   │   └── chat.spec.js                      # Chat IA flujo completo
│   └── lib/
│       └── stripe-webhooks.test.js           # Tests webhooks
│
└── instrumentation.js                        # ★ NUEVO: Sentry instrumentation
```

**Total archivos nuevos: ~30**  
**Archivos a modificar: ~12**  
**Dependencias npm nuevas: 4** (`stripe`, `@sentry/nextjs`, `@playwright/test`, `react-markdown`)

---

# 5. IMPLEMENTACIÓN DETALLADA POR DÍA

## DÍA 1: Fix Bug Crítico Chat IA + Verificación F6 (URGENTE)

### 5.1.1 Fix del Bug $0.00 en Chat

**Problema:** `DefaultChatTransport` captura `empresaId: undefined` por closure stale.

**Archivo a modificar:** `src/app/(dashboard)/reportes/analisis/page.js`

```javascript
// ✅ FIX COMPLETO
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, DefaultChatTransport } from '@ai-sdk/react';
import { obtenerContextoEmpresa } from '../actions';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { ArrowLeft, Sparkles, Send, Loader2 } from 'lucide-react';

const SUGERENCIAS = [
  '¿Cuánto vendí este mes?',
  '¿Cuántas facturas emití este mes?',
  '¿Cuál es mi crédito tributario?',
  '¿Cuándo vence mi declaración?',
];

function AnalisisPageInner() {
  const [empresa, setEmpresa] = useState(null);
  const [empresaLoading, setEmpresaLoading] = useState(true);
  const [input, setInput] = useState('');
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  // FIX: Memoizar transport sin empresaId en body
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/reportes/chat',
  }), []);

  const { messages, sendMessage, status } = useChat({ transport });
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    obtenerContextoEmpresa().then((result) => {
      if (result.data) setEmpresa(result.data);
      setEmpresaLoading(false);
    });
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // FIX: Pasar empresaId en cada envío, no en el transport
  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !empresa?.id) return;
    sendMessage({ text: input }, { body: { empresaId: empresa.id } });
    setInput('');
  }, [input, isLoading, empresa, sendMessage]);

  const handleSugerencia = useCallback((texto) => {
    if (!empresa?.id || isLoading) return;
    sendMessage({ text: texto }, { body: { empresaId: empresa.id } });
  }, [empresa, isLoading, sendMessage]);

  // ... resto del componente
}
```

### 5.1.2 Verificación Código F6 vs Entregables

**Tarea:** Auditar el repositorio actual para verificar si los componentes de Fase 6 (anunciados como implementados en Slack) realmente existen y funcionan:

| Componente F6 | Verificar existencia de archivo | Verificar funcionalidad |
|--------------|--------------------------------|------------------------|
| VentasChart.jsx | `src/components/dashboard/` | Render con datos reales |
| ComprobantesPieChart.jsx | `src/components/dashboard/` | Distribución por tipo |
| TendenciaMensual.jsx | `src/components/dashboard/` | Línea 6 meses |
| TopClientes.jsx | `src/components/dashboard/` | Top 5 con datos |
| PrediccionIA.jsx | `src/components/dashboard/` | Llamada a Gemini |
| UsageMeter.jsx | `src/components/dashboard/` | Barra progreso plan |
| NotificationBell.jsx | `src/components/notificaciones/` | Contador en Topbar |
| NotificationPanel.jsx | `src/components/notificaciones/` | Dropdown con lista |
| Portal suscripción | `src/app/(dashboard)/suscripcion/` | Plan actual + uso |
| StatusBadge unificado | `src/components/comprobantes/StatusBadge.jsx` | Todos los estados |
| Suite Vitest | `src/__tests__/` | Tests passing |

**Acción:** Para cada componente:
1. Verificar que el archivo existe
2. Si existe, verificar imports y dependencias
3. Si NO existe, marcar como gap para implementar en Día 2-3
4. Actualizar issues Linear a su estado real

### 5.1.3 Cerrar Issues Linear F6

Actualizar en Linear todos los issues verificados:
- Si código existe y funciona → marcar `Done`
- Si código no existe → mantener `Todo` y documentar gap
- Comentar estado real en cada issue

---

## DÍAS 2-3: Rediseño Chat IA Premium

### 5.2.1 Diseño del Chat Premium

El nuevo chat debe ser un componente de nivel producto comercial con las siguientes características:

**Arquitectura:**
- Contenedor full-height con sidebar colapsable (historial de sesiones)
- Header con info de empresa, período fiscal, y botón expandir/colapsar
- Área de mensajes con burbujas estilizadas (usuario derecha, IA izquierda)
- Input autosize con botón de envío y estado
- Chips de acciones rápidas contextuales
- Typing indicator animado durante streaming
- Renderizado markdown con syntax highlighting para código/tablas

**UX Mejorada:**
- Animación de entrada de mensajes (framer-motion o CSS animations)
- Scroll suave al nuevo mensaje
- Feedback háptico en mobile al enviar
- Estado vacío con ilustración y onboarding
- KPI preview card dentro de respuestas de IA
- Auto-scroll inteligente (solo si usuario está al fondo)
- Indicador de conexión/desconexión
- Botón "Nuevo Chat" para iniciar sesión limpia

### 5.2.2 ChatContainer.jsx — Componente Principal

```javascript
// src/app/(dashboard)/asistente/components/ChatContainer.jsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChat, DefaultChatTransport } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import ChatMessageBubble from './ChatMessageBubble';
import ChatInput from './ChatInput';
import ChatSuggestionChips from './ChatSuggestionChips';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatEmptyState from './ChatEmptyState';
import ChatSidebar from './ChatSidebar';

export default function ChatContainer({ empresa, kpis }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef(null);
  const messagesEnd = useRef(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/reportes/chat' }),
    []
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const isStreaming = status === 'streaming' || status === 'submitted';

  // Auto-scroll inteligente
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom]);

  const handleSend = useCallback((text) => {
    if (!text.trim() || isStreaming || !empresa?.id) return;
    sendMessage({ text }, { body: { empresaId: empresa.id } });
  }, [isStreaming, empresa, sendMessage]);

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height,64px)-var(--bottomnav-height,64px)-2rem)] 
                    rounded-2xl overflow-hidden"
         style={{ 
           background: 'var(--glass-bg)', 
           border: '1px solid var(--glass-border)',
           backdropFilter: 'blur(20px)'
         }}>
      
      {/* Sidebar Historial — colapsable */}
      <AnimatePresence>
        {sidebarOpen && (
          <ChatSidebar 
            empresaId={empresa?.id} 
            onClose={() => setSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Panel Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader 
          empresa={empresa} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        {/* Área de Mensajes */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <ChatEmptyState 
              empresa={empresa} 
              kpis={kpis}
              onSuggestion={handleSend} 
              disabled={!empresa?.id}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessageBubble 
                  key={msg.id || i} 
                  message={msg} 
                  isLast={i === messages.length - 1}
                />
              ))}
              {isStreaming && <ChatTypingIndicator />}
            </>
          )}
          <div ref={messagesEnd} />
        </div>

        {/* Sugerencias + Input */}
        <div className="px-4 md:px-6 pb-4 space-y-3">
          {messages.length > 0 && !isStreaming && (
            <ChatSuggestionChips onSelect={handleSend} disabled={!empresa?.id} />
          )}
          <ChatInput 
            onSend={handleSend} 
            disabled={!empresa?.id || isStreaming}
            isStreaming={isStreaming}
            placeholder={!empresa?.id ? 'Cargando empresa...' : 'Escribe tu consulta tributaria...'}
          />
        </div>
      </div>
    </div>
  );
}
```

### 5.2.3 ChatMessageBubble.jsx — Burbuja Moderna

```javascript
// src/app/(dashboard)/asistente/components/ChatMessageBubble.jsx
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';

const ChatMessageBubble = memo(function ChatMessageBubble({ message, isLast }) {
  const isUser = message.role === 'user';
  
  const getTextContent = (msg) => {
    if (msg.parts?.length > 0) {
      return msg.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
    }
    return msg.content || '';
  };

  const text = getTextContent(message);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar IA */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
             style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </div>
      )}

      {/* Burbuja */}
      <div
        className={`
          max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser 
            ? 'rounded-br-md' 
            : 'rounded-bl-md'
          }
        `}
        style={isUser ? {
          background: 'var(--text-primary)',
          color: 'var(--bg-primary)',
        } : {
          background: 'var(--glass-hover)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {isUser ? (
          <p>{text}</p>
        ) : (
          <MarkdownRenderer content={text} />
        )}
      </div>

      {/* Avatar Usuario */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1"
             style={{ background: 'var(--text-primary)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--bg-primary)' }} />
        </div>
      )}
    </motion.div>
  );
});

export default ChatMessageBubble;
```

### 5.2.4 ChatInput.jsx — Input Premium con Autosize

```javascript
// src/app/(dashboard)/asistente/components/ChatInput.jsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, disabled, isStreaming, placeholder }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="relative flex items-end gap-2 rounded-2xl px-4 py-3 transition-all"
         style={{
           background: 'var(--glass-bg)',
           border: '1px solid var(--glass-border)',
           boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
         }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-50"
        style={{ 
          color: 'var(--text-primary)',
          maxHeight: '160px',
          minHeight: '24px',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center 
                   transition-all duration-200 active:scale-95"
        style={{
          background: value.trim() && !disabled ? 'var(--text-primary)' : 'var(--glass-hover)',
          color: value.trim() && !disabled ? 'var(--bg-primary)' : 'var(--text-muted)',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isStreaming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
```

### 5.2.5 ChatSuggestionChips.jsx — Acciones Rápidas Contextuales

```javascript
// src/app/(dashboard)/asistente/components/ChatSuggestionChips.jsx
'use client';

import { motion } from 'framer-motion';
import { TrendingUp, FileText, Calendar, DollarSign, PieChart, AlertTriangle } from 'lucide-react';

const CHIPS = [
  { text: '¿Cuánto vendí este mes?', icon: DollarSign },
  { text: '¿Cuándo vence mi declaración?', icon: Calendar },
  { text: 'Analiza mis retenciones', icon: FileText },
  { text: '¿Hay anomalías en mis datos?', icon: AlertTriangle },
  { text: 'Compara este mes vs anterior', icon: TrendingUp },
  { text: 'Distribución de comprobantes', icon: PieChart },
];

export default function ChatSuggestionChips({ onSelect, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CHIPS.slice(0, 4).map((chip, i) => (
        <motion.button
          key={chip.text}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => !disabled && onSelect(chip.text)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                     transition-all duration-150 active:scale-95 hover:brightness-95"
          style={{
            background: 'var(--glass-hover)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <chip.icon className="w-3 h-3" />
          {chip.text}
        </motion.button>
      ))}
    </div>
  );
}
```

### 5.2.6 MarkdownRenderer.jsx — Renderizado Elegante

```javascript
// src/components/chat/MarkdownRenderer.jsx
'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {children}
          </strong>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-sm">{children}</li>,
        code: ({ inline, children }) => 
          inline ? (
            <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ background: 'var(--glass-hover)', color: 'var(--text-secondary)' }}>
              {children}
            </code>
          ) : (
            <pre className="rounded-lg p-3 overflow-x-auto text-xs mb-2 font-mono"
                 style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--text-primary)' }}>
              <code>{children}</code>
            </pre>
          ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2 rounded-lg" 
               style={{ border: '1px solid var(--glass-border)' }}>
            <table className="w-full text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-medium text-xs"
              style={{ background: 'var(--glass-hover)', borderBottom: '1px solid var(--glass-border)' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-xs"
              style={{ borderBottom: '1px solid var(--glass-border)' }}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### 5.2.7 Página Asistente IA — Nueva Ruta

```javascript
// src/app/(dashboard)/asistente/page.js
import { obtenerContextoEmpresa } from '../reportes/actions';
import { obtenerDashboardKPIs } from '../dashboard/actions';
import ChatContainer from './components/ChatContainer';

export const metadata = {
  title: 'Asistente Tributario IA — facturIA',
};

export default async function AsistentePage() {
  const [empresaResult, kpisResult] = await Promise.all([
    obtenerContextoEmpresa(),
    obtenerDashboardKPIs(),
  ]);

  return (
    <ChatContainer 
      empresa={empresaResult?.data || null} 
      kpis={kpisResult?.data || null}
    />
  );
}
```

**Nota:** Al hacer la página server component, `empresa` y `kpis` se pasan como props ya resueltos, eliminando la race condition del `useEffect`. El `ChatContainer` (client component) recibe los datos inmediatamente.

---

## DÍAS 4-6: Pasarela de Pago Stripe

### 5.3.1 Configuración Stripe

```bash
npm install stripe @stripe/stripe-js
```

**Variables de entorno:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### 5.3.2 stripe-client.js

```javascript
// src/lib/stripe/stripe-client.js
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Crear sesión de checkout
 */
export async function crearCheckoutSession({ empresaId, planId, stripePriceId, email, returnUrl }) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: `${returnUrl}/suscripcion/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}/suscripcion`,
    metadata: { empresaId, planId },
    subscription_data: {
      metadata: { empresaId, planId },
    },
  });
  return session;
}

/**
 * Crear portal de facturación
 */
export async function crearBillingPortal({ stripeCustomerId, returnUrl }) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${returnUrl}/suscripcion`,
  });
  return session;
}
```

### 5.3.3 Webhook Handler

```javascript
// src/app/api/stripe/webhook/route.js
import { stripe } from '@/lib/stripe/stripe-client';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { empresaId, planId } = session.metadata;
      
      await supabase.from('suscripciones').update({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        estado: 'activa',
        fecha_inicio: new Date().toISOString(),
      }).eq('empresa_id', empresaId);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const { empresaId } = subscription.metadata;
      
      await supabase.from('suscripciones').update({
        estado: subscription.status === 'active' ? 'activa' : 'suspendida',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      }).eq('empresa_id', empresaId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const { empresaId } = subscription.metadata;
      
      await supabase.from('suscripciones').update({
        estado: 'cancelada',
      }).eq('empresa_id', empresaId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## DÍAS 7-8: Multi-Usuario por Empresa

### 5.4.1 Flujo de Invitaciones

1. Propietario/Admin envía invitación (email + rol)
2. Se crea registro en `invitaciones` con token único
3. Se envía email con enlace `/invitacion/[token]`
4. Invitado crea cuenta (o usa existente) y acepta
5. Se crea registro en `perfiles_empresa`
6. Usuario puede acceder a la empresa

### 5.4.2 Roles y Permisos

| Permiso | Propietario | Admin | Contador | Emisor | Visor |
|---------|:-----------:|:-----:|:--------:|:------:|:-----:|
| Emitir comprobantes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Generar ATS/RDEP | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chat IA | ✅ | ✅ | ✅ | ❌ | ✅ |
| Config empresa | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar equipo | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar suscripción | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar empresa | ✅ | ❌ | ❌ | ❌ | ❌ |

### 5.4.3 Middleware de Permisos

```javascript
// src/lib/auth/permisos.js
export const PERMISOS_ROL = {
  propietario: ['*'],
  admin: ['emitir', 'reportes', 'ats', 'rdep', 'chat', 'config', 'equipo'],
  contador: ['emitir', 'reportes', 'ats', 'rdep', 'chat'],
  emisor: ['emitir'],
  visor: ['reportes', 'chat'],
};

export function verificarPermiso(rol, permiso) {
  const permisos = PERMISOS_ROL[rol];
  if (!permisos) return false;
  return permisos.includes('*') || permisos.includes(permiso);
}
```

---

## DÍA 9: Monitoreo + Logging (Sentry)

### 5.5.1 Configuración

```bash
npx @sentry/wizard@latest -i nextjs
```

**Archivo:** `src/instrumentation.js`
```javascript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.httpIntegration(),
      ],
    });
  }
}
```

### 5.5.2 Error Boundaries Personalizados

- Capturar errores del chat IA
- Capturar errores de autorización SRI
- Capturar errores de Stripe webhooks
- Logging estructurado de acciones críticas

---

## DÍAS 10-11: Tests E2E con Playwright

### 5.6.1 Setup

```bash
npm install -D @playwright/test
npx playwright install
```

### 5.6.2 Tests Críticos

| Test | Flujo | Criterio de Éxito |
|------|-------|-------------------|
| auth.spec.js | Login → Dashboard → Logout | Redirect correcto, sesión limpia |
| factura.spec.js | Crear factura → Firmar → Enviar SRI → Ver estado | Status AUT o PPR |
| reportes.spec.js | Hub → ATS → Generar → Descargar | Archivo XML descargado |
| chat.spec.js | Abrir chat → Enviar pregunta → Recibir respuesta con datos reales | Respuesta con $ > 0 |
| suscripcion.spec.js | Portal → Ver plan → Intentar upgrade | Redirect a Stripe |

---

## DÍAS 12-13: Optimización de Rendimiento

### 5.7.1 Acciones

| Optimización | Archivo/Config | Impacto |
|-------------|---------------|---------|
| Dynamic imports (lazy loading) | Componentes pesados: Recharts, Chat, PDF | -30% bundle |
| Route segments `loading.js` | Cada sección del dashboard | UX perceived performance |
| ISR para páginas estáticas | `/reportes`, `/configuracion` | Cache edge |
| Image optimization | `next/image` en logos | LCP improvement |
| Bundle analysis | `@next/bundle-analyzer` | Identificar bloat |
| Service Worker cache | Actualizar estrategias Serwist | Offline + speed |

### 5.7.2 Core Web Vitals Target

| Métrica | Target | Actual |
|---------|--------|--------|
| LCP | < 2.5s | Medir |
| FID | < 100ms | Medir |
| CLS | < 0.1 | Medir |
| TTFB | < 800ms | Medir |

---

## DÍA 14: Cierre Fase 7 + Deploy Staging

### 5.8.1 Checklist Final

- [ ] Fix Chat IA $0.00 verificado en producción
- [ ] Chat Premium responsivo (mobile + desktop)
- [ ] Acciones rápidas funcionales
- [ ] Issues Linear F6 cerrados o re-asignados
- [ ] Stripe checkout funcional en modo test
- [ ] Webhooks Stripe recibiendo eventos
- [ ] Multi-usuario: invitación + aceptación funcional
- [ ] Sentry capturando errores
- [ ] Tests Playwright passing (≥80%)
- [ ] Bundle size < 500KB first load
- [ ] Leaked Password Protection habilitado (manual)
- [ ] `npm run build` sin errores
- [ ] Deploy staging exitoso
- [ ] Actualizar README.md con estado Fase 7
- [ ] Publicar resumen en Slack #facturia

---

# 6. DEPENDENCIAS ENTRE TAREAS

```
Día 1: Fix Chat IA ──→ Día 2-3: Chat Premium
         │
         └──→ Verificación F6 ──→ Cierre issues Linear
         
Día 4-6: Stripe ──→ Día 7-8: Multi-usuario (Stripe customer per empresa)
                              │
Día 9: Sentry ────────────────┘
                              
Día 10-11: Playwright ──→ Día 12-13: Optimización
                                      │
                         Día 14: Cierre ←──────────┘
```

---

# 7. CHECKLIST DE ACEPTACIÓN

## A. Fix Chat IA (Día 1)
- [ ] Preguntar "¿Cuánto vendí este mes?" retorna $929.75 (no $0.00)
- [ ] Preguntar sobre febrero retorna $1,176.25
- [ ] Acciones rápidas (chips) funcionan al primer click
- [ ] Chat funciona inmediatamente al cargar la página
- [ ] empresaId se envía correctamente en cada request

## B. Chat Premium (Días 2-3)
- [ ] Diseño Glass UI con burbujas usuario/IA diferenciadas
- [ ] Typing indicator animado durante streaming
- [ ] Renderizado markdown (tablas, negritas, listas, código)
- [ ] Input autosize con Shift+Enter para nueva línea
- [ ] Responsive: mobile (fullscreen) + desktop (contenedor)
- [ ] Scroll inteligente (auto-scroll si está al fondo)
- [ ] Estado vacío con onboarding y KPIs preview
- [ ] Chips de acciones rápidas contextuales
- [ ] Animación de entrada de mensajes

## C. Verificación + Cierre F6 (Día 1)
- [ ] DAT-171 verificado y cerrado (o gap documentado)
- [ ] DAT-173 verificado y cerrado (o gap documentado)
- [ ] DAT-174 verificado y cerrado (o gap documentado)
- [ ] DAT-175 verificado y cerrado (o gap documentado)
- [ ] DAT-176 verificado y cerrado (o gap documentado)

## D. Pasarela de Pago (Días 4-6)
- [ ] Stripe checkout crea sesión correctamente
- [ ] Webhook procesa `checkout.session.completed`
- [ ] Suscripción se actualiza en BD tras pago
- [ ] Billing portal accesible para gestionar suscripción
- [ ] Upgrade/downgrade funcional

## E. Multi-Usuario (Días 7-8)
- [ ] Invitar usuario por email funcional
- [ ] Aceptar invitación crea perfil_empresa
- [ ] Permisos por rol aplicados en frontend y backend
- [ ] Propietario puede revocar acceso

## F. Calidad (Días 9-13)
- [ ] Sentry captura errores en producción
- [ ] ≥5 tests E2E Playwright passing
- [ ] Bundle < 500KB first load
- [ ] Core Web Vitals en verde

---

# 8. ENTREGABLES NO INCLUIDOS EN FASE 7 (Fase 8)

| Item | Razón de exclusión |
|------|-------------------|
| PaymentEz (pasarela Ecuador) | Alternativa a Stripe, evaluar post-launch |
| Documentación API pública | Solo si se abre API a terceros |
| White-labeling | Personalización por empresa, fase de madurez |
| Marketplace de integraciones | Conectores SAP, QuickBooks, etc. |
| App móvil nativa (React Native) | PWA cubre el caso base |
| Analytics avanzados (BI dashboard) | Recharts cubre el MVP |
| Facturación electrónica multi-país | Expansión regional post-Ecuador |

---

# 9. NOTAS TÉCNICAS ADICIONALES

## 9.1 AI SDK v6 — Patrón Correcto para body Dinámico

```javascript
// ❌ INCORRECTO: body en DefaultChatTransport (closure stale)
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: { empresaId: someState },  // Puede ser stale
  }),
});

// ✅ CORRECTO Opción 1: body en sendMessage
sendMessage({ text }, { body: { empresaId: currentValue } });

// ✅ CORRECTO Opción 2: Server Component pasa datos como props
// (elimina la necesidad de pasar empresaId al API)
export default async function Page() {
  const empresa = await obtenerEmpresa(); // Server-side
  return <ChatContainer empresa={empresa} />;
}
```

## 9.2 Supabase Admin Client para Webhooks

Los webhooks de Stripe no tienen contexto de usuario autenticado. Necesitan un cliente admin:

```javascript
// src/lib/supabase/admin.js
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
```

## 9.3 Acción Manual Pendiente

**ANTES de iniciar Fase 7:**
1. Ir a Supabase Dashboard → Authentication → Settings
2. Habilitar "Leaked Password Protection"
3. Guardar cambios
4. Verificar que la protección está activa

---

# 10. RESUMEN EJECUTIVO

La **Fase 7** resuelve el bug crítico del chat IA ($0.00), transforma el asistente tributario en una experiencia premium de nivel producto comercial, cierra formalmente la Fase 6 verificando la implementación real, e incorpora los pilares comerciales (Stripe, multi-usuario) y de calidad (Sentry, Playwright) necesarios para un lanzamiento en producción.

**Duración:** 14 días hábiles  
**Archivos nuevos:** ~30  
**Tablas BD nuevas:** 4 + 6 columnas  
**Dependencias npm nuevas:** 4  
**Reutilización infraestructura:** ~60%  
**Bug crítico resuelto:** Chat IA retornando $0.00 → datos reales  
