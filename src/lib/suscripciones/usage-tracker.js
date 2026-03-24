import { createClient } from '@/lib/supabase/server';

/**
 * Uso de comprobantes del mes actual (RPC).
 * @param {string} empresaId
 * @param {string} [mes] YYYY-MM
 * @returns {Promise<number>}
 */
export async function contarUsoMes(empresaId, mes) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc('contar_comprobantes_mes', {
		p_empresa_id: empresaId,
		p_mes: mes || undefined,
	});

	if (error) {
		return 0;
	}

	return typeof data === 'number' ? data : 0;
}
