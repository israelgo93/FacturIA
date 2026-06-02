-- =============================================
-- MIGRACION 015: Limites anuales + pagos pausados
-- =============================================

ALTER TABLE public.planes
	ADD COLUMN IF NOT EXISTS precio_anual numeric(10,2) NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS limite_documentos_anual integer,
	ADD COLUMN IF NOT EXISTS pagos_habilitados boolean NOT NULL DEFAULT false;

INSERT INTO public.planes (
	nombre,
	precio_mensual,
	limite_comprobantes_mes,
	limite_usuarios,
	limite_establecimientos,
	limite_puntos_emision,
	tiene_reportes_ia,
	tiene_rdep,
	activo,
	precio_anual,
	limite_documentos_anual,
	pagos_habilitados,
	trial_dias,
	es_freemium
)
SELECT
	'free',
	0,
	100,
	1,
	1,
	1,
	false,
	false,
	true,
	0,
	100,
	true,
	0,
	true
WHERE NOT EXISTS (
	SELECT 1 FROM public.planes WHERE nombre = 'free'
);

UPDATE public.planes
SET
	precio_mensual = 0,
	precio_anual = 0,
	limite_comprobantes_mes = 100,
	limite_documentos_anual = 100,
	limite_usuarios = 1,
	limite_establecimientos = 1,
	limite_puntos_emision = 1,
	tiene_reportes_ia = false,
	tiene_rdep = false,
	pagos_habilitados = true,
	es_freemium = true,
	trial_dias = 0,
	activo = true
WHERE nombre = 'free';

UPDATE public.planes
SET
	precio_mensual = 9.99,
	precio_anual = 119.88,
	limite_comprobantes_mes = 500,
	limite_documentos_anual = 500,
	limite_usuarios = 1,
	limite_establecimientos = 1,
	limite_puntos_emision = 1,
	tiene_reportes_ia = false,
	tiene_rdep = false,
	pagos_habilitados = false,
	es_freemium = false,
	trial_dias = 0,
	activo = true
WHERE nombre = 'starter';

UPDATE public.planes
SET
	precio_mensual = 24.99,
	precio_anual = 299.88,
	limite_comprobantes_mes = 1000,
	limite_documentos_anual = 1000,
	limite_usuarios = 5,
	limite_establecimientos = 3,
	limite_puntos_emision = 5,
	tiene_reportes_ia = true,
	tiene_rdep = true,
	pagos_habilitados = false,
	activo = true
WHERE nombre = 'professional';

UPDATE public.planes
SET
	precio_mensual = 49.99,
	precio_anual = 599.88,
	limite_comprobantes_mes = NULL,
	limite_documentos_anual = NULL,
	limite_usuarios = NULL,
	limite_establecimientos = NULL,
	limite_puntos_emision = NULL,
	tiene_reportes_ia = true,
	tiene_rdep = true,
	pagos_habilitados = false,
	activo = true
WHERE nombre = 'enterprise';

WITH free_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'free' LIMIT 1
),
starter_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'starter' LIMIT 1
)
UPDATE public.suscripciones s
SET
	plan_id = free_plan.id,
	estado = 'activa',
	trial_ends_at = NULL,
	updated_at = now()
FROM free_plan, starter_plan
WHERE s.plan_id = starter_plan.id
	AND s.stripe_customer_id IS NULL;

WITH free_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'free' LIMIT 1
),
starter_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'starter' LIMIT 1
)
UPDATE public.empresas e
SET plan_id = free_plan.id
FROM free_plan, starter_plan
WHERE e.plan_id = starter_plan.id;

CREATE OR REPLACE FUNCTION public.contar_documentos_anio(
	p_empresa_id uuid,
	p_anio integer DEFAULT EXTRACT(YEAR FROM now())::integer
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
		AND created_at >= make_date(p_anio, 1, 1)
		AND created_at < make_date(p_anio + 1, 1, 1)
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
	SELECT
		p.nombre,
		COALESCE(p.limite_documentos_anual, p.limite_comprobantes_mes) AS limite_documentos_anual,
		p.limite_usuarios,
		p.limite_establecimientos,
		p.limite_puntos_emision,
		p.tiene_reportes_ia,
		p.tiene_rdep
	INTO v_plan
	FROM public.suscripciones s
	JOIN public.planes p ON p.id = s.plan_id
	WHERE s.empresa_id = p_empresa_id
		AND s.estado IN ('activa', 'trial')
	ORDER BY s.created_at DESC
	LIMIT 1;

	IF NOT FOUND THEN
		RETURN jsonb_build_object('permitido', false, 'razon', 'Sin suscripcion activa');
	END IF;

	v_usados := public.contar_documentos_anio(p_empresa_id);

	IF v_plan.limite_documentos_anual IS NOT NULL AND v_usados >= v_plan.limite_documentos_anual THEN
		RETURN jsonb_build_object(
			'permitido', false,
			'razon', 'Limite anual de documentos alcanzado',
			'usados', v_usados,
			'limite', v_plan.limite_documentos_anual,
			'periodo', 'anual',
			'plan', v_plan.nombre
		);
	END IF;

	RETURN jsonb_build_object(
		'permitido', true,
		'usados', v_usados,
		'limite', v_plan.limite_documentos_anual,
		'periodo', 'anual',
		'plan', v_plan.nombre,
		'tiene_reportes_ia', v_plan.tiene_reportes_ia,
		'tiene_rdep', v_plan.tiene_rdep
	);
END;
$$;

CREATE OR REPLACE FUNCTION public.crear_suscripcion_trial(p_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
	v_plan_id uuid;
	v_sub_id uuid;
BEGIN
	IF EXISTS (SELECT 1 FROM public.suscripciones WHERE empresa_id = p_empresa_id) THEN
		RETURN jsonb_build_object('success', false, 'razon', 'Ya tiene suscripcion');
	END IF;

	SELECT id
	INTO v_plan_id
	FROM public.planes
	WHERE es_freemium = true
		AND activo = true
	ORDER BY created_at DESC
	LIMIT 1;

	IF v_plan_id IS NULL THEN
		RETURN jsonb_build_object('success', false, 'razon', 'No hay plan gratuito disponible');
	END IF;

	INSERT INTO public.suscripciones (
		empresa_id,
		plan_id,
		estado,
		fecha_inicio,
		trial_ends_at,
		periodo_facturacion,
		comprobantes_usados_mes,
		mes_conteo
	) VALUES (
		p_empresa_id,
		v_plan_id,
		'activa',
		now(),
		NULL,
		'anual',
		0,
		to_char(now(), 'YYYY')
	) RETURNING id INTO v_sub_id;

	RETURN jsonb_build_object(
		'success', true,
		'suscripcion_id', v_sub_id,
		'plan', 'free',
		'requiere_pago', false
	);
END;
$$;
