# facturIA — Fase 8: SuperAdmin, Freemium, Enforcement de Permisos y Hardening
## Plan de Implementación Detallado

**Proyecto:** facturIA SaaS — Facturación Electrónica con IA  
**Fase:** 8 — SuperAdmin + Freemium + RLS Unificado + E2E (14 días hábiles)  
**Stack verificado:** Next.js 16 · React 19 · JavaScript · Supabase · Tailwind 4 · AWS App Runner  
**IA:** Google Gemini 3 Flash (`@ai-sdk/google`) + Vercel AI SDK 3.x (v6 UIMessage)  
**Pagos:** Gratuito activo; Stripe pausado; PayPal pendiente de implementación  
**Fecha:** Marzo 2026

---

# 0. AUDITORÍA PRE-FASE 8 — Verificación Completa Fase 7

## 0.1 Estado de Issues Linear (Proyecto FacturIA)

| Issue | Título | Estado | Verificación |
|-------|--------|:------:|:------------:|
| DAT-183 | [F7] Fix Chat IA $0.00 + Chat Premium + Migración 013 | ✅ Done | Código verificado: 7 componentes chat, fix closure stale |
| DAT-184 | [F7] Stripe + Multi-usuario + Sentry | ✅ Done | Stripe 3 API routes, permisos.js con 5 roles, instrumentation.js |
| DAT-185 | [F7] Stripe checkout verificado + webhook fix plan_id | ✅ Done | Pago test 4242 exitoso, webhook sincroniza plan_id |
| DAT-171 | [F6] Unificación UI/UX | ✅ Done | StatusBadge 119 líneas, GlassBadge eliminado |
| DAT-173 | [F6] Dashboard Analítico Recharts | ✅ Done | 6 widgets implementados |
| DAT-174 | [F6] Motor Suscripciones | ✅ Done | plan-limits.js, subscription-guard.js |
| DAT-175 | [F6] Notificaciones | ✅ Done | NotificationBell + Panel + Engine |
| DAT-176 | [F6] Tests Vitest + SRI 03-07 | ✅ Done | 22 archivos, 190 tests, 0 fallos |

## 0.2 Estado Supabase (Verificado via MCP)

| Métrica | Valor |
|---------|-------|
| Tablas públicas | **30** |
| Migraciones aplicadas | **21** |
| RLS habilitado | **30/30** (100%) |
| Funciones RPC | 4 (verificar_limite_plan, contar_comprobantes_mes, calcular_metricas_dashboard, calcular_total_ventas_periodo) |
| Postgres | v17.6 |

## 0.3 Estado Pagos

| Plan | Precio mensual | Precio anual | Documentos | Estado |
|------|----------------|--------------|------------|--------|
| Gratuito | $0.00/mes | $0.00/año | 100/año | ✅ Activo |
| Starter | $9.99/mes | $119.88/año | 500/año | Muy pronto |
| Professional | $24.99/mes | $299.88/año | 1000/año | Muy pronto |
| Enterprise | $49.99/mes | $599.88/año | Ilimitados | Muy pronto |

**Decisión actual:** Stripe fue verificado solo en modo test y queda deshabilitado temporalmente. Los endpoints de checkout, portal y webhook responden `503`. La próxima pasarela a evaluar para producción es PayPal con suscripciones recurrentes, webhooks firmados y pruebas E2E.

## 0.4 Estado Slack (Verificado via MCP)

Canal `#facturia` confirma:
- ✅ Mensaje F7 implementada (24-mar, 23:05)
- ✅ Stripe integrado y verificado (24-mar, 01:19)
- ✅ Migración 012 aplicada exitosamente
- ✅ Fase 6 implementada

## 0.5 ⚠️ HALLAZGOS CRÍTICOS — Input para Fase 8

### HALLAZGO 1 — RLS Inconsistente (CRÍTICO)

**24 tablas** usan el patrón legacy `empresas.user_id = auth.uid()` que solo funciona para el propietario original.  
**Solo 4 tablas** usan el patrón correcto `perfiles_empresa.user_id = auth.uid()` que soporta multi-usuario.

**Impacto:** El sistema multi-usuario de Fase 7 está **fundamentalmente roto** para 24 de 30 tablas. Un usuario invitado (contador, emisor, visor) no puede ver NINGÚN dato de la empresa porque las políticas RLS lo excluyen.

| Tablas con RLS Legacy (24) | Tablas con RLS Multi-usuario (4) |
|----------------------------|----------------------------------|
| empresas, clientes, productos, comprobantes, comprobante_detalles, comprobante_impuestos, comprobante_pagos, certificados, establecimientos, puntos_emision, secuenciales, config_email, ia_conversaciones, compras_recibidas, compras_recibidas_retenciones, empleados, empleados_ingresos_anuales, reportes_sri, sri_log, guia_remision_destinatarios, guia_remision_detalles, suscripciones, notificaciones, dashboard_cache | perfiles_empresa, invitaciones, chat_sesiones, chat_mensajes |

### HALLAZGO 2 — Sin Rol SuperAdmin de Plataforma

El sistema actual tiene solo roles **a nivel de empresa** (`propietario`, `admin`, `contador`, `emisor`, `visor`). No existe un concepto de administrador de plataforma que pueda:
- Ver métricas globales de todas las empresas
- Gestionar planes y suscripciones
- Soporte técnico sin violar privacidad
- Administrar la plataforma SaaS

El usuario actual (israelgo93@gmail.com) tiene:
- `role: authenticated` (auth.users) — sin distinción de superadmin
- `rol: propietario` (perfiles_empresa) — solo alcance de su empresa
- Suscripción Starter ($9.99) — con restricciones que no se aplican correctamente

