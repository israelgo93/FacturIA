# facturIA — Fase 6: Dashboard Analítico, Suscripciones y Consolidación de Calidad
## Plan de Implementación Detallado

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 6 — Dashboard Analítico + Suscripciones + QA (12 días hábiles)  
**Stack actual (verificado en README):** Next.js 16 · React 19 · JavaScript · Supabase · Tailwind 4 · AWS App Runner  
**IA:** Google Gemini 3 Flash (`@ai-sdk/google`) + Vercel AI SDK 3.x  
**Fecha:** Marzo 2026

---

# 0. ANÁLISIS PRE-FASE 6 — Contrastación Código vs Documentación

## 0.1 Discrepancias detectadas entre documentos de fases y código actual

| Aspecto | Documentos de fases (1-5) | Estado real (README + código) |
|---------|---------------------------|-------------------------------|
| Framework | Next.js 15.5 | **Next.js 16** |
| Despliegue | Google Cloud Run | **AWS App Runner + ECR** |
| CI/CD | 3 workflows (ci, staging, production) | **2 workflows (ci.yml, deploy-aws.yml)** |
| PDF Engine | jsPDF / react-pdf | **react-pdf/renderer 4.3** |
| IA SDK | Múltiples migraciones | **@ai-sdk/google + @ai-sdk/react (v6 UIMessage)** |
| PWA | Mencionada en F1, no implementada | **Fase 5.1 completa: Serwist + offline** |
| Responsive | Básico en F1 | **Mobile-first completo: mobileCard, touch targets, bottom-sheet** |
| Gráficos | No mencionados | **Recharts 3.7 integrado** |

## 0.2 Actualizaciones post-Fase 5 ya aplicadas (NO repetir en Fase 6)

Las siguientes mejoras ya están en el código y NO forman parte de la Fase 6:

- ✅ PWA completa (Fase 5.1): Serwist, service worker, manifest, offline
- ✅ Migración CI/CD a AWS App Runner con ECR
- ✅ Migración AI SDK a v6 (convertToModelMessages, sendMessage, DefaultChatTransport)
- ✅ GlassTable mobileCard para vistas responsive
- ✅ Touch targets 44px mínimo, active:scale feedback
- ✅ GlassModal bottom-sheet en móvil
- ✅ BottomNav con safe-area-bottom
- ✅ Inputs text-base en móvil (prevención zoom iOS)
- ✅ Fix ComprobanteTimeline estado AUT → CheckCircle verde
- ✅ Card Asistente Tributario IA en Dashboard
- ✅ Botones Ver RIDE PDF, Descargar XML, Enviar Email en detalle comprobante
- ✅ Next.js 16 con Turbopack

## 0.3 Plan UI Unificado — Estado pendiente (parcialmente incorporado en Fase 6)

El documento `facturia-plan-ui-unificado.md` define 10 fases de corrección (A-J) con 6 problemas críticos. Las correcciones de consistencia visual se incorporan como parte del Día 1 de esta fase.

## 0.4 Pendientes de seguridad (de auditoría Fases 1-5)

| Alerta | Detalle | Prioridad |
|--------|---------|-----------|
| `function_search_path_mutable` | `calcular_total_ventas_periodo()` sin search_path fijo | ALTA |
| `auth_leaked_password_protection` | Protección deshabilitada en Supabase Auth | ALTA |

---

# 1. ESTADO ACTUAL — Dependencias Completadas

## Fases 1-5 + 5.1 Completadas ✅

| Fase | Entregables clave | Estado |
|------|-------------------|--------|
| F1 | Next.js 16, Auth, BD 23 tablas RLS, CI/CD App Runner | ✅ |
| F2 | Onboarding IA, config empresa, .p12, CRUD clientes/productos | ✅ |
| F3 | Motor facturación: XML, XAdES-BES, SOAP SRI, RIDE, email | ✅ |
| F4 | 5 comprobantes adicionales (03-07), orquestador unificado | ✅ |
| F5 | ATS, RDEP, Form 104/103, ventas, chat IA, compras, empleados | ✅ |
| F5.1 | PWA: Serwist, service worker, cache, offline, manifest | ✅ |

## Base de datos actual: 23 tablas, 11 migraciones, RLS completo

## Infraestructura IA actual
- `gemini-client.js` — cliente base Gemini
- `@ai-sdk/google` + `@ai-sdk/react` — streaming chat (v6)
- System prompts: onboarding, factura wizard, análisis errores SRI, reportes tributarios

---

# 2. RESUMEN EJECUTIVO — FASE 6

La **Fase 6** transforma facturIA de una plataforma funcional en un **producto SaaS comercializable** con tres pilares:

1. **Dashboard Analítico Inteligente** — Visualizaciones con Recharts, KPIs en tiempo real, tendencias con predicción IA
2. **Sistema de Suscripciones** — Enforzamiento de planes, control de límites, portal de gestión
3. **Consolidación de Calidad** — Unificación UI, correcciones de seguridad, testing SRI, estabilización

## 2.1 Entregables

