-- =============================================
-- MIGRACION 014: RLS Unificado + SuperAdmin + Trial
-- Fase 8 — facturIA SaaS
-- Aplicada: 2026-03-25
-- =============================================

-- PARTE 1: SUPERADMIN
ALTER TABLE perfiles_empresa
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

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

CREATE POLICY "admin_audit_log_superadmin" ON admin_audit_log
  FOR ALL USING (
    admin_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM perfiles_empresa
      WHERE user_id = auth.uid() AND is_platform_admin = true
    )
  );

CREATE OR REPLACE VIEW v_admin_metricas_globales AS
SELECT
  (SELECT count(*) FROM empresas) as total_empresas,
  (SELECT count(DISTINCT user_id) FROM perfiles_empresa WHERE activo = true) as total_usuarios,
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

-- PARTE 2: TRIAL/FREEMIUM
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS trial_dias INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_freemium BOOLEAN DEFAULT false;

UPDATE planes SET trial_dias = 14, es_freemium = true WHERE nombre = 'starter';

CREATE OR REPLACE FUNCTION crear_suscripcion_trial(p_empresa_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_plan_id UUID;
  v_trial_dias INTEGER;
  v_sub_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM suscripciones WHERE empresa_id = p_empresa_id) THEN
    RETURN jsonb_build_object('success', false, 'razon', 'Ya tiene suscripcion');
  END IF;
  SELECT id, trial_dias INTO v_plan_id, v_trial_dias
  FROM planes WHERE es_freemium = true AND activo = true LIMIT 1;
  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'razon', 'No hay plan freemium disponible');
  END IF;
  INSERT INTO suscripciones (
    empresa_id, plan_id, estado, fecha_inicio, trial_ends_at,
    periodo_facturacion, comprobantes_usados_mes, mes_conteo
  ) VALUES (
    p_empresa_id, v_plan_id, 'trial',
    now(), now() + (v_trial_dias || ' days')::INTERVAL,
    'mensual', 0, to_char(now(), 'YYYY-MM')
  ) RETURNING id INTO v_sub_id;
  RETURN jsonb_build_object(
    'success', true, 'suscripcion_id', v_sub_id, 'plan', 'starter',
    'trial_ends_at', (now() + (v_trial_dias || ' days')::INTERVAL)::TEXT,
    'dias_restantes', v_trial_dias
  );
END;
$$;

