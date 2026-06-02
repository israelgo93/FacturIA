-- =============================================
-- MIGRACION 019: Intercambio de correos por RUC
-- =============================================
-- Objetivo:
-- - RUC personal 1313835231001 usa israelgo93@gmail.com
-- - RUC DATATENSEI S.A.S. 1391936618001 usa test@datatensei.com

DO $$
DECLARE
	v_personal_user_id uuid;
	v_datatensei_user_id uuid;
	v_temp_email text := 'swap-temp-facturia@datatensei.invalid';
BEGIN
	SELECT user_id
	INTO v_personal_user_id
	FROM public.empresas
	WHERE ruc = '1313835231001'
	LIMIT 1;

	SELECT user_id
	INTO v_datatensei_user_id
	FROM public.empresas
	WHERE ruc = '1391936618001'
	LIMIT 1;

	IF v_personal_user_id IS NULL OR v_datatensei_user_id IS NULL THEN
		RAISE EXCEPTION 'No se encontraron las empresas requeridas para intercambiar correos';
	END IF;

	IF v_personal_user_id = v_datatensei_user_id THEN
		RAISE EXCEPTION 'Las empresas requeridas apuntan al mismo usuario';
	END IF;

	-- Liberar test@datatensei.com antes de asignar correos definitivos.
	UPDATE auth.users
	SET
		email = v_temp_email,
		raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', to_jsonb(v_temp_email), true),
		email_change = '',
		email_change_token_new = '',
		email_change_token_current = '',
		email_change_confirm_status = 0,
		updated_at = now()
	WHERE id = v_datatensei_user_id;

	UPDATE auth.users
	SET
		email = 'israelgo93@gmail.com',
		raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', to_jsonb('israelgo93@gmail.com'::text), true),
		email_change = '',
		email_change_token_new = '',
		email_change_token_current = '',
		email_change_confirm_status = 0,
		updated_at = now()
	WHERE id = v_personal_user_id;

	UPDATE auth.users
	SET
		email = 'test@datatensei.com',
		raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', to_jsonb('test@datatensei.com'::text), true),
		email_change = '',
		email_change_token_new = '',
		email_change_token_current = '',
		email_change_confirm_status = 0,
		updated_at = now()
	WHERE id = v_datatensei_user_id;

	UPDATE auth.identities i
	SET
		identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email), true),
		updated_at = now()
	FROM auth.users u
	WHERE i.user_id = u.id
		AND u.id IN (v_personal_user_id, v_datatensei_user_id)
		AND i.provider = 'email';
END;
$$;