| # | Entregable | Descripción | Prioridad |
|---|---|---|---|
| 1 | **Unificación UI/UX** | Ejecutar plan UI unificado (10 fases A-J) + correcciones seguridad | CRÍTICA |
| 2 | **Dashboard Analítico** | 6 widgets con Recharts + KPIs mejorados + predicciones IA | ALTA |
| 3 | **Motor de Suscripciones** | Middleware de límites, enforcement por plan, UI gestión | ALTA |
| 4 | **Notificaciones inteligentes** | Vencimientos tributarios, límites de plan, alertas SRI | ALTA |
| 5 | **Testing SRI comprobantes 03-07** | Pruebas contra ambiente SRI de pruebas | MEDIA |
| 6 | **Tests unitarios + integración** | Suite de tests con Vitest para módulos críticos | MEDIA |

## 2.2 Reutilización de infraestructura

| Componente existente | Reutilización en Fase 6 |
|---|---|
| Recharts 3.7 | Base de gráficos del dashboard analítico |
| `calcular_total_ventas_periodo()` | KPIs del dashboard (tras fix search_path) |
| `v_comprobantes_resumen` | Datos para widgets de comprobantes |
| Tabla `planes` (3 planes seed) | Base del motor de suscripciones |
| `gemini-client.js` + `@ai-sdk/google` | Predicciones IA en dashboard |
| Tabla `compras_recibidas` | Datos de gastos para analítica |
| `ats-consolidator.js` | Datos consolidados para dashboard |
| Glass UI + StatusBadge | Componentes de interfaz unificados |
| Vitest (ya en package.json) | Suite de testing |

**Estimación de reutilización: ~70%**

## 2.3 Duración y Cronograma

**Duración:** 12 días hábiles (≈2.5 semanas)

| Bloque | Días | Contenido |
|--------|------|-----------|
| Consolidación UI + Seguridad | 1-2 | Unificación visual, fixes seguridad |
| Dashboard Analítico | 3-6 | Widgets, gráficos, predicciones IA |
| Motor Suscripciones | 7-9 | Enforcement, middleware, portal |
| Notificaciones + Testing | 10-12 | Alertas, tests SRI, suite Vitest |

---

# 3. MIGRACIÓN DE BASE DE DATOS — Fase 6

## 3.1 Migración `012_dashboard_suscripciones_fase6.sql`

