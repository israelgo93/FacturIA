-- =============================================
-- MIGRACION 018: Usuario interno DataTensei con plan Enterprise
-- =============================================

WITH target_user AS (
	SELECT id
	FROM auth.users
	WHERE lower(email) = lower('test@datatensei.com')
	LIMIT 1
),
target_empresa AS (
	SELECT e.id
	FROM public.empresas e
	JOIN target_user u ON u.id = e.user_id
	LIMIT 1
),
enterprise_plan AS (
	SELECT id
	FROM public.planes
	WHERE nombre = 'enterprise'
	LIMIT 1
)
UPDATE public.empresas e
SET
	plan_id = enterprise_plan.id,
	suscripcion_estado = 'activa',
	suscripcion_inicio = COALESCE(e.suscripcion_inicio, now()),
	suscripcion_fin = NULL,
	updated_at = now()
FROM target_empresa, enterprise_plan
WHERE e.id = target_empresa.id;

WITH target_user AS (
	SELECT id
	FROM auth.users
	WHERE lower(email) = lower('test@datatensei.com')
	LIMIT 1
),
target_empresa AS (
	SELECT e.id
	FROM public.empresas e
	JOIN target_user u ON u.id = e.user_id
	LIMIT 1
),
enterprise_plan AS (
	SELECT id
	FROM public.planes
	WHERE nombre = 'enterprise'
	LIMIT 1
)
UPDATE public.suscripciones s
SET
	plan_id = enterprise_plan.id,
	estado = 'activa',
	periodo_facturacion = 'anual',
	trial_ends_at = NULL,
	updated_at = now()
FROM target_empresa, enterprise_plan
WHERE s.empresa_id = target_empresa.id;

WITH target_user AS (
	SELECT id
	FROM auth.users
	WHERE lower(email) = lower('test@datatensei.com')
	LIMIT 1
),
target_empresa AS (
	SELECT e.id
	FROM public.empresas e
	JOIN target_user u ON u.id = e.user_id
	LIMIT 1
)
UPDATE public.perfiles_empresa pe
SET
	rol = 'propietario',
	activo = true,
	is_platform_admin = true,
	updated_at = now()
FROM target_user, target_empresa
WHERE pe.user_id = target_user.id
	AND pe.empresa_id = target_empresa.id;
