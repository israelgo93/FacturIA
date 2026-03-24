-- Fase 6: Dashboard analitico, suscripciones por empresa, notificaciones, cache de metricas
-- Requiere extension pgcrypto (gen_random_uuid) ya presente en instalaciones Supabase

-- ---------------------------------------------------------------------------
-- Planes SaaS por defecto (si no existen)
-- ---------------------------------------------------------------------------
INSERT INTO public.planes (nombre, precio_mensual, limite_comprobantes_mes, limite_usuarios, limite_establecimientos, limite_puntos_emision, tiene_reportes_ia, tiene_rdep, activo)
SELECT 'starter', 9.99, 50, 1, 1, 1, false, false, true
WHERE NOT EXISTS (SELECT 1 FROM public.planes WHERE nombre = 'starter');

INSERT INTO public.planes (nombre, precio_mensual, limite_comprobantes_mes, limite_usuarios, limite_establecimientos, limite_puntos_emision, tiene_reportes_ia, tiene_rdep, activo)
SELECT 'professional', 24.99, 300, 5, 3, 5, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.planes WHERE nombre = 'professional');

INSERT INTO public.planes (nombre, precio_mensual, limite_comprobantes_mes, limite_usuarios, limite_establecimientos, limite_puntos_emision, tiene_reportes_ia, tiene_rdep, activo)
SELECT 'enterprise', 49.99, NULL, NULL, NULL, NULL, true, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.planes WHERE nombre = 'enterprise');