```sql
-- =============================================
-- MIGRACIÓN 012: Dashboard Analítico + Suscripciones
-- Fase 6 — facturIA SaaS
-- =============================================

-- 1. TABLA: suscripciones (gestión de suscripciones activas)
CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES planes(id),
  estado TEXT NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'trial')),
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ,
  periodo_facturacion TEXT NOT NULL DEFAULT 'mensual'
    CHECK (periodo_facturacion IN ('mensual', 'anual')),
  comprobantes_usados_mes INT NOT NULL DEFAULT 0,
  mes_conteo TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);

-- 2. TABLA: notificaciones (alertas del sistema)
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL
    CHECK (tipo IN (
      'vencimiento_tributario', 'limite_plan', 'suscripcion',
      'certificado_expira', 'sri_error', 'reporte_listo', 'sistema'
    )),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  accion_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_empresa ON notificaciones(empresa_id);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(empresa_id, tipo);
CREATE INDEX idx_notificaciones_leida ON notificaciones(empresa_id, leida);

-- 3. TABLA: dashboard_cache (cache de métricas precalculadas)
CREATE TABLE IF NOT EXISTS dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  metricas JSONB NOT NULL DEFAULT '{}',
  calculado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, periodo)
);

CREATE INDEX idx_dashboard_cache_empresa ON dashboard_cache(empresa_id, periodo);

-- 4. FUNCIÓN: contar_comprobantes_mes (para enforcement de límites)
CREATE OR REPLACE FUNCTION contar_comprobantes_mes(
  p_empresa_id UUID,
  p_mes TEXT DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND to_char(created_at, 'YYYY-MM') = p_mes
    AND estado != 'ANULADO';
  RETURN COALESCE(v_count, 0);
END;
$$;

-- 5. FUNCIÓN: verificar_limite_plan (retorna si puede emitir)
CREATE OR REPLACE FUNCTION verificar_limite_plan(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_usados INT;
  v_resultado JSONB;
BEGIN
  SELECT p.nombre, p.limite_comprobantes_mes, p.limite_usuarios,
         p.limite_establecimientos, p.limite_puntos_emision,
         p.tiene_reportes_ia, p.tiene_rdep
  INTO v_plan
  FROM suscripciones s
  JOIN planes p ON p.id = s.plan_id
  WHERE s.empresa_id = p_empresa_id AND s.estado IN ('activa', 'trial');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('permitido', false, 'razon', 'Sin suscripción activa');
  END IF;

  v_usados := contar_comprobantes_mes(p_empresa_id);

  IF v_plan.limite_comprobantes_mes IS NOT NULL AND v_usados >= v_plan.limite_comprobantes_mes THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'razon', 'Límite de comprobantes alcanzado',
      'usados', v_usados,
      'limite', v_plan.limite_comprobantes_mes,
      'plan', v_plan.nombre
    );
  END IF;

  RETURN jsonb_build_object(
    'permitido', true,
    'usados', v_usados,
    'limite', v_plan.limite_comprobantes_mes,
    'plan', v_plan.nombre,
    'tiene_reportes_ia', v_plan.tiene_reportes_ia,
    'tiene_rdep', v_plan.tiene_rdep
  );
END;
$$;

-- 6. FIX SEGURIDAD: search_path en función existente
CREATE OR REPLACE FUNCTION calcular_total_ventas_periodo(
  p_empresa_id UUID,
  p_fecha_inicio DATE,
  p_fecha_fin DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total), 0)
  INTO v_total
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND tipo_comprobante = '01'
    AND estado = 'AUT'
    AND fecha_emision BETWEEN p_fecha_inicio AND p_fecha_fin;
  RETURN v_total;
END;
$$;

-- 7. FUNCIÓN: métricas dashboard (precalculada)
CREATE OR REPLACE FUNCTION calcular_metricas_dashboard(
  p_empresa_id UUID,
  p_mes TEXT DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metricas JSONB;
  v_mes_anterior TEXT;
  v_ventas_actual NUMERIC;
  v_ventas_anterior NUMERIC;
  v_comprobantes_actual INT;
  v_comprobantes_anterior INT;
BEGIN
  v_mes_anterior := to_char((p_mes || '-01')::DATE - INTERVAL '1 month', 'YYYY-MM');

  -- Ventas mes actual
  SELECT COALESCE(SUM(total), 0) INTO v_ventas_actual
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND tipo_comprobante = '01' AND estado = 'AUT'
    AND to_char(fecha_emision, 'YYYY-MM') = p_mes;

  -- Ventas mes anterior
  SELECT COALESCE(SUM(total), 0) INTO v_ventas_anterior
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND tipo_comprobante = '01' AND estado = 'AUT'
    AND to_char(fecha_emision, 'YYYY-MM') = v_mes_anterior;

  -- Comprobantes mes actual
  SELECT COUNT(*) INTO v_comprobantes_actual
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND to_char(created_at, 'YYYY-MM') = p_mes
    AND estado != 'ANULADO';

  -- Comprobantes mes anterior
  SELECT COUNT(*) INTO v_comprobantes_anterior
  FROM comprobantes
  WHERE empresa_id = p_empresa_id
    AND to_char(created_at, 'YYYY-MM') = v_mes_anterior
    AND estado != 'ANULADO';

  v_metricas := jsonb_build_object(
    'ventas_actual', v_ventas_actual,
    'ventas_anterior', v_ventas_anterior,
    'variacion_ventas', CASE WHEN v_ventas_anterior > 0
      THEN ROUND(((v_ventas_actual - v_ventas_anterior) / v_ventas_anterior) * 100, 1)
      ELSE 0 END,
    'comprobantes_actual', v_comprobantes_actual,
    'comprobantes_anterior', v_comprobantes_anterior,
    'variacion_comprobantes', CASE WHEN v_comprobantes_anterior > 0
      THEN ROUND(((v_comprobantes_actual::NUMERIC - v_comprobantes_anterior) / v_comprobantes_anterior) * 100, 1)
      ELSE 0 END,
    'iva_cobrado', (SELECT COALESCE(SUM(total_impuestos), 0) FROM comprobantes
      WHERE empresa_id = p_empresa_id AND tipo_comprobante = '01' AND estado = 'AUT'
      AND to_char(fecha_emision, 'YYYY-MM') = p_mes),
    'total_clientes', (SELECT COUNT(*) FROM clientes WHERE empresa_id = p_empresa_id AND activo = true),
    'total_productos', (SELECT COUNT(*) FROM productos WHERE empresa_id = p_empresa_id AND activo = true),
    'comprobantes_por_tipo', (SELECT jsonb_object_agg(tipo_comprobante, cnt) FROM (
      SELECT tipo_comprobante, COUNT(*) AS cnt FROM comprobantes
      WHERE empresa_id = p_empresa_id AND to_char(created_at, 'YYYY-MM') = p_mes AND estado != 'ANULADO'
      GROUP BY tipo_comprobante) AS t),
    'comprobantes_por_estado', (SELECT jsonb_object_agg(estado, cnt) FROM (
      SELECT estado, COUNT(*) AS cnt FROM comprobantes
      WHERE empresa_id = p_empresa_id AND to_char(created_at, 'YYYY-MM') = p_mes
      GROUP BY estado) AS t),
    'top_clientes', (SELECT jsonb_agg(row_to_json(t)) FROM (
      SELECT c.razon_social, SUM(comp.total) AS total_ventas, COUNT(*) AS num_comprobantes
      FROM comprobantes comp JOIN clientes c ON c.id = comp.cliente_id
      WHERE comp.empresa_id = p_empresa_id AND comp.tipo_comprobante = '01' AND comp.estado = 'AUT'
      AND to_char(comp.fecha_emision, 'YYYY-MM') = p_mes
      GROUP BY c.razon_social ORDER BY total_ventas DESC LIMIT 5) AS t)
  );

  -- Upsert en cache
  INSERT INTO dashboard_cache (empresa_id, periodo, metricas, calculado_at)
  VALUES (p_empresa_id, p_mes, v_metricas, now())
  ON CONFLICT (empresa_id, periodo)
  DO UPDATE SET metricas = v_metricas, calculado_at = now();

  RETURN v_metricas;
END;
$$;

-- 8. RLS para nuevas tablas
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven suscripción de su empresa" ON suscripciones
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven notificaciones de su empresa" ON notificaciones
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

ALTER TABLE dashboard_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven cache de su empresa" ON dashboard_cache
  FOR ALL USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- 9. TRIGGER updated_at para nuevas tablas
CREATE TRIGGER update_suscripciones_updated_at
  BEFORE UPDATE ON suscripciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 10. SEED: Crear suscripción trial para empresas existentes sin suscripción
INSERT INTO suscripciones (empresa_id, plan_id, estado, trial_ends_at)
SELECT e.id, p.id, 'trial', now() + INTERVAL '14 days'
FROM empresas e
CROSS JOIN planes p
WHERE p.nombre = 'professional'
AND NOT EXISTS (SELECT 1 FROM suscripciones s WHERE s.empresa_id = e.id)
ON CONFLICT (empresa_id) DO NOTHING;
```