### HALLAZGO 3 — Sin Freemium/Trial para Nuevos Usuarios

- `trial_ends_at` en la suscripción actual es **NULL**
- El seed original creaba un trial de 14 días en plan `professional`, pero tras el pago Stripe se actualizó a `starter` activa
- **Nuevos usuarios que se registren no recibirán ningún trial/freemium**
- No hay lógica en el onboarding que cree automáticamente una suscripción trial

### HALLAZGO 4 — Enforcement Parcial de Suscripción

La cuenta actual tiene plan **Starter** que según `plan-limits.js`:
- `reportes_ia: false` — Pero el chat IA y predicciones están accesibles
- `rdep: false` — Pero la ruta `/reportes` no bloquea RDEP
- `usuarios: 1` — Pero `/equipo` permite invitar miembros
- `establecimientos: 1` — Sin verificación en configuración
- `puntos_emision: 1` — Sin verificación en configuración

`verificarPermisoEmision()` solo valida `limite_comprobantes_mes`. Las demás restricciones existen en la definición pero **no se aplican en el código**.

### HALLAZGO 5 — Items Diferidos de Fase 7

| Item | Estado |
|------|--------|
| Tests E2E Playwright | ❌ No implementado |
| Optimización rendimiento (lazy loading, ISR) | ❌ No implementado |
| Sentry DSN configurado | ❌ Solo stub (sin DSN en producción) |
| `current_period_start/end` en BD | ❌ NULL (webhook no los sincroniza) |

---

# 1. RESUMEN EJECUTIVO — FASE 8

La **Fase 8** resuelve los 5 hallazgos críticos de la auditoría y prepara facturIA para su lanzamiento comercial con 4 pilares:

1. **SuperAdmin de Plataforma** — Rol transversal que gestiona todas las empresas, suscripciones y métricas globales sin violar la privacidad de datos de cada empresa.

2. **Freemium + Trial Automático** — capa gratuita para nuevos registros, con planes pagos visibles como "Muy pronto" hasta implementar una pasarela de producción.

3. **Unificación RLS + Enforcement Completo** — Migrar las 24 tablas al patrón `perfiles_empresa` y aplicar todas las restricciones del plan (no solo comprobantes).

4. **E2E Testing + Hardening** — Playwright para flujos críticos, optimización de rendimiento y cierre de gaps de producción.

## 1.1 Entregables

| # | Entregable | Descripción | Prioridad | Días |
|---|-----------|-------------|:---------:|:----:|
| 1 | **Unificación RLS Multi-usuario** | Migrar 24 tablas de `empresas.user_id` a `perfiles_empresa` | CRÍTICA | 1-2 |
| 2 | **SuperAdmin Sistema** | Rol plataforma, dashboard admin, gestión global | CRÍTICA | 3-5 |
| 3 | **Freemium/Trial 14 días** | Auto-creación capa gratuita, UI countdown, pagos pausados | ALTA | 6-7 |
| 4 | **Enforcement Completo** | Guards para todas las restricciones de plan (no solo comprobantes) | ALTA | 8-9 |
| 5 | **Tests E2E Playwright** | ≥8 flujos críticos automatizados | MEDIA | 10-11 |
| 6 | **Optimización Rendimiento** | Lazy loading, bundle analysis, Core Web Vitals | MEDIA | 12-13 |
| 7 | **Cierre + Deploy** | Sentry prod, docs y análisis PayPal | MEDIA | 14 |

**Duración total:** 14 días hábiles (≈3 semanas)

## 1.2 Reutilización de Infraestructura

| Componente existente | Reutilización en Fase 8 |
|---------------------|------------------------|
| `perfiles_empresa` (tabla + RLS) | Patrón base para migración de 24 tablas |
| `verificar_limite_plan()` RPC | Extender para cubrir todas las features |
| `plan-limits.js` | Base para enforcement frontend completo |
| `subscription-guard.js` | Extender con guards de features |
| `/suscripcion` portal | Agregar countdown trial, banner upgrade |
| Módulo de pagos | Mantener Stripe pausado y preparar PayPal |
| Glass UI completo | Dashboard admin reutiliza componentes |
| RLS policies existentes | Template para migración |
| CI/CD App Runner | Pipeline existente |

**Estimación de reutilización: ~65%**

---

# 2. MIGRACIÓN DE BASE DE DATOS — Fase 8

## 2.1 Migración `014_rls_unificado_superadmin_fase8.sql`

