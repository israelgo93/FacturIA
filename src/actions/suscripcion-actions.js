'use server';

import { createClient } from '@/lib/supabase/server';

export async function obtenerSuscripcionActual() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { data: sub, error } = await supabase
		.from('suscripciones')
		.select('*, planes ( id, nombre, precio_mensual, precio_anual, limite_documentos_anual, limite_comprobantes_mes, tiene_reportes_ia, tiene_rdep )')
		.eq('empresa_id', empresa.id)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data: sub, empresaId: empresa.id };
}

export async function cambiarPlan() {
	return {
		error: 'Los planes pagos estan deshabilitados temporalmente. Solo esta disponible la capa gratuita.',
	};
}
