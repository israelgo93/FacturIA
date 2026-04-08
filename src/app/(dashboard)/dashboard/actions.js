'use server';

import { createClient } from '@/lib/supabase/server';

export async function obtenerDashboardKPIs() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { data, error } = await supabase
		.from('v_dashboard_kpis')
		.select('*')
		.eq('empresa_id', empresa.id)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data };
}

export async function obtenerEmpresaActual() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, razon_social, nombre_comercial, ruc')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };
	return { data: empresa };
}

export async function obtenerPerfilPlataforma() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { isPlatformAdmin: false, trialInfo: null };

	const { data: perfil } = await supabase
		.from('perfiles_empresa')
		.select('is_platform_admin, empresa_id')
		.eq('user_id', user.id)
		.eq('activo', true)
		.order('created_at')
		.limit(1)
		.maybeSingle();

	const isPlatformAdmin = !!perfil?.is_platform_admin;

	let trialInfo = null;
	if (perfil?.empresa_id) {
		const { data: sub } = await supabase
			.from('suscripciones')
			.select('estado, trial_ends_at, planes ( nombre )')
			.eq('empresa_id', perfil.empresa_id)
			.in('estado', ['activa', 'trial'])
			.maybeSingle();

		if (sub) {
			const planRow = Array.isArray(sub.planes) ? sub.planes[0] : sub.planes;
			let diasRestantes = null;
			if (sub.estado === 'trial' && sub.trial_ends_at) {
				const diff = Math.ceil((new Date(sub.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
				diasRestantes = Math.max(0, diff);
			}
			trialInfo = {
				estado: sub.estado,
				plan: planRow?.nombre || null,
				trial_ends_at: sub.trial_ends_at,
				diasRestantes,
			};
		}
	}

	return { isPlatformAdmin, trialInfo };
}