```sql
-- =============================================
-- MIGRACIÓN 014: RLS Unificado + SuperAdmin + Trial
-- Fase 8 — facturIA SaaS
-- =============================================

-- ========================================
-- PARTE 1: SUPERADMIN
-- ========================================

-- 1.1 Columna superadmin en perfiles (no en auth.users para no acoplarnos)
ALTER TABLE perfiles_empresa
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- 1.2 Tabla para registro de acciones admin (auditoría)
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  accion TEXT NOT NULL,
  entidad TEXT NOT NULL,
  entidad_id UUID,
  detalles JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Solo admins de plataforma pueden ver el log
CREATE POLICY "admin_audit_log_superadmin" ON admin_audit_log
  FOR ALL USING (
    admin_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM perfiles_empresa
      WHERE user_id = auth.uid() AND is_platform_admin = true
    )
  );

-- 1.3 Vista materializada para métricas globales (no expone datos privados)
CREATE OR REPLACE VIEW v_admin_metricas_globales AS
SELECT
  (SELECT count(*) FROM empresas) as total_empresas,
  (SELECT count(*) FROM auth.users) as total_usuarios,
  (SELECT count(*) FROM comprobantes WHERE created_at >= date_trunc('month', now())) as comprobantes_mes_actual,
  (SELECT count(*) FROM comprobantes) as total_comprobantes,
  (SELECT count(*) FROM suscripciones WHERE estado = 'activa') as suscripciones_activas,
  (SELECT count(*) FROM suscripciones WHERE estado = 'trial') as suscripciones_trial,
  (SELECT count(*) FROM suscripciones WHERE estado = 'cancelada') as suscripciones_canceladas,
  (SELECT json_agg(json_build_object(
    'plan', p.nombre,
    'count', sub.cnt
  )) FROM (
    SELECT plan_id, count(*) as cnt FROM suscripciones
    WHERE estado IN ('activa', 'trial')
    GROUP BY plan_id
  ) sub JOIN planes p ON p.id = sub.plan_id) as distribucion_planes;

-- ========================================
-- PARTE 2: TRIAL/FREEMIUM
-- ========================================

-- 2.1 Columna trial en planes
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS trial_dias INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_freemium BOOLEAN DEFAULT false;

-- 2.2 Actualizar plan starter con trial de 14 días
UPDATE planes SET trial_dias = 14, es_freemium = true WHERE nombre = 'starter';

-- 2.3 Función para crear suscripción trial automáticamente
CREATE OR REPLACE FUNCTION crear_suscripcion_trial(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_id UUID;
  v_trial_dias INTEGER;
  v_sub_id UUID;
BEGIN
  -- Verificar si ya tiene suscripción
  IF EXISTS (SELECT 1 FROM suscripciones WHERE empresa_id = p_empresa_id) THEN
    RETURN jsonb_build_object('success', false, 'razon', 'Ya tiene suscripción');
  END IF;

  -- Obtener plan starter (freemium)
  SELECT id, trial_dias INTO v_plan_id, v_trial_dias
  FROM planes WHERE es_freemium = true AND activo = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'razon', 'No hay plan freemium disponible');
  END IF;

  -- Crear suscripción trial
  INSERT INTO suscripciones (
    empresa_id, plan_id, estado, 
    fecha_inicio, trial_ends_at,
    periodo_facturacion, comprobantes_usados_mes, mes_conteo
  ) VALUES (
    p_empresa_id, v_plan_id, 'trial',
    now(), now() + (v_trial_dias || ' days')::INTERVAL,
    'mensual', 0, to_char(now(), 'YYYY-MM')
  ) RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'suscripcion_id', v_sub_id,
    'plan', 'starter',
    'trial_ends_at', (now() + (v_trial_dias || ' days')::INTERVAL)::TEXT,
    'dias_restantes', v_trial_dias
  );
END;
$function$;

-- 2.4 Función para verificar estado de trial
CREATE OR REPLACE FUNCTION verificar_estado_trial(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT s.*, p.nombre as plan_nombre, p.trial_dias
  INTO v_sub
  FROM suscripciones s
  JOIN planes p ON p.id = s.plan_id
  WHERE s.empresa_id = p_empresa_id
  AND s.estado IN ('activa', 'trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('tiene_suscripcion', false);
  END IF;

  IF v_sub.estado = 'trial' THEN
    IF v_sub.trial_ends_at < now() THEN
      -- Trial expirado, suspender
      UPDATE suscripciones SET estado = 'suspendida'
      WHERE id = v_sub.id;
      RETURN jsonb_build_object(
        'tiene_suscripcion', true,
        'estado', 'expirado',
        'plan', v_sub.plan_nombre,
        'trial_ends_at', v_sub.trial_ends_at,
        'dias_restantes', 0,
        'requiere_pago', true
      );
    ELSE
      RETURN jsonb_build_object(
        'tiene_suscripcion', true,
        'estado', 'trial',
        'plan', v_sub.plan_nombre,
        'trial_ends_at', v_sub.trial_ends_at,
        'dias_restantes', EXTRACT(DAY FROM (v_sub.trial_ends_at - now()))::INT,
        'requiere_pago', false
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'tiene_suscripcion', true,
    'estado', v_sub.estado,
    'plan', v_sub.plan_nombre,
    'stripe_subscription_id', v_sub.stripe_subscription_id,
    'requiere_pago', false
  );
END;
$function$;

-- ========================================
-- PARTE 3: UNIFICACIÓN RLS (24 tablas)
-- ========================================

-- Función helper: verifica si el usuario tiene acceso a la empresa
-- (ya sea propietario directo o via perfiles_empresa)
CREATE OR REPLACE FUNCTION user_has_empresa_access(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM perfiles_empresa
    WHERE user_id = auth.uid()
      AND empresa_id = p_empresa_id
      AND activo = true
  );
$function$;

-- Función helper: obtener empresa_ids del usuario actual
CREATE OR REPLACE FUNCTION user_empresa_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT empresa_id FROM perfiles_empresa
  WHERE user_id = auth.uid() AND activo = true;
$function$;

-- 3.1 EMPRESAS — Permitir acceso via perfiles_empresa (no solo user_id)
DROP POLICY IF EXISTS "empresas_own" ON empresas;
CREATE POLICY "empresas_multi_tenant" ON empresas
  FOR ALL USING (
    id IN (SELECT user_empresa_ids())
  );

-- 3.2 CLIENTES
DROP POLICY IF EXISTS "clientes_tenant" ON clientes;
CREATE POLICY "clientes_multi_tenant" ON clientes
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.3 PRODUCTOS
DROP POLICY IF EXISTS "productos_tenant" ON productos;
CREATE POLICY "productos_multi_tenant" ON productos
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.4 COMPROBANTES
DROP POLICY IF EXISTS "comprobantes_tenant" ON comprobantes;
CREATE POLICY "comprobantes_multi_tenant" ON comprobantes
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.5 COMPROBANTE_DETALLES
DROP POLICY IF EXISTS "comprobante_detalles_tenant" ON comprobante_detalles;
CREATE POLICY "comprobante_detalles_multi_tenant" ON comprobante_detalles
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.6 COMPROBANTE_IMPUESTOS
DROP POLICY IF EXISTS "comprobante_impuestos_tenant" ON comprobante_impuestos;
CREATE POLICY "comprobante_impuestos_multi_tenant" ON comprobante_impuestos
  FOR ALL USING (comprobante_detalle_id IN (
    SELECT cd.id FROM comprobante_detalles cd
    WHERE cd.empresa_id IN (SELECT user_empresa_ids())
  ));

-- 3.7 COMPROBANTE_PAGOS
DROP POLICY IF EXISTS "comprobante_pagos_tenant" ON comprobante_pagos;
CREATE POLICY "comprobante_pagos_multi_tenant" ON comprobante_pagos
  FOR ALL USING (comprobante_id IN (
    SELECT id FROM comprobantes
    WHERE empresa_id IN (SELECT user_empresa_ids())
  ));

-- 3.8 CERTIFICADOS
DROP POLICY IF EXISTS "certificados_tenant" ON certificados;
CREATE POLICY "certificados_multi_tenant" ON certificados
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.9 ESTABLECIMIENTOS
DROP POLICY IF EXISTS "establecimientos_tenant" ON establecimientos;
CREATE POLICY "establecimientos_multi_tenant" ON establecimientos
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.10 PUNTOS_EMISION
DROP POLICY IF EXISTS "puntos_emision_tenant" ON puntos_emision;
CREATE POLICY "puntos_emision_multi_tenant" ON puntos_emision
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.11 SECUENCIALES
DROP POLICY IF EXISTS "secuenciales_tenant" ON secuenciales;
CREATE POLICY "secuenciales_multi_tenant" ON secuenciales
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.12 CONFIG_EMAIL
DROP POLICY IF EXISTS "config_email_tenant" ON config_email;
CREATE POLICY "config_email_multi_tenant" ON config_email
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.13 IA_CONVERSACIONES
DROP POLICY IF EXISTS "ia_conversaciones_tenant" ON ia_conversaciones;
CREATE POLICY "ia_conversaciones_multi_tenant" ON ia_conversaciones
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.14 COMPRAS_RECIBIDAS
DROP POLICY IF EXISTS "compras_recibidas_tenant" ON compras_recibidas;
CREATE POLICY "compras_recibidas_multi_tenant" ON compras_recibidas
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.15 COMPRAS_RECIBIDAS_RETENCIONES
DROP POLICY IF EXISTS "compras_recibidas_retenciones_tenant" ON compras_recibidas_retenciones;
CREATE POLICY "compras_recibidas_retenciones_multi_tenant" ON compras_recibidas_retenciones
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.16 EMPLEADOS
DROP POLICY IF EXISTS "empleados_tenant" ON empleados;
CREATE POLICY "empleados_multi_tenant" ON empleados
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.17 EMPLEADOS_INGRESOS_ANUALES
DROP POLICY IF EXISTS "empleados_ingresos_anuales_tenant" ON empleados_ingresos_anuales;
CREATE POLICY "empleados_ingresos_anuales_multi_tenant" ON empleados_ingresos_anuales
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.18 REPORTES_SRI
DROP POLICY IF EXISTS "reportes_sri_tenant" ON reportes_sri;
CREATE POLICY "reportes_sri_multi_tenant" ON reportes_sri
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.19 SRI_LOG
DROP POLICY IF EXISTS "sri_log_tenant" ON sri_log;
CREATE POLICY "sri_log_multi_tenant" ON sri_log
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.20 GUIA_REMISION_DESTINATARIOS
DROP POLICY IF EXISTS "empresa_isolation_gr_destinatarios" ON guia_remision_destinatarios;
CREATE POLICY "gr_destinatarios_multi_tenant" ON guia_remision_destinatarios
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.21 GUIA_REMISION_DETALLES
DROP POLICY IF EXISTS "empresa_isolation_gr_detalles" ON guia_remision_detalles;
CREATE POLICY "gr_detalles_multi_tenant" ON guia_remision_detalles
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.22 SUSCRIPCIONES
DROP POLICY IF EXISTS "Usuarios ven suscripcion de su empresa" ON suscripciones;
CREATE POLICY "suscripciones_multi_tenant" ON suscripciones
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.23 NOTIFICACIONES
DROP POLICY IF EXISTS "Usuarios ven notificaciones de su empresa" ON notificaciones;
CREATE POLICY "notificaciones_multi_tenant" ON notificaciones
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- 3.24 DASHBOARD_CACHE
DROP POLICY IF EXISTS "Usuarios ven cache de su empresa" ON dashboard_cache;
CREATE POLICY "dashboard_cache_multi_tenant" ON dashboard_cache
  FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- ========================================
-- PARTE 4: SUPERADMIN POLICIES
-- ========================================

-- SuperAdmin puede ver todas las empresas (lectura, sin modificar datos privados)
CREATE POLICY "empresas_superadmin_read" ON empresas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles_empresa WHERE user_id = auth.uid() AND is_platform_admin = true)
  );

-- SuperAdmin puede ver todas las suscripciones (para gestión)
CREATE POLICY "suscripciones_superadmin_read" ON suscripciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles_empresa WHERE user_id = auth.uid() AND is_platform_admin = true)
  );

-- ========================================
-- PARTE 5: ÍNDICES Y BACKFILL
-- ========================================

CREATE INDEX IF NOT EXISTS idx_perfiles_empresa_platform_admin 
  ON perfiles_empresa(user_id) WHERE is_platform_admin = true;

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin 
  ON admin_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_fecha 
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suscripciones_estado 
  ON suscripciones(estado);

CREATE INDEX IF NOT EXISTS idx_suscripciones_trial_ends 
  ON suscripciones(trial_ends_at) WHERE estado = 'trial';

-- Marcar al propietario actual como superadmin de plataforma
UPDATE perfiles_empresa SET is_platform_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'israelgo93@gmail.com' LIMIT 1);
```

