import { createClient } from '@/lib/supabase/server';

const CACHE_MS = 5 * 60 * 1000;

/**
 * Obtiene metricas del dashboard: cache dashboard_cache si tiene menos de 5 min, si no RPC.
 * @param {string} empresaId
 * @param {string} mes - formato YYYY-MM
 * @returns {Promise<object>}
 */
export async function obtenerMetricasDashboard(empresaId, mes) {
	const supabase = await createClient();

	const { data: cached, error: cacheErr } = await supabase
		.from('dashboard_cache')
		.select('metricas, calculado_at')
		.eq('empresa_id', empresaId)
		.eq('periodo', mes)
		.maybeSingle();

	if (!cacheErr && cached?.calculado_at && cached.metricas) {
		const age = Date.now() - new Date(cached.calculado_at).getTime();
		if (age < CACHE_MS) {
			return cached.metricas;
		}
	}

	const { data, error } = await supabase.rpc('calcular_metricas_dashboard', {
		p_empresa_id: empresaId,
		p_mes: mes,
	});

	if (error) {
		throw new Error(error.message);
	}

	return data;
}

/**
 * Ventas facturas (01) AUT por mes, ultimos N meses.
 * @param {string} empresaId
 * @param {number} meses
 * @returns {Promise<Array<{ mes: string, mesKey: string, ventas: number }>>}
 */
export async function obtenerHistoricoVentas(empresaId, meses = 6) {
	const supabase = await createClient();
	const resultados = [];

	for (let i = meses - 1; i >= 0; i--) {
		const fecha = new Date();
		fecha.setMonth(fecha.getMonth() - i);
		const y = fecha.getFullYear();
		const m = fecha.getMonth() + 1;
		const mesKey = `${y}-${String(m).padStart(2, '0')}`;
		const lastDay = new Date(y, m, 0).getDate();
		const desde = `${mesKey}-01`;
		const hasta = `${mesKey}-${String(lastDay).padStart(2, '0')}`;

		const { data } = await supabase
			.from('comprobantes')
			.select('importe_total')
			.eq('empresa_id', empresaId)
			.eq('tipo_comprobante', '01')
			.eq('estado', 'AUT')
			.gte('fecha_emision', desde)
			.lte('fecha_emision', hasta);

		const ventas = data?.reduce((sum, c) => sum + parseFloat(c.importe_total || 0), 0) || 0;
		resultados.push({
			mes: fecha.toLocaleString('es', { month: 'short' }),
			mesKey,
			ventas,
		});
	}

	return resultados;
}