---

# 4. ESTRUCTURA DE ARCHIVOS — Fase 6

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.js                    # ★ REESCRIBIR: Dashboard analítico completo
│   │   ├── compras/
│   │   │   └── nuevo/page.js              # ★ NUEVO: Formulario compra (reemplaza modal)
│   │   ├── empleados/
│   │   │   └── nuevo/page.js              # ★ NUEVO: Formulario empleado (reemplaza modal)
│   │   └── suscripcion/
│   │       └── page.js                    # ★ NUEVO: Portal gestión suscripción
│   └── api/
│       ├── dashboard/
│       │   └── metricas/route.js          # ★ NUEVO: API métricas dashboard
│       ├── suscripciones/
│       │   ├── verificar/route.js         # ★ NUEVO: API verificar límites
│       │   └── cambiar-plan/route.js      # ★ NUEVO: API cambiar plan
│       └── notificaciones/
│           └── route.js                   # ★ NUEVO: API notificaciones CRUD
│
├── lib/
│   ├── suscripciones/
│   │   ├── plan-limits.js                 # ★ NUEVO: Definición límites por plan
│   │   ├── subscription-guard.js          # ★ NUEVO: Middleware verificación plan
│   │   └── usage-tracker.js               # ★ NUEVO: Tracking uso por empresa
│   ├── notificaciones/
│   │   ├── notification-engine.js         # ★ NUEVO: Motor de notificaciones
│   │   └── vencimientos-scheduler.js      # ★ NUEVO: Cálculo vencimientos tributarios
│   └── dashboard/
│       ├── metricas-service.js            # ★ NUEVO: Servicio métricas con cache
│       └── prediccion-ia.js              # ★ NUEVO: Predicciones con Gemini
│
├── actions/
│   ├── suscripcion-actions.js             # ★ NUEVO: Server Actions suscripciones
│   ├── notificacion-actions.js            # ★ NUEVO: Server Actions notificaciones
│   └── dashboard-actions.js              # ★ NUEVO: Server Actions dashboard
│
├── components/
│   ├── dashboard/
│   │   ├── VentasChart.jsx                # ★ NUEVO: Gráfico ventas (Recharts)
│   │   ├── ComprobantesPieChart.jsx       # ★ NUEVO: Distribución por tipo
│   │   ├── TendenciaMensual.jsx           # ★ NUEVO: Línea tendencia 6 meses
│   │   ├── TopClientes.jsx                # ★ NUEVO: Ranking clientes
│   │   ├── PrediccionIA.jsx               # ★ NUEVO: Widget predicción IA
│   │   └── UsageMeter.jsx                 # ★ NUEVO: Medidor uso del plan
│   ├── notificaciones/
│   │   ├── NotificationBell.jsx           # ★ NUEVO: Campanita en Topbar
│   │   ├── NotificationPanel.jsx          # ★ NUEVO: Panel dropdown notificaciones
│   │   └── NotificationCard.jsx           # ★ NUEVO: Card individual
│   └── comprobantes/
│       └── StatusBadge.jsx                # ★ REESCRIBIR: Unificado (reemplaza GlassBadge)
│
└── __tests__/                             # ★ NUEVO: Suite de tests
    ├── lib/
    │   ├── xml-builders.test.js           # Tests XML builders (6 tipos)
    │   ├── clave-acceso.test.js           # Tests clave 49 dígitos
    │   ├── ats-consolidator.test.js       # Tests consolidador ATS
    │   ├── plan-limits.test.js            # Tests límites de plan
    │   └── sri-catalogs.test.js           # Tests catálogos SRI
    ├── actions/
    │   └── comprobante-actions.test.js    # Tests server actions
    └── components/
        └── StatusBadge.test.js            # Tests componente unificado
```

**Total archivos nuevos: ~28**  
**Archivos a modificar: ~16**  
**Archivos a eliminar: 1** (`GlassBadge.jsx`)

---

# 5. IMPLEMENTACIÓN DETALLADA POR DÍA

## DÍA 1: Unificación UI/UX — Fases A-F del Plan UI Unificado

### 5.1.1 Reescribir StatusBadge.jsx (Fase A)

Unificar `StatusBadge` y eliminar `GlassBadge`. El nuevo componente cubre TODOS los estados:

```javascript
// src/components/comprobantes/StatusBadge.jsx
'use client';