**Total tablas nuevas: 1** (`admin_audit_log`)  
**Columnas nuevas: 3** (`is_platform_admin`, `trial_dias`, `es_freemium`)  
**Funciones nuevas: 4** (`user_has_empresa_access`, `user_empresa_ids`, `crear_suscripcion_trial`, `verificar_estado_trial`)  
**Políticas migradas: 24** (de legacy a multi-tenant)  
**Índices nuevos: 5**

---

# 3. ESTRUCTURA DE ARCHIVOS — Fase 8

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── admin/                              # ★ NUEVO: Panel SuperAdmin
│   │   │   ├── page.js                         # Dashboard admin con métricas globales
│   │   │   ├── empresas/page.js                # Lista de empresas (sin datos privados)
│   │   │   ├── suscripciones/page.js           # Gestión de suscripciones
│   │   │   ├── audit/page.js                   # Log de auditoría
│   │   │   └── components/
│   │   │       ├── AdminMetricsCards.jsx        # KPIs globales
│   │   │       ├── EmpresasTable.jsx           # Tabla empresas (razón social, RUC, plan, estado)
│   │   │       ├── SuscripcionesManager.jsx    # Gestión de planes
│   │   │       └── AuditLog.jsx                # Visor de auditoría
│   │   ├── suscripcion/
│   │   │   ├── page.js                         # ★ MEJORAR: Agregar trial countdown + banner
│   │   │   └── components/
│   │   │       ├── TrialBanner.jsx             # ★ NUEVO: Banner "X días restantes"
│   │   │       └── UpgradePrompt.jsx           # ★ NUEVO: Prompt upgrade al expirar trial
│   │   └── dashboard/
│   │       └── page.js                         # ★ MEJORAR: Trial banner en dashboard
│   │
│   ├── api/
│   │   ├── admin/
│   │   │   ├── metricas/route.js               # ★ NUEVO: API métricas globales
│   │   │   ├── empresas/route.js               # ★ NUEVO: API listar empresas
│   │   │   └── suscripciones/route.js          # ★ NUEVO: API gestión suscripciones admin
│   │   └── stripe/
│   │       └── webhook/route.js                # ★ MEJORAR: Sincronizar current_period_*
│   │
│   └── auth/
│       └── callback/route.js                   # ★ MEJORAR: Auto-crear trial en registro
│
├── lib/
│   ├── auth/
│   │   ├── permisos.js                         # ★ MEJORAR: Agregar 'superadmin' a PERMISOS_ROL
│   │   ├── superadmin-guard.js                 # ★ NUEVO: Middleware verificación superadmin
│   │   └── feature-gates.js                    # ★ NUEVO: Gates por plan para TODAS las features
│   ├── suscripciones/
│   │   ├── subscription-guard.js               # ★ MEJORAR: Enforcement completo
│   │   ├── trial-manager.js                    # ★ NUEVO: Gestión de trial automático
│   │   └── plan-limits.js                      # ★ MEJORAR: Agregar trial_dias
│   └── stripe/
│       └── stripe-webhooks.js                  # ★ MEJORAR: Agregar trial_period_days
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx                         # ★ MEJORAR: Sección admin condicional
│   │   └── Topbar.jsx                          # ★ MEJORAR: Trial countdown badge
│   └── suscripcion/
│       ├── FeatureGate.jsx                     # ★ NUEVO: Componente wrapper bloqueo features
│       └── UpgradeModal.jsx                    # ★ NUEVO: Modal "Upgrade para acceder"
│
├── middleware.js                                # ★ MEJORAR: Agregar protección rutas /admin
│
└── __tests__/
    ├── e2e/                                    # ★ NUEVO: Playwright E2E
    │   ├── playwright.config.js
    │   ├── auth.spec.js                        # Login → Dashboard → Logout
    │   ├── factura.spec.js                     # Crear factura → SRI
    │   ├── chat.spec.js                        # Chat IA flujo completo
    │   ├── suscripcion.spec.js                 # Portal → Plan → Stripe
    │   ├── admin.spec.js                       # SuperAdmin flujo
    │   ├── trial.spec.js                       # Trial → Expiración → Upgrade
    │   ├── permisos.spec.js                    # Roles y acceso
    │   └── reportes.spec.js                    # Hub → ATS → Descargar
    └── lib/
        ├── feature-gates.test.js               # Tests gates por plan
        ├── trial-manager.test.js               # Tests gestión trial
        └── superadmin-guard.test.js            # Tests guard admin