CREATE OR REPLACE FUNCTION verificar_estado_trial(p_empresa_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_sub RECORD;
BEGIN
  SELECT s.*, p.nombre as plan_nombre, p.trial_dias INTO v_sub
  FROM suscripciones s JOIN planes p ON p.id = s.plan_id
  WHERE s.empresa_id = p_empresa_id AND s.estado IN ('activa', 'trial')
  ORDER BY s.created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('tiene_suscripcion', false);
  END IF;
  IF v_sub.estado = 'trial' THEN
    IF v_sub.trial_ends_at < now() THEN
      UPDATE suscripciones SET estado = 'suspendida' WHERE id = v_sub.id;
      RETURN jsonb_build_object('tiene_suscripcion', true, 'estado', 'expirado',
        'plan', v_sub.plan_nombre, 'trial_ends_at', v_sub.trial_ends_at,
        'dias_restantes', 0, 'requiere_pago', true);
    ELSE
      RETURN jsonb_build_object('tiene_suscripcion', true, 'estado', 'trial',
        'plan', v_sub.plan_nombre, 'trial_ends_at', v_sub.trial_ends_at,
        'dias_restantes', EXTRACT(DAY FROM (v_sub.trial_ends_at - now()))::INT,
        'requiere_pago', false);
    END IF;
  END IF;
  RETURN jsonb_build_object('tiene_suscripcion', true, 'estado', v_sub.estado,
    'plan', v_sub.plan_nombre, 'stripe_subscription_id', v_sub.stripe_subscription_id,
    'requiere_pago', false);
END;
$$;

-- PARTE 3: UNIFICACION RLS
CREATE OR REPLACE FUNCTION user_has_empresa_access(p_empresa_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM perfiles_empresa WHERE user_id = auth.uid() AND empresa_id = p_empresa_id AND activo = true);
$$;

CREATE OR REPLACE FUNCTION user_empresa_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT empresa_id FROM perfiles_empresa WHERE user_id = auth.uid() AND activo = true;
$$;

DROP POLICY IF EXISTS "empresas_own" ON empresas;
CREATE POLICY "empresas_multi_tenant" ON empresas FOR ALL USING (id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "clientes_tenant" ON clientes;
CREATE POLICY "clientes_multi_tenant" ON clientes FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "productos_tenant" ON productos;
CREATE POLICY "productos_multi_tenant" ON productos FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "comprobantes_tenant" ON comprobantes;
CREATE POLICY "comprobantes_multi_tenant" ON comprobantes FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "comprobante_detalles_tenant" ON comprobante_detalles;
CREATE POLICY "comprobante_detalles_multi_tenant" ON comprobante_detalles FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "comprobante_impuestos_tenant" ON comprobante_impuestos;
CREATE POLICY "comprobante_impuestos_multi_tenant" ON comprobante_impuestos FOR ALL USING (comprobante_detalle_id IN (SELECT cd.id FROM comprobante_detalles cd WHERE cd.empresa_id IN (SELECT user_empresa_ids())));
DROP POLICY IF EXISTS "comprobante_pagos_tenant" ON comprobante_pagos;
CREATE POLICY "comprobante_pagos_multi_tenant" ON comprobante_pagos FOR ALL USING (comprobante_id IN (SELECT id FROM comprobantes WHERE empresa_id IN (SELECT user_empresa_ids())));
DROP POLICY IF EXISTS "certificados_tenant" ON certificados;
CREATE POLICY "certificados_multi_tenant" ON certificados FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "establecimientos_tenant" ON establecimientos;
CREATE POLICY "establecimientos_multi_tenant" ON establecimientos FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "puntos_emision_tenant" ON puntos_emision;
CREATE POLICY "puntos_emision_multi_tenant" ON puntos_emision FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "secuenciales_tenant" ON secuenciales;
CREATE POLICY "secuenciales_multi_tenant" ON secuenciales FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "config_email_tenant" ON config_email;
CREATE POLICY "config_email_multi_tenant" ON config_email FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "ia_conversaciones_tenant" ON ia_conversaciones;
CREATE POLICY "ia_conversaciones_multi_tenant" ON ia_conversaciones FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "compras_recibidas_tenant" ON compras_recibidas;
CREATE POLICY "compras_recibidas_multi_tenant" ON compras_recibidas FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "compras_recibidas_retenciones_tenant" ON compras_recibidas_retenciones;
CREATE POLICY "compras_recibidas_retenciones_multi_tenant" ON compras_recibidas_retenciones FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "empleados_tenant" ON empleados;
CREATE POLICY "empleados_multi_tenant" ON empleados FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "empleados_ingresos_anuales_tenant" ON empleados_ingresos_anuales;
CREATE POLICY "empleados_ingresos_anuales_multi_tenant" ON empleados_ingresos_anuales FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "reportes_sri_tenant" ON reportes_sri;
CREATE POLICY "reportes_sri_multi_tenant" ON reportes_sri FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "sri_log_tenant" ON sri_log;
CREATE POLICY "sri_log_multi_tenant" ON sri_log FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "empresa_isolation_gr_destinatarios" ON guia_remision_destinatarios;
CREATE POLICY "gr_destinatarios_multi_tenant" ON guia_remision_destinatarios FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "empresa_isolation_gr_detalles" ON guia_remision_detalles;
CREATE POLICY "gr_detalles_multi_tenant" ON guia_remision_detalles FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "Usuarios ven suscripcion de su empresa" ON suscripciones;
CREATE POLICY "suscripciones_multi_tenant" ON suscripciones FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "Usuarios ven notificaciones de su empresa" ON notificaciones;
CREATE POLICY "notificaciones_multi_tenant" ON notificaciones FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "Usuarios ven cache de su empresa" ON dashboard_cache;
CREATE POLICY "dashboard_cache_multi_tenant" ON dashboard_cache FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));
DROP POLICY IF EXISTS "retencion_detalles_tenant" ON retencion_detalles;
CREATE POLICY "retencion_detalles_multi_tenant" ON retencion_detalles FOR ALL USING (empresa_id IN (SELECT user_empresa_ids()));

-- PARTE 4: SUPERADMIN POLICIES
CREATE POLICY "empresas_superadmin_read" ON empresas FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles_empresa WHERE user_id = auth.uid() AND is_platform_admin = true));
CREATE POLICY "suscripciones_superadmin_read" ON suscripciones FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles_empresa WHERE user_id = auth.uid() AND is_platform_admin = true));

-- PARTE 5: INDICES Y BACKFILL
CREATE INDEX IF NOT EXISTS idx_perfiles_empresa_platform_admin ON perfiles_empresa(user_id) WHERE is_platform_admin = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_fecha ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_trial_ends ON suscripciones(trial_ends_at) WHERE estado = 'trial';

UPDATE perfiles_empresa SET is_platform_admin = true
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'israelgo93@gmail.com' LIMIT 1);
