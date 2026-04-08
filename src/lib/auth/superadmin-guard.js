'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Verifica si el usuario actual es SuperAdmin de plataforma.
 * @returns {{ isSuperAdmin: boolean, userId?: string, error?: string }}
 */
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
		userId: user.id,
	};
}

/**
 * Registra una accion administrativa en el audit log.
 * @param {string} accion
 * @param {string} entidad
 * @param {string | null} entidadId
 * @param {Record<string, unknown>} detalles
 */
export async function registrarAccionAdmin(accion, entidad, entidadId = null, detalles = {}) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return;

	await supabase.from('admin_audit_log').insert({
		admin_user_id: user.id,
		accion,
		entidad,
		entidad_id: entidadId,
		detalles,
	});
}