const STATUS_CONFIG = {
  // --- SRI (comprobantes electrónicos) ---
  AUT:       { label: 'Autorizado', color: '--color-success', muted: '--color-success-muted' },
  REC:       { label: 'Recibido', color: '--color-info', muted: '--color-info-muted' },
  ENV:       { label: 'Enviado', color: '--color-info', muted: '--color-info-muted' },
  FIR:       { label: 'Firmado', color: '--color-warning', muted: '--color-warning-muted' },
  BOR:       { label: 'Borrador', color: '--color-accent-slate', muted: '--color-neutral-muted' },
  NAU:       { label: 'No Autorizado', color: '--color-danger', muted: '--color-danger-muted' },
  DEV:       { label: 'Devuelto', color: '--color-danger', muted: '--color-danger-muted' },
  ERR:       { label: 'Error', color: '--color-danger', muted: '--color-danger-muted' },
  ANU:       { label: 'Anulado', color: '--color-accent-slate', muted: '--color-neutral-muted' },
  PROCESANDO:{ label: 'Procesando', color: '--color-warning', muted: '--color-warning-muted' },

  // --- Genéricos (CRUD: clientes, productos, empleados, establecimientos) ---
  activo:    { label: 'Activo', color: '--color-success', muted: '--color-success-muted' },
  inactivo:  { label: 'Inactivo', color: '--color-accent-slate', muted: '--color-neutral-muted' },
  pendiente: { label: 'Pendiente', color: '--color-warning', muted: '--color-warning-muted' },

  // --- Suscripciones ---
  trial:     { label: 'Prueba', color: '--color-info', muted: '--color-info-muted' },
  activa:    { label: 'Activa', color: '--color-success', muted: '--color-success-muted' },
  suspendida:{ label: 'Suspendida', color: '--color-warning', muted: '--color-warning-muted' },
  cancelada: { label: 'Cancelada', color: '--color-danger', muted: '--color-danger-muted' },
};

export default function StatusBadge({ status, label: customLabel, className = '' }) {
  const key = String(status).trim();
  const config = STATUS_CONFIG[key] || STATUS_CONFIG[key.toUpperCase()] || STATUS_CONFIG[key.toLowerCase()];

  if (!config) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${className}`}
        style={{ background: 'var(--glass-hover)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
        {customLabel || status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${className}`}
      style={{ background: `var(${config.muted})`, color: `var(${config.color})` }}>
      {customLabel || config.label}
    </span>
  );
}
```

**Acciones complementarias Día 1:**
- Eliminar `src/components/ui/GlassBadge.jsx`
- Buscar y reemplazar todos los imports de `GlassBadge` por `StatusBadge`
- Crear `src/app/(dashboard)/compras/nuevo/page.js` (formulario página, no modal)
- Crear `src/app/(dashboard)/empleados/nuevo/page.js` (formulario página, no modal)
- Aplicar correcciones monochrome en Dashboard (iconos KPI sin colores decorativos)
- Aplicar correcciones monochrome en Hub Reportes (iconos sin colores)
- Corregir montos sin color en Reporte Ventas
- Hacer stepper ComprobanteTimeline monochrome (sin verde en pasos completados)

---

## DÍA 2: Correcciones Seguridad + Migración BD

### 5.2.1 Fix `search_path` mutable

Aplicar la función corregida de `calcular_total_ventas_periodo()` con `SET search_path = public` (incluida en migración 012).

### 5.2.2 Habilitar protección contraseñas filtradas

Ejecutar en Supabase Dashboard → Authentication → Settings:
- Habilitar `Leaked Password Protection`
- O vía SQL: `ALTER ROLE authenticator SET password.require_breach_check = 'on';`

### 5.2.3 Aplicar migración 012

Ejecutar `012_dashboard_suscripciones_fase6.sql` completa:
- 3 tablas nuevas: `suscripciones`, `notificaciones`, `dashboard_cache`
- 4 funciones: `contar_comprobantes_mes`, `verificar_limite_plan`, `calcular_metricas_dashboard`, fix `calcular_total_ventas_periodo`
- RLS + índices + triggers
- Seed de suscripción trial para empresas existentes

---

## DÍAS 3-4: Dashboard Analítico — Backend + Widgets

### 5.3.1 Servicio de métricas (`src/lib/dashboard/metricas-service.js`)

```javascript
'use server';
import { createClient } from '@/lib/supabase/server';

export async function obtenerMetricasDashboard(empresaId, mes) {
  const supabase = await createClient();

  // Intentar desde cache primero (< 5 min)
  const { data: cached } = await supabase
    .from('dashboard_cache')
    .select('metricas, calculado_at')
    .eq('empresa_id', empresaId)
    .eq('periodo', mes)
    .single();

  const cincoMinutos = 5 * 60 * 1000;
  if (cached && (Date.now() - new Date(cached.calculado_at).getTime()) < cincoMinutos) {
    return cached.metricas;
  }

  // Recalcular vía RPC
  const { data, error } = await supabase.rpc('calcular_metricas_dashboard', {
    p_empresa_id: empresaId,
    p_mes: mes,
  });

  if (error) throw error;
  return data;
}

export async function obtenerHistoricoVentas(empresaId, meses = 6) {
  const supabase = await createClient();
  const resultados = [];

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date();
    fecha.setMonth(fecha.getMonth() - i);
    const mes = fecha.toISOString().slice(0, 7);

    const { data } = await supabase
      .from('comprobantes')
      .select('total')
      .eq('empresa_id', empresaId)
      .eq('tipo_comprobante', '01')
      .eq('estado', 'AUT')
      .gte('fecha_emision', `${mes}-01`)
      .lt('fecha_emision', `${mes}-32`);

    resultados.push({
      mes: fecha.toLocaleString('es', { month: 'short' }),
      ventas: data?.reduce((sum, c) => sum + parseFloat(c.total || 0), 0) || 0,
    });
  }
  return resultados;
}
```

### 5.3.2 Widgets Recharts

**VentasChart.jsx** — Gráfico de barras ventas últimos 6 meses:
```jsx
'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VentasChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
        <XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
          }}
          formatter={(value) => [`$${value.toFixed(2)}`, 'Ventas']}
        />
        <Bar dataKey="ventas" fill="var(--text-secondary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**ComprobantesPieChart.jsx** — Distribución por tipo de comprobante  
