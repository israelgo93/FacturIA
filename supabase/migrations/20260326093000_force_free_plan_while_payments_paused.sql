-- =============================================
-- MIGRACION 016: Forzar plan gratuito mientras pagos estan pausados
-- =============================================

WITH free_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'free' LIMIT 1
)
UPDATE public.suscripciones s
SET
	plan_id = free_plan.id,
	estado = 'activa',
	periodo_facturacion = 'anual',
	trial_ends_at = NULL,
	updated_at = now()
FROM free_plan
WHERE s.estado IN ('activa', 'trial');

WITH free_plan AS (
	SELECT id FROM public.planes WHERE nombre = 'free' LIMIT 1
)
UPDATE public.empresas e
SET
	plan_id = free_plan.id,
	suscripcion_estado = 'activa',
	suscripcion_inicio = COALESCE(e.suscripcion_inicio, now()),
	suscripcion_fin = NULL,
	updated_at = now()
FROM free_plan
WHERE e.activo = true;
