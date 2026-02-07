/**
 * API Route para chat IA de reportes tributarios
 * Usa Vercel AI SDK con Gemini 3 Flash para streaming
 */
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getChatReportesPrompt } from '@/lib/ia/reportes-prompts';

export const maxDuration = 30;

export async function POST(req) {
	const { messages, empresaId, periodo } = await req.json();
	const supabase = await createClient();

	// Obtener datos de la empresa
	let empresa = null;
	if (empresaId) {
		const { data } = await supabase
			.from('empresas')
			.select('ruc, razon_social, obligado_contabilidad, regimen_fiscal')
			.eq('id', empresaId)
			.single();
		empresa = data;
	}

	// Obtener contexto fiscal del período si se proporciona
	let contexto = {};
	if (empresaId && periodo?.anio && periodo?.mes) {
		const mesStr = String(periodo.mes).padStart(2, '0');
		const lastDay = new Date(periodo.anio, periodo.mes, 0).getDate();
		const fechaInicio = `${periodo.anio}-${mesStr}-01`;
		const fechaFin = `${periodo.anio}-${mesStr}-${lastDay}`;

		// Total ventas
		const { data: ventasData } = await supabase
			.rpc('calcular_total_ventas_periodo', {
				p_empresa_id: empresaId,
				p_fecha_inicio: fechaInicio,
				p_fecha_fin: fechaFin,
			});

		const ventas = ventasData?.[0] || {};

		// Total compras
		const { data: comprasData, count: totalCompras } = await supabase
			.from('compras_recibidas')
			.select('base_imponible_iva, monto_iva', { count: 'exact' })
			.eq('empresa_id', empresaId)
			.gte('fecha_registro', fechaInicio)
			.lte('fecha_registro', fechaFin);

		const totalBaseCompras = (comprasData || []).reduce((s, c) => s + parseFloat(c.base_imponible_iva || 0), 0);
		const totalIVACompras = (comprasData || []).reduce((s, c) => s + parseFloat(c.monto_iva || 0), 0);

		contexto = {
			anio: periodo.anio,
			mes: periodo.mes,
			totalVentas: parseFloat(ventas.total || 0).toFixed(2),
			totalCompras: totalBaseCompras.toFixed(2),
			ivaCobrado: parseFloat(ventas.total_iva || 0).toFixed(2),
			ivaPagado: totalIVACompras.toFixed(2),
			creditoTributario: Math.max(0, totalIVACompras - parseFloat(ventas.total_iva || 0)).toFixed(2),
			totalRetenciones: '0.00',
			totalComprobantes: ventas.num_comprobantes || 0,
		};
	}

	const result = streamText({
		model: google('gemini-3-flash-preview', { thinkingLevel: 'low' }),
		system: getChatReportesPrompt(empresa, contexto),
		messages,
	});

	return result.toUIMessageStreamResponse();
}