**TendenciaMensual.jsx** — Línea tendencia con área  
**TopClientes.jsx** — Tabla ranking top 5 clientes por ventas  
**UsageMeter.jsx** — Barra progreso uso del plan (comprobantes usados / límite)

---

## DÍAS 5-6: Dashboard Analítico — UI + Predicciones IA

### 5.5.1 Predicciones IA (`src/lib/dashboard/prediccion-ia.js`)

```javascript
'use server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generarPrediccion(metricas, historicoVentas) {
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: `Eres un analista tributario ecuatoriano. Analiza métricas de facturación electrónica y genera insights concisos en español. Máximo 3 insights de 1 línea cada uno. No inventes datos. Formato: bullet points cortos.`,
    prompt: `Métricas del mes actual: ${JSON.stringify(metricas)}
Histórico ventas últimos 6 meses: ${JSON.stringify(historicoVentas)}

Genera 3 insights breves sobre tendencias, anomalías o recomendaciones tributarias.`,
    maxTokens: 300,
  });
  return text;
}
```

### 5.5.2 Página Dashboard reescrita

El dashboard existente (`src/app/(dashboard)/dashboard/page.js`) se reescribe completamente con:

1. **4 KPIs superiores** (monochrome, sin colores decorativos) con variación % respecto al mes anterior
2. **Gráfico de barras** ventas últimos 6 meses (VentasChart)
3. **Pie chart** distribución por tipo de comprobante
4. **Barra de uso del plan** (comprobantes usados vs límite)
5. **Top 5 clientes** del mes
6. **Widget predicción IA** con 3 insights
7. **Acceso rápido** a Asistente Tributario IA (monochrome)
8. **Próximos vencimientos** tributarios (según noveno dígito RUC)

Toda la interfaz sigue el principio **"Color = Información, no decoración"**.

---

## DÍAS 7-8: Motor de Suscripciones — Backend

### 5.7.1 Definición de límites (`src/lib/suscripciones/plan-limits.js`)

```javascript
export const PLAN_LIMITS = {
  starter: {
    comprobantes_mes: 50,
    usuarios: 1,
    establecimientos: 1,
    puntos_emision: 1,
    reportes_ia: false,
    rdep: false,
    precio_mensual: 9.99,
  },
  professional: {
    comprobantes_mes: 300,
    usuarios: 5,
    establecimientos: 3,
    puntos_emision: 5,
    reportes_ia: true,
    rdep: true,
    precio_mensual: 24.99,
  },
  enterprise: {
    comprobantes_mes: null, // ilimitado
    usuarios: null,
    establecimientos: null,
    puntos_emision: null,
    reportes_ia: true,
    rdep: true,
    precio_mensual: 49.99,
  },
};
```

### 5.7.2 Guard de suscripción (`src/lib/suscripciones/subscription-guard.js`)

```javascript
'use server';
import { createClient } from '@/lib/supabase/server';

export async function verificarPermisoEmision(empresaId) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('verificar_limite_plan', {
    p_empresa_id: empresaId,
  });
  if (error) return { permitido: false, razon: 'Error verificando suscripción' };
  return data;
}

export async function verificarAccesoFeature(empresaId, feature) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('suscripciones')
    .select('planes(nombre, tiene_reportes_ia, tiene_rdep)')
    .eq('empresa_id', empresaId)
    .in('estado', ['activa', 'trial'])
    .single();

  if (!data) return false;

  const plan = data.planes;
  switch (feature) {
    case 'reportes_ia': return plan.tiene_reportes_ia;
    case 'rdep': return plan.tiene_rdep;
    case 'analisis_ia': return plan.tiene_reportes_ia;
    default: return true;
  }
}
```

### 5.7.3 Integración en orquestador de comprobantes

Modificar `src/lib/comprobantes/comprobante-orchestrator.js` para verificar límites **antes** de procesar:

```javascript
// Al inicio de procesarComprobante():
import { verificarPermisoEmision } from '@/lib/suscripciones/subscription-guard';

const permiso = await verificarPermisoEmision(empresa.id);
if (!permiso.permitido) {
  return {
    success: false,
    error: `${permiso.razon}. Plan actual: ${permiso.plan}. Usados: ${permiso.usados}/${permiso.limite}`,
  };
}
```

---

## DÍA 9: Motor de Suscripciones — UI + Portal

### 5.9.1 Página de suscripción (`src/app/(dashboard)/suscripcion/page.js`)

Portal de gestión con:
- Plan actual (nombre, precio, estado)
- Medidor de uso (comprobantes usados / límite)
- Comparativa de planes (3 cards: starter, professional, enterprise)
- Botón cambiar plan (con confirmación)
- Historial de suscripción
- Estado del trial (días restantes si aplica)

### 5.9.2 Server Actions suscripciones

```javascript
// src/actions/suscripcion-actions.js
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function obtenerSuscripcion() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data } = await supabase
    .from('suscripciones')
    .select('*, planes(*)')
    .eq('empresa_id', /* empresa del user */)
    .single();

  return { data };
}

export async function cambiarPlan(prevState, formData) {
  // Validar, actualizar plan, registrar notificación
  // En esta fase NO se integra pasarela de pago
  // Solo se cambia el plan y se registra la acción
}
```

### 5.9.3 Enlace en Sidebar