-- ---------------------------------------------------------------------------
-- Tablas nuevas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suscripciones (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
	plan_id uuid NOT NULL REFERENCES public.planes(id),
	estado text NOT NULL DEFAULT 'activa'
		CHECK (estado IN ('activa', 'suspendida', 'cancelada', 'trial')),
	fecha_inicio timestamptz NOT NULL DEFAULT now(),
	fecha_fin timestamptz,
	periodo_facturacion text NOT NULL DEFAULT 'mensual'
		CHECK (periodo_facturacion IN ('mensual', 'anual')),
	comprobantes_usados_mes integer NOT NULL DEFAULT 0,
	mes_conteo text NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
	trial_ends_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE(empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_empresa ON public.suscripciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON public.suscripciones(estado);

CREATE TABLE IF NOT EXISTS public.notificaciones (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
	tipo text NOT NULL
		CHECK (tipo IN (
			'vencimiento_tributario', 'limite_plan', 'suscripcion',
			'certificado_expira', 'sri_error', 'reporte_listo', 'sistema'
		)),
	titulo text NOT NULL,
	mensaje text NOT NULL,
	leida boolean NOT NULL DEFAULT false,
	accion_url text,
	metadata jsonb DEFAULT '{}',
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa ON public.notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.notificaciones(empresa_id, tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON public.notificaciones(empresa_id, leida);

CREATE TABLE IF NOT EXISTS public.dashboard_cache (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
	periodo text NOT NULL,
	metricas jsonb NOT NULL DEFAULT '{}',
	calculado_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE(empresa_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_cache_empresa ON public.dashboard_cache(empresa_id, periodo);

-- ---------------------------------------------------------------------------
-- Funciones (SECURITY DEFINER + search_path fijo)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contar_comprobantes_mes(
	p_empresa_id uuid,
	p_mes text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
	v_count integer;
BEGIN
	SELECT COUNT(*)::integer
	INTO v_count
	FROM public.comprobantes
	WHERE empresa_id = p_empresa_id
		AND to_char(created_at, 'YYYY-MM') = p_mes
		AND estado IS DISTINCT FROM 'voided';

	RETURN COALESCE(v_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_limite_plan(p_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
	v_plan record;
	v_usados integer;
BEGIN
	SELECT p.nombre, p.limite_comprobantes_mes, p.limite_usuarios,
		p.limite_establecimientos, p.limite_puntos_emision,
		p.tiene_reportes_ia, p.tiene_rdep
	INTO v_plan
	FROM public.suscripciones s
	JOIN public.planes p ON p.id = s.plan_id
	WHERE s.empresa_id = p_empresa_id AND s.estado IN ('activa', 'trial');

	IF NOT FOUND THEN
		RETURN jsonb_build_object('permitido', false, 'razon', 'Sin suscripcion activa');
	END IF;

	v_usados := public.contar_comprobantes_mes(p_empresa_id);

	IF v_plan.limite_comprobantes_mes IS NOT NULL AND v_usados >= v_plan.limite_comprobantes_mes THEN
		RETURN jsonb_build_object(
			'permitido', false,
			'razon', 'Limite de comprobantes alcanzado',
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

-- Metricas dashboard: columnas reales comprobantes (importe_total, valor_iva)
CREATE OR REPLACE FUNCTION public.calcular_metricas_dashboard(
	p_empresa_id uuid,
	p_mes text DEFAULT to_char(now(), 'YYYY-MM')
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
	v_metricas jsonb;
	v_mes_anterior text;
	v_ventas_actual numeric;
	v_ventas_anterior numeric;
	v_comprobantes_actual integer;
	v_comprobantes_anterior integer;
BEGIN
	v_mes_anterior := to_char((p_mes || '-01')::date - interval '1 month', 'YYYY-MM');

	SELECT COALESCE(SUM(importe_total), 0) INTO v_ventas_actual
	FROM public.comprobantes
	WHERE empresa_id = p_empresa_id
		AND tipo_comprobante = '01'
		AND estado = 'AUT'
		AND to_char(fecha_emision, 'YYYY-MM') = p_mes;

	SELECT COALESCE(SUM(importe_total), 0) INTO v_ventas_anterior
	FROM public.comprobantes
	WHERE empresa_id = p_empresa_id
		AND tipo_comprobante = '01'
		AND estado = 'AUT'
		AND to_char(fecha_emision, 'YYYY-MM') = v_mes_anterior;

	SELECT COUNT(*)::integer INTO v_comprobantes_actual
	FROM public.comprobantes
	WHERE empresa_id = p_empresa_id
		AND to_char(created_at, 'YYYY-MM') = p_mes
		AND estado IS DISTINCT FROM 'voided';

	SELECT COUNT(*)::integer INTO v_comprobantes_anterior
	FROM public.comprobantes
	WHERE empresa_id = p_empresa_id
		AND to_char(created_at, 'YYYY-MM') = v_mes_anterior
		AND estado IS DISTINCT FROM 'voided';

	v_metricas := jsonb_build_object(
		'ventas_actual', v_ventas_actual,
		'ventas_anterior', v_ventas_anterior,
		'variacion_ventas', CASE WHEN v_ventas_anterior > 0
			THEN ROUND(((v_ventas_actual - v_ventas_anterior) / v_ventas_anterior) * 100, 1)
			ELSE 0 END,
		'comprobantes_actual', v_comprobantes_actual,
		'comprobantes_anterior', v_comprobantes_anterior,
		'variacion_comprobantes', CASE WHEN v_comprobantes_anterior > 0
			THEN ROUND(((v_comprobantes_actual::numeric - v_comprobantes_anterior) / v_comprobantes_anterior) * 100, 1)
			ELSE 0 END,
		'iva_cobrado', (
			SELECT COALESCE(SUM(valor_iva), 0)
			FROM public.comprobantes
			WHERE empresa_id = p_empresa_id
				AND tipo_comprobante = '01'
				AND estado = 'AUT'
				AND to_char(fecha_emision, 'YYYY-MM') = p_mes
		),
		'total_clientes', (
			SELECT COUNT(*)::integer FROM public.clientes
			WHERE empresa_id = p_empresa_id AND activo = true
		),
		'total_productos', (
			SELECT COUNT(*)::integer FROM public.productos
			WHERE empresa_id = p_empresa_id AND activo = true
		),
		'comprobantes_por_tipo', (
			SELECT COALESCE(jsonb_object_agg(tipo_comprobante, cnt), '{}'::jsonb)
			FROM (
				SELECT tipo_comprobante, COUNT(*) AS cnt
				FROM public.comprobantes
				WHERE empresa_id = p_empresa_id
					AND to_char(created_at, 'YYYY-MM') = p_mes
					AND estado IS DISTINCT FROM 'voided'
				GROUP BY tipo_comprobante
			) t
		),
		'comprobantes_por_estado', (
			SELECT COALESCE(jsonb_object_agg(estado, cnt), '{}'::jsonb)
			FROM (
				SELECT estado, COUNT(*) AS cnt
				FROM public.comprobantes
				WHERE empresa_id = p_empresa_id
					AND to_char(created_at, 'YYYY-MM') = p_mes
				GROUP BY estado
			) t
		),
		'top_clientes', (
			SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
			FROM (
				SELECT c.razon_social AS razon_social,
					SUM(comp.importe_total) AS total_ventas,
					COUNT(*)::integer AS num_comprobantes
				FROM public.comprobantes comp
				JOIN public.clientes c ON c.id = comp.cliente_id
				WHERE comp.empresa_id = p_empresa_id
					AND comp.tipo_comprobante = '01'
					AND comp.estado = 'AUT'
					AND to_char(comp.fecha_emision, 'YYYY-MM') = p_mes
				GROUP BY c.razon_social
				ORDER BY total_ventas DESC NULLS LAST
				LIMIT 5
			) t
		)
	);

	INSERT INTO public.dashboard_cache (empresa_id, periodo, metricas, calculado_at)
	VALUES (p_empresa_id, p_mes, v_metricas, now())
	ON CONFLICT (empresa_id, periodo)
	DO UPDATE SET metricas = EXCLUDED.metricas, calculado_at = now();

	RETURN v_metricas;
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suscripciones_tenant ON public.suscripciones;
CREATE POLICY suscripciones_tenant ON public.suscripciones
	FOR ALL
	USING (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	)
	WITH CHECK (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	);

DROP POLICY IF EXISTS notificaciones_tenant ON public.notificaciones;
CREATE POLICY notificaciones_tenant ON public.notificaciones
	FOR ALL
	USING (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	)
	WITH CHECK (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	);

DROP POLICY IF EXISTS dashboard_cache_tenant ON public.dashboard_cache;
CREATE POLICY dashboard_cache_tenant ON public.dashboard_cache
	FOR ALL
	USING (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	)
	WITH CHECK (
		empresa_id IN (SELECT id FROM public.empresas WHERE user_id = (SELECT auth.uid()))
	);

-- ---------------------------------------------------------------------------
-- Trigger updated_at
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_suscripciones_updated_at ON public.suscripciones;
CREATE TRIGGER update_suscripciones_updated_at
	BEFORE UPDATE ON public.suscripciones
	FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: suscripcion trial para empresas sin fila en suscripciones
-- ---------------------------------------------------------------------------
INSERT INTO public.suscripciones (empresa_id, plan_id, estado, trial_ends_at)
SELECT e.id, p.id, 'trial', now() + interval '14 days'
FROM public.empresas e
	CROSS JOIN public.planes p
WHERE p.nombre = 'professional'
	AND NOT EXISTS (SELECT 1 FROM public.suscripciones s WHERE s.empresa_id = e.id);
