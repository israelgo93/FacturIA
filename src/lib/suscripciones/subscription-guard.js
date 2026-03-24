import { createClient } from '@/lib/supabase/server';

/**
 * Verifica si la empresa puede emitir comprobantes segun plan y uso del mes.
 * @param {string} empresaId
 * @returns {Promise<{ permitido: boolean, razon?: string, usados?: number, limite?: number | null, plan?: string, tiene_reportes_ia?: boolean, tiene_rdep?: boolean }>}
 */
export async function verificarPermisoEmision(empresaId) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc('verificar_limite_plan', {
		p_empresa_id: empresaId,
	});

	if (error) {
		return { permitido: false, razon: 'Error verificando suscripcion' };
	}

	if (data && typeof data === 'object' && 'permitido' in data) {
		return data;
	}

	return { permitido: false, razon: 'Respuesta invalida del servidor' };
}

/**
 * Comprueba feature de plan (reportes IA, RDEP) segun suscripcion activa.
 * @param {string} empresaId
 * @param {'reportes_ia' | 'rdep' | 'analisis_ia'} feature
 */
export async function verificarAccesoFeature(empresaId, feature) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('suscripciones')
		.select('planes ( nombre, tiene_reportes_ia, tiene_rdep )')
		.eq('empresa_id', empresaId)
		.in('estado', ['activa', 'trial'])
		.maybeSingle();

	if (error || data == null) {
		return false;
	}

	const raw = data.planes;
	const plan = Array.isArray(raw) ? raw[0] : raw;
	if (!plan) return false;

	switch (feature) {
		case 'reportes_ia':
		case 'analisis_ia':
			return Boolean(plan.tiene_reportes_ia);
		case 'rdep':
			return Boolean(plan.tiene_rdep);
		default:
			return true;
	}
}