Agregar entrada "Suscripción" en el Sidebar y MobileMenu debajo de Configuración.

---

## DÍA 10: Sistema de Notificaciones

### 5.10.1 Motor de notificaciones (`src/lib/notificaciones/notification-engine.js`)

```javascript
'use server';
import { createClient } from '@/lib/supabase/server';

export async function crearNotificacion(empresaId, { tipo, titulo, mensaje, accionUrl, metadata }) {
  const supabase = await createClient();
  return supabase.from('notificaciones').insert({
    empresa_id: empresaId, tipo, titulo, mensaje,
    accion_url: accionUrl, metadata,
  });
}

export async function obtenerNotificaciones(empresaId, { limit = 20, soloNoLeidas = false } = {}) {
  const supabase = await createClient();
  let query = supabase.from('notificaciones')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (soloNoLeidas) query = query.eq('leida', false);
  return query;
}

export async function marcarComoLeida(notificacionId) {
  const supabase = await createClient();
  return supabase.from('notificaciones')
    .update({ leida: true })
    .eq('id', notificacionId);
}

export async function contarNoLeidas(empresaId) {
  const supabase = await createClient();
  const { count } = await supabase.from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
    .eq('leida', false);
  return count || 0;
}
```

### 5.10.2 Componentes UI notificaciones

**NotificationBell.jsx** — Campanita con badge contador en el Topbar  
**NotificationPanel.jsx** — Panel dropdown con lista de notificaciones  
**NotificationCard.jsx** — Card individual con tipo, título, tiempo relativo y acción

### 5.10.3 Vencimientos tributarios automáticos

Reutilizar el módulo existente de vencimientos (de Fase 5) para generar notificaciones automáticas:
- Tipo `vencimiento_tributario`: 5 días antes del vencimiento según noveno dígito RUC
- Tipo `limite_plan`: cuando el uso alcanza 80% y 95% del límite
- Tipo `certificado_expira`: 30 días antes de expiración del .p12

---

## DÍAS 11-12: Testing + Verificación

### 5.11.1 Suite de tests con Vitest

```javascript
// src/__tests__/lib/xml-builders.test.js
import { describe, it, expect } from 'vitest';
import { construirXMLFactura } from '@/lib/xml/factura-builder';
import { construirXMLNotaCredito } from '@/lib/xml/nota-credito-builder';
// ... demás builders

describe('XML Builders', () => {
  const datosBase = {
    empresa: { ruc: '1790012345001', razonSocial: 'TEST', ambiente: '1' },
    establecimiento: { codigo: '001', direccion: 'Quito' },
    puntoEmision: { codigo: '001' },
    // ...
  };

  it('genera XML factura v1.1.0 válido', () => {
    const xml = construirXMLFactura({ ...datosBase, detalles: [/*...*/] });
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<factura id="comprobante" version="1.1.0">');
    expect(xml).toContain('<codDoc>01</codDoc>');
  });

  it('genera clave de acceso de 49 dígitos con Módulo 11', () => {
    // Verificar longitud, formato fecha, tipo doc, RUC, etc.
  });

  // Tests para cada builder: NC(04), ND(05), GR(06), Ret(07), LC(03)
});

describe('ATS Consolidator', () => {
  it('excluye compras con retención electrónica autorizada', () => { /* ... */ });
  it('genera XML con encoding ISO-8859-1', () => { /* ... */ });
  it('soporta periodicidad mensual y semestral RIMPE', () => { /* ... */ });
});

describe('Plan Limits', () => {
  it('starter permite máximo 50 comprobantes/mes', () => { /* ... */ });
  it('enterprise tiene límites ilimitados (null)', () => { /* ... */ });
  it('bloquea emisión cuando se alcanza el límite', () => { /* ... */ });
});
```

### 5.11.2 Datos de prueba SRI (tipos 03-07)

Preparar y emitir contra el ambiente de pruebas SRI:
- 1 Liquidación de Compra (03) al receptor de pruebas
- 1 Nota de Crédito (04) referenciando factura existente
- 1 Nota de Débito (05) referenciando factura existente
- 1 Guía de Remisión (06) con destinatario de prueba
- 1 Comprobante de Retención (07) referenciando factura existente

**Receptor de pruebas SRI:** PRUEBAS SERVICIO DE RENTAS INTERNAS (RUC: 1760013210001)

### 5.11.3 Verificación `npm run build`

Ejecutar build completo para confirmar cero errores tras todos los cambios.

---

# 6. DEPENDENCIAS CRÍTICAS

```
Fase 6 depende de:
├── ✅ Fases 1-5 + 5.1 completadas
├── ✅ Recharts 3.7 (ya en package.json)
├── ✅ Vitest (ya en package.json)
├── ✅ @ai-sdk/google + @ai-sdk/react (ya configurados)
├── 🔑 GEMINI_API_KEY configurada (ya existe)
├── 🔑 SRI_WS_RECEPCION_PRUEBAS (ya existe)
├── 🔑 Certificado .p12 funcional en Supabase Storage (ya existe)
├── 🔧 Supabase Dashboard: habilitar leaked password protection
├── 📦 Sin nuevas dependencias npm
└── 📐 Aplicar migración 012 en Supabase
```

---

# 7. CHECKLIST FINAL — FASE 6

