-- =============================================
-- MIGRACION 020: Asegurar plan gratuito al crear empresa
-- =============================================

CREATE OR REPLACE FUNCTION public.ensure_empresa_free_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
	v_plan_id uuid;
BEGIN
	SELECT id
	INTO v_plan_id
	FROM public.planes
	WHERE nombre = 'free'
		AND activo = true
	LIMIT 1;

	IF v_plan_id IS NULL THEN
		RAISE EXCEPTION 'No hay plan gratuito activo disponible';
	END IF;

	IF NEW.plan_id IS NULL THEN
		UPDATE public.empresas
		SET plan_id = v_plan_id
		WHERE id = NEW.id;
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
	)
	VALUES (
		NEW.id,
		v_plan_id,
		'activa',
		now(),
		NULL,
		'anual',
		0,
		to_char(now(), 'YYYY')
	)
	ON CONFLICT (empresa_id) DO NOTHING;

	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_empresa_free_subscription_trigger ON public.empresas;
CREATE TRIGGER ensure_empresa_free_subscription_trigger
	AFTER INSERT ON public.empresas
	FOR EACH ROW
	EXECUTE FUNCTION public.ensure_empresa_free_subscription();

WITH free_plan AS (
	SELECT id
	FROM public.planes
	WHERE nombre = 'free'
		AND activo = true
	LIMIT 1
),
missing_empresas AS (
	SELECT e.id
	FROM public.empresas e
	WHERE NOT EXISTS (
		SELECT 1
		FROM public.suscripciones s
		WHERE s.empresa_id = e.id
	)
)
INSERT INTO public.suscripciones (
	empresa_id,
	plan_id,
	estado,
	fecha_inicio,
	trial_ends_at,
	periodo_facturacion,
	comprobantes_usados_mes,
	mes_conteo
)
SELECT
	missing_empresas.id,
	free_plan.id,
	'activa',
	now(),
	NULL,
	'anual',
	0,
	to_char(now(), 'YYYY')
FROM missing_empresas
CROSS JOIN free_plan
ON CONFLICT (empresa_id) DO NOTHING;

WITH free_plan AS (
	SELECT id
	FROM public.planes
	WHERE nombre = 'free'
		AND activo = true
	LIMIT 1
)
UPDATE public.empresas e
SET
	plan_id = free_plan.id,
	suscripcion_estado = 'activa',
	suscripcion_inicio = COALESCE(e.suscripcion_inicio, now()),
	suscripcion_fin = NULL,
	updated_at = now()
FROM free_plan
WHERE e.plan_id IS NULL;

REVOKE ALL ON FUNCTION public.ensure_empresa_free_subscription() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_empresa_free_subscription() FROM anon;
REVOKE ALL ON FUNCTION public.ensure_empresa_free_subscription() FROM authenticated;
