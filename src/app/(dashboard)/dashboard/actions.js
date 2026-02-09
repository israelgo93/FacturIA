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