```

**Total archivos nuevos: ~25**  
**Archivos a modificar: ~15**

---

# 4. IMPLEMENTACIÓN DETALLADA POR DÍA

## DÍAS 1-2: Unificación RLS Multi-usuario

### 4.1.1 Aplicar Migración 014

Aplicar la migración completa que:
1. Crea funciones helper `user_empresa_ids()` y `user_has_empresa_access()`
2. Reemplaza las 24 políticas RLS legacy
3. Valida que el propietario original sigue teniendo acceso
4. Verifica que usuarios invitados ahora pueden ver datos

### 4.1.2 Verificación Post-Migración

```sql
-- Verificar que TODAS las tablas usan perfiles_empresa
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND qual LIKE '%empresas.user_id%';
-- Debe retornar 0 filas

-- Verificar acceso del propietario
SELECT verificar_limite_plan('58a582cd-174c-43e8-aa41-48adbae4db6e');
-- Debe retornar { permitido: true, ... }
```

### 4.1.3 Test de Integración Multi-usuario

1. Crear invitación para un email de prueba
2. Aceptar invitación (crear perfil_empresa con rol `emisor`)
3. Verificar que el nuevo usuario ve los datos de la empresa
4. Verificar que NO ve datos de otras empresas

---

## DÍAS 3-5: SuperAdmin de Plataforma

### 4.2.1 Guard de SuperAdmin

```javascript
// src/lib/auth/superadmin-guard.js
'use server';
import { createClient } from '@/lib/supabase/server';