## A. Unificación UI/UX (Día 1)
- [ ] StatusBadge reescrito con todos los estados (SRI + genéricos + suscripciones)
- [ ] GlassBadge.jsx eliminado
- [ ] Todos los imports de GlassBadge reemplazados por StatusBadge
- [ ] Formulario compras en `/compras/nuevo` (no modal)
- [ ] Formulario empleados en `/empleados/nuevo` (no modal)
- [ ] Dashboard KPIs monochrome (sin colores decorativos en iconos)
- [ ] Hub Reportes monochrome (sin colores decorativos en iconos)
- [ ] ComprobanteTimeline monochrome (pasos completados sin verde)
- [ ] Montos de ventas sin color (solo `--text-primary`)
- [ ] Chevrons de navegación en Configuración
- [ ] Botones descarga ATS con estilo `secondary` unificado
- [ ] Labels visibles en filtros GlassSelect de listas CRUD

## B. Seguridad (Día 2)
- [ ] Fix `search_path` en `calcular_total_ventas_periodo()`
- [ ] Protección contraseñas filtradas habilitada
- [ ] Migración 012 aplicada exitosamente
- [ ] 3 tablas nuevas con RLS verificado
- [ ] 4 funciones nuevas operativas
- [ ] Seed suscripción trial para empresas existentes

## C. Dashboard Analítico (Días 3-6)
- [ ] VentasChart (barras 6 meses) funcional
- [ ] ComprobantesPieChart (distribución por tipo) funcional
- [ ] TendenciaMensual (línea con área) funcional
- [ ] TopClientes (ranking top 5) funcional
- [ ] KPIs con variación % respecto al mes anterior
- [ ] Widget predicción IA con 3 insights de Gemini
- [ ] UsageMeter (barra progreso uso plan) funcional
- [ ] Próximos vencimientos tributarios (noveno dígito RUC)
- [ ] Cache de métricas con invalidación 5 min
- [ ] API route `/api/dashboard/metricas` funcional

## D. Motor Suscripciones (Días 7-9)
- [ ] Guard `verificarPermisoEmision()` integrado en orquestador
- [ ] Guard `verificarAccesoFeature()` para reportes IA y RDEP
- [ ] Portal suscripción `/suscripcion` con plan actual y uso
- [ ] Comparativa de planes (3 cards)
- [ ] Cambio de plan funcional (sin pasarela de pago en esta fase)
- [ ] Entrada "Suscripción" en Sidebar y MobileMenu
- [ ] Bloqueo de emisión al alcanzar límite muestra mensaje claro

## E. Notificaciones (Día 10)
- [ ] NotificationBell en Topbar con contador
- [ ] NotificationPanel dropdown con lista
- [ ] NotificationCard con tipo, tiempo relativo, acción
- [ ] Notificación automática vencimiento tributario (5 días antes)
- [ ] Notificación automática límite plan (80% y 95%)
- [ ] Marcar como leída funcional
- [ ] Server Actions notificaciones operativas

## F. Testing (Días 11-12)
- [ ] Tests XML builders (6 tipos) pasando
- [ ] Tests clave de acceso 49 dígitos pasando
- [ ] Tests ATS consolidator pasando
- [ ] Tests plan limits pasando
- [ ] Tests catálogos SRI pasando
- [ ] 1 Liquidación de Compra (03) autorizada en ambiente pruebas
- [ ] 1 Nota de Crédito (04) autorizada en ambiente pruebas
- [ ] 1 Nota de Débito (05) autorizada en ambiente pruebas
- [ ] 1 Guía de Remisión (06) autorizada en ambiente pruebas
- [ ] 1 Retención (07) autorizada en ambiente pruebas
- [ ] `npm run build` exitoso sin errores
- [ ] Deploy staging exitoso via CI/CD

---

# 8. ENTREGABLES NO INCLUIDOS EN FASE 6 (Fase 7)

Los siguientes items quedan explícitamente para la Fase 7:

| Item | Razón de exclusión |
|------|-------------------|
| Pasarela de pago (Stripe/PaymentEz) | Requiere cuenta merchant y configuración bancaria |
| Multi-usuario por empresa | Requiere flujo de invitaciones y roles |
| Exportación PDF de reportes (formularios llenos) | Se conserva Excel, PDF es complementario |
| Tests E2E con Playwright | Requiere setup de browser testing |
| Monitoreo y logging (Sentry/DataDog) | Infraestructura de producción |
| Optimización de rendimiento (lazy loading, ISR) | Performance tuning pre-lanzamiento |
| Documentación API pública | Solo si se abre API a terceros |

---

# 9. RESUMEN EJECUTIVO

La **Fase 6** consolida facturIA como un **producto SaaS viable comercialmente** a través de tres pilares:

- **Dashboard Analítico** transforma datos dispersos en inteligencia visual con gráficos Recharts y predicciones IA Gemini, dando al usuario una vista 360° de su actividad tributaria.

- **Motor de Suscripciones** implementa el modelo de negocio SaaS con enforcement de límites por plan (starter/professional/enterprise), control de uso y portal de gestión, preparando la plataforma para monetización.

- **Consolidación de Calidad** resuelve las 6 inconsistencias UI detectadas en auditoría, corrige los 2 warnings de seguridad pendientes, y ejecuta testing real contra el SRI para los 5 tipos de comprobantes sin verificar.

**Duración:** 12 días hábiles  
**Archivos nuevos:** ~28  
**Tablas BD nuevas:** 3 + 4 funciones  
**Dependencias npm nuevas:** 0  
**Reutilización infraestructura:** ~70%