export async function verificarSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isSuperAdmin: false, error: 'No autenticado' };

  const { data: perfil } = await supabase
    .from('perfiles_empresa')
    .select('is_platform_admin')
    .eq('user_id', user.id)
    .eq('is_platform_admin', true)
    .maybeSingle();

  return { 
    isSuperAdmin: !!perfil, 
    userId: user.id 
  };
}

export async function registrarAccionAdmin(accion, entidad, entidadId, detalles = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from('admin_audit_log').insert({
    admin_user_id: user.id,
    accion,
    entidad,
    entidad_id: entidadId,
    detalles,
  });
}
```

### 4.2.2 Dashboard Admin — Diseño sin violación de privacidad

El SuperAdmin puede ver:
- ✅ Razón social y RUC de empresas
- ✅ Plan y estado de suscripción
- ✅ Métricas agregadas (total comprobantes, usuarios)
- ✅ Fechas de registro y última actividad
- ✅ Estado de trial y días restantes

El SuperAdmin NO puede ver:
- ❌ Contenido de facturas/comprobantes
- ❌ Datos de clientes de las empresas
- ❌ Montos específicos de ventas
- ❌ Certificados digitales (.p12)
- ❌ Contraseñas o tokens de API
- ❌ Conversaciones del chat IA

### 4.2.3 Actualización de Permisos

```javascript
// src/lib/auth/permisos.js — ACTUALIZADO
export const PERMISOS_ROL = {
  superadmin: ['*', 'admin_panel', 'admin_empresas', 'admin_suscripciones', 'admin_audit'],
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

export function esSuperAdmin(rol) {
  return rol === 'superadmin';
}
```

### 4.2.4 Middleware de Protección Rutas Admin

```javascript
// En middleware.js — agregar:
if (request.nextUrl.pathname.startsWith('/admin')) {
  // Verificar que el usuario tiene is_platform_admin
  // Si no, redirect a /dashboard
}
```

### 4.2.5 Navegación Condicional

En `Sidebar.jsx` y `MobileMenu.jsx`:
- Si `is_platform_admin === true`: mostrar sección "Admin" con acceso a `/admin`, `/admin/empresas`, `/admin/suscripciones`, `/admin/audit`
- Si no: no mostrar nada de admin

---

## DÍAS 6-7: Freemium + Trial Automático

### 4.3.1 Trial Manager

```javascript
// src/lib/suscripciones/trial-manager.js
'use server';
import { createClient } from '@/lib/supabase/server';

export async function crearTrialAutomatico(empresaId) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('crear_suscripcion_trial', {
    p_empresa_id: empresaId,
  });
  
  if (error) return { success: false, error: error.message };
  return data;
}

export async function obtenerEstadoTrial(empresaId) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('verificar_estado_trial', {
    p_empresa_id: empresaId,
  });
  
  if (error) return null;
  return data;
}

export function calcularDiasRestantes(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const ahora = new Date();
  const fin = new Date(trialEndsAt);
  const diff = Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
```

### 4.3.2 Auto-Creación de Trial en Onboarding

En el flujo de onboarding (al completar paso 5 — configurar empresa):
1. Crear empresa ✅ (ya existe)
2. Crear perfil_empresa como `propietario` ✅ (ya existe)
3. **★ NUEVO:** Llamar `crearTrialAutomatico(empresaId)`
4. Notificar al usuario: "¡Tu trial de 14 días ha comenzado!"

### 4.3.3 Trial Banner en Dashboard

```jsx
// src/app/(dashboard)/suscripcion/components/TrialBanner.jsx
export default function TrialBanner({ diasRestantes, planNombre }) {
  if (diasRestantes === null || diasRestantes === undefined) return null;
  
  const esUrgente = diasRestantes <= 3;
  
  return (
    <div className={`...glass-card... ${esUrgente ? 'border-warning' : ''}`}>
      <p>
        {diasRestantes > 0 
          ? `Te quedan ${diasRestantes} días de tu trial ${planNombre}`
          : 'Tu periodo de prueba ha expirado'
        }
      </p>
      <a href="/suscripcion">Elegir plan</a>
    </div>
  );
}
```

### 4.3.4 Stripe Trial Period

Modificar `pricing.js` para incluir trial en el checkout:

```javascript
// En crearCheckoutSession:
const session = await stripe.checkout.sessions.create({
  // ...existing config
  subscription_data: {
    trial_period_days: 14, // Solo si es primera suscripción
    metadata: { empresaId }
  },
});
```

---

## DÍAS 8-9: Enforcement Completo de Suscripción

### 4.4.1 Feature Gates — Todas las restricciones de plan

```javascript
// src/lib/auth/feature-gates.js
'use server';
import { createClient } from '@/lib/supabase/server';

export async function verificarAccesoCompleto(empresaId) {
  const supabase = await createClient();
  
  const { data: sub } = await supabase
    .from('suscripciones')
    .select(`
      estado, trial_ends_at, 
      planes (
        nombre, limite_comprobantes_mes, limite_usuarios,
        limite_establecimientos, limite_puntos_emision,
        tiene_reportes_ia, tiene_rdep, tiene_api, tiene_multi_empresa
      )
    `)
    .eq('empresa_id', empresaId)
    .in('estado', ['activa', 'trial'])
    .maybeSingle();

  if (!sub) {
    return {
      activa: false,
      razon: 'Sin suscripción activa',
      features: {},
    };
  }

  // Verificar trial expirado
  if (sub.estado === 'trial' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
    return {
      activa: false,
      razon: 'Trial expirado',
      requiere_pago: true,
      features: {},
    };
  }

  const plan = Array.isArray(sub.planes) ? sub.planes[0] : sub.planes;

  // Contar uso actual
  const { count: comprobantesUsados } = await supabase
    .from('comprobantes')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const { count: usuariosActivos } = await supabase
    .from('perfiles_empresa')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId)
    .eq('activo', true);

  const { count: establecimientos } = await supabase
    .from('establecimientos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId);

  const { count: puntos } = await supabase
    .from('puntos_emision')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', empresaId);

  return {
    activa: true,
    plan: plan.nombre,
    estado: sub.estado,
    features: {
      puede_emitir: plan.limite_comprobantes_mes === null || comprobantesUsados < plan.limite_comprobantes_mes,
      comprobantes: { usados: comprobantesUsados, limite: plan.limite_comprobantes_mes },
      puede_invitar: plan.limite_usuarios === null || usuariosActivos < plan.limite_usuarios,
      usuarios: { activos: usuariosActivos, limite: plan.limite_usuarios },
      puede_crear_establecimiento: plan.limite_establecimientos === null || establecimientos < plan.limite_establecimientos,
      establecimientos: { activos: establecimientos, limite: plan.limite_establecimientos },
      puede_crear_punto: plan.limite_puntos_emision === null || puntos < plan.limite_puntos_emision,
      puntos: { activos: puntos, limite: plan.limite_puntos_emision },
      reportes_ia: plan.tiene_reportes_ia,
      rdep: plan.tiene_rdep,
      api: plan.tiene_api,
      multi_empresa: plan.tiene_multi_empresa,
    },
  };
}
```

### 4.4.2 Componente FeatureGate (UI Wrapper)

```jsx
// src/components/suscripcion/FeatureGate.jsx
'use client';

export default function FeatureGate({ feature, features, children, fallback }) {
  if (!features || !features[feature]) {
    return fallback || (
      <div className="glass-card text-center py-8">
        <p className="text-secondary">Esta función requiere un plan superior</p>
        <a href="/suscripcion" className="glass-button mt-4">Ver planes</a>
      </div>
    );
  }
  return children;
}
```

### 4.4.3 Puntos de Enforcement

| Ruta/Acción | Feature Gate | Comportamiento al bloquear |
|-------------|-------------|---------------------------|
| Emitir comprobante | `puede_emitir` | "Has alcanzado el límite de 50 comprobantes este mes" |
| `/reportes/analisis` | `reportes_ia` | "Reportes IA disponible en plan Professional" |
| `/reportes/rdep` | `rdep` | "RDEP disponible en plan Professional" |
| `/equipo` → Invitar | `puede_invitar` | "Tu plan permite máximo 1 usuario" |
| `/configuracion/establecimientos` → Nuevo | `puede_crear_establecimiento` | "Tu plan permite máximo 1 establecimiento" |
| `/configuracion/puntos` → Nuevo | `puede_crear_punto` | "Tu plan permite máximo 1 punto de emisión" |
| `/asistente` (Chat IA Premium) | `reportes_ia` | "Chat IA disponible en plan Professional" |
| Predicción IA Dashboard | `reportes_ia` | Widget oculto, mostrar placeholder |

---

## DÍAS 10-11: Tests E2E con Playwright

### 4.5.1 Setup

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 4.5.2 Tests Críticos

| Test | Flujo | Criterio de Éxito |
|------|-------|-------------------|
| `auth.spec.js` | Login → Dashboard → Logout | Redirect correcto, sesión limpia |
| `factura.spec.js` | Crear factura → Ver detalle | Comprobante creado en BD |
| `chat.spec.js` | Abrir chat → Enviar pregunta → Recibir datos reales | Respuesta con $ > 0 |
| `suscripcion.spec.js` | Portal → Ver plan actual | Plan correcto mostrado |
| `admin.spec.js` | Login admin → Dashboard admin → Métricas | Métricas globales visibles |
| `trial.spec.js` | Registro nuevo → Trial activo → Countdown visible | Banner trial visible |
| `permisos.spec.js` | Login emisor → Intentar config → Bloqueado | Redirect o mensaje error |
| `reportes.spec.js` | Hub → ATS → Generar | Archivo generado |

---

## DÍAS 12-13: Optimización de Rendimiento

### 4.6.1 Acciones

| Optimización | Archivo/Config | Impacto Esperado |
|-------------|---------------|-----------------|
| Dynamic imports | Recharts, Chat, PDF | -30% bundle size |
| `loading.js` por segmento | Cada sección dashboard | Perceived performance |
| Bundle analyzer | `@next/bundle-analyzer` | Identificar bloat |
| Image optimization | `next/image` | LCP improvement |
| Actualizar service worker | Serwist strategies | Cache + speed |

### 4.6.2 Core Web Vitals Target

| Métrica | Target |
|---------|--------|
| LCP | < 2.5s |
| FID / INP | < 200ms |
| CLS | < 0.1 |

---

## DÍA 14: Cierre + Deploy

### 4.7.1 Fix Webhook Stripe (current_period_*)

```javascript
// En stripe-webhooks.js — agregar:
case 'customer.subscription.updated': {
  const subscription = event.data.object;
  await supabase.from('suscripciones').update({
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }).eq('stripe_subscription_id', subscription.id);
}
```

### 4.7.2 Sentry en Producción

- Configurar SENTRY_DSN real en variables de entorno de App Runner
- Verificar captura de errores
- Configurar alertas por email

### 4.7.3 Checklist Final

- [ ] 0 políticas RLS con patrón legacy `empresas.user_id`
- [ ] SuperAdmin ve dashboard con métricas globales
- [ ] SuperAdmin NO ve datos privados de empresas
- [ ] Trial de 14 días se crea automáticamente en nuevo registro
- [ ] Banner de trial visible en dashboard con countdown
- [ ] Trial expirado bloquea emisión y muestra upgrade prompt
- [ ] Enforcement de TODAS las features por plan (no solo comprobantes)
- [ ] ≥8 tests Playwright passing
- [ ] Bundle first load < 500KB
- [ ] `npm run build` sin errores
- [ ] Deploy staging exitoso
- [ ] Sentry capturando errores reales
- [ ] Issues Linear F8 creados y asignados
- [ ] README.md actualizado con estado Fase 8
- [ ] Mensaje resumen en Slack #facturia

---

# 5. DEPENDENCIAS ENTRE TAREAS

```
Días 1-2: RLS Unificado ──→ Días 3-5: SuperAdmin (necesita RLS correcto)
                    │                    │
                    └───────→ Días 6-7: Trial/Freemium
                                         │
Días 8-9: Enforcement ←─────────────────┘
         │
Días 10-11: Playwright ──→ Días 12-13: Optimización
                                        │
                           Día 14: Cierre ←──┘
```

---

# 6. NOTAS TÉCNICAS

## 6.1 Patrón RLS con Function Helper

La función `user_empresa_ids()` se ejecuta una sola vez por query y retorna el SET de empresa_ids del usuario. Esto es más eficiente que subqueries repetidas en cada policy:

```sql
-- ❌ ANTES: subquery completa en cada policy (24 veces)
USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()))

-- ✅ AHORA: función STABLE que Postgres cachea por statement
USING (empresa_id IN (SELECT user_empresa_ids()))
```

## 6.2 SuperAdmin — Principio de Mínimo Privilegio

El SuperAdmin usa políticas `FOR SELECT` separadas — puede LEER métricas agregadas pero NO puede INSERT/UPDATE/DELETE datos de empresas ajenas. Toda acción administrativa se registra en `admin_audit_log`.

## 6.3 Trial → Stripe Handoff

El flujo completo es:
1. Nuevo registro → onboarding → `crear_suscripcion_trial()` → estado `trial`
2. Durante 14 días: todas las features de Starter habilitadas
3. Días 11-14: banner urgente "3 días restantes"
4. Día 15: `verificar_estado_trial()` detecta expiración → estado `suspendida`
5. Usuario hace click en "Elegir plan" → Stripe checkout
6. Stripe webhook → estado `activa` + datos de Stripe sincronizados

## 6.4 Compatibility Notes

- La migración DROP + CREATE de políticas es atómica en PostgreSQL
- `user_empresa_ids()` es `STABLE` → Postgres la re-evalúa por statement, no por fila
- `SECURITY DEFINER` en las funciones RPC permite bypass de RLS cuando se necesita
- Los índices parciales (`WHERE is_platform_admin = true`) minimizan overhead

---

# 7. ENTREGABLES NO INCLUIDOS EN FASE 8 (Fase 9)

| Item | Razón de exclusión |
|------|-------------------|
| PaymentEz (pasarela Ecuador) | Alternativa local a Stripe para tarjetas ecuatorianas |
| White-labeling | Personalización visual por empresa |
| API pública documentada | Solo si se abre a terceros |
| App móvil nativa | PWA cubre el caso base |
| Analytics BI avanzado | Recharts cubre el MVP |
| Facturación multi-país | Expansión post-Ecuador |
| Backup automatizado | Gestión de respaldos |

---

# 8. RESUMEN EJECUTIVO

La **Fase 8** resuelve los 5 hallazgos críticos descubiertos en la auditoría de Fase 7:

- **Unifica las 24 políticas RLS legacy** al patrón `perfiles_empresa`, haciendo funcional el sistema multi-usuario que estaba roto.
- **Introduce el rol SuperAdmin** para gestión de plataforma SaaS con auditoría completa y sin violación de privacidad.
- **Implementa Freemium/Trial de 14 días** con auto-creación en registro, countdown visual y handoff a Stripe.
- **Completa el enforcement de suscripciones** aplicando TODAS las restricciones de plan (usuarios, establecimientos, puntos, features IA), no solo comprobantes.
- **Cierra los gaps de producción** con Playwright E2E, optimización de bundle y Sentry configurado.

**Duración:** 14 días hábiles  
**Archivos nuevos:** ~25  
**Tabla BD nueva:** 1 (`admin_audit_log`)  
**Funciones nuevas:** 4  
**Políticas RLS migradas:** 24  
**Dependencias npm nuevas:** 1 (`@playwright/test`)  
**Reutilización infraestructura:** ~65%
