/**
 * API Route para chat IA tributario — consulta datos en tiempo real
 * Usa Vercel AI SDK con Gemini 3 Flash para streaming
 */
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getAnalisisSystemPrompt } from '@/lib/ia/reportes-prompts';

export const maxDuration = 30;

export async function POST(req) {
	const { messages, empresaId } = await req.json();
	const supabase = await createClient();

	// Obtener datos de la empresa
	let empresa = null;
	if (empresaId) {
		const { data } = await supabase
			.from('empresas')
			.select('ruc, razon_social, obligado_contabilidad, regimen_fiscal, contribuyente_especial, agente_retencion')
			.eq('id', empresaId)
			.single();
		empresa = data;
	}

	// Obtener KPIs del dashboard (mes actual)
	let kpis = {};
	if (empresaId) {
		const { data } = await supabase
			.from('v_dashboard_kpis')
			.select('*')
			.eq('empresa_id', empresaId)
			.maybeSingle();
		if (data) kpis = data;
	}

	// Obtener contexto amplio: mes actual y mes anterior
	let contexto = {};
	if (empresaId) {
		const hoy = new Date();
		const mesActual = hoy.getMonth() + 1;
		const anioActual = hoy.getFullYear();
		const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
		const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

		// Ventas mes actual
		const fechaInicioActual = `${anioActual}-${String(mesActual).padStart(2, '0')}-01`;
		const lastDayActual = new Date(anioActual, mesActual, 0).getDate();
		const fechaFinActual = `${anioActual}-${String(mesActual).padStart(2, '0')}-${lastDayActual}`;

		// Ventas mes anterior
		const fechaInicioAnterior = `${anioAnterior}-${String(mesAnterior).padStart(2, '0')}-01`;
		const lastDayAnterior = new Date(anioAnterior, mesAnterior, 0).getDate();
		const fechaFinAnterior = `${anioAnterior}-${String(mesAnterior).padStart(2, '0')}-${lastDayAnterior}`;

		// Comprobantes mes actual por tipo y estado
		const { data: compActual } = await supabase
			.from('comprobantes')
			.select('tipo_comprobante, estado, importe_total, valor_iva')
			.eq('empresa_id', empresaId)
			.gte('fecha_emision', fechaInicioActual)
			.lte('fecha_emision', fechaFinActual);

		// Comprobantes mes anterior
		const { data: compAnterior } = await supabase
			.from('comprobantes')
			.select('tipo_comprobante, estado, importe_total, valor_iva')
			.eq('empresa_id', empresaId)
			.gte('fecha_emision', fechaInicioAnterior)
			.lte('fecha_emision', fechaFinAnterior);

		// Compras mes actual
		const { data: comprasActual } = await supabase
			.from('compras_recibidas')
			.select('base_imponible_iva, base_imponible_0, monto_iva, base_no_grava_iva')
			.eq('empresa_id', empresaId)
			.gte('fecha_registro', fechaInicioActual)
			.lte('fecha_registro', fechaFinActual);

		// Compras mes anterior
		const { data: comprasAnterior } = await supabase
			.from('compras_recibidas')
			.select('base_imponible_iva, base_imponible_0, monto_iva')
			.eq('empresa_id', empresaId)
			.gte('fecha_registro', fechaInicioAnterior)
			.lte('fecha_registro', fechaFinAnterior);

		// Retenciones emitidas
		const { data: retActual } = await supabase
			.from('retencion_detalles')
			.select('valor_retenido, codigo_impuesto')
			.eq('empresa_id', empresaId);

		const sumarComprobantes = (lista) => {
			const arr = lista || [];
			const facturas = arr.filter(c => c.tipo_comprobante === '01' && c.estado === 'AUT');
			return {
				total_facturas: facturas.length,
				ventas: facturas.reduce((s, c) => s + parseFloat(c.importe_total || 0), 0).toFixed(2),
				iva_cobrado: facturas.reduce((s, c) => s + parseFloat(c.valor_iva || 0), 0).toFixed(2),
				total_comprobantes: arr.length,
				autorizados: arr.filter(c => c.estado === 'AUT').length,
				pendientes: arr.filter(c => c.estado === 'PPR' || c.estado === 'draft').length,
			};
		};

		const sumarCompras = (lista) => {
			const arr = lista || [];
			return {
				total: arr.reduce((s, c) => s + parseFloat(c.base_imponible_iva || 0), 0).toFixed(2),
				iva_pagado: arr.reduce((s, c) => s + parseFloat(c.monto_iva || 0), 0).toFixed(2),
				cantidad: arr.length,
			};
		};

		const mesActualData = sumarComprobantes(compActual);
		const mesAnteriorData = sumarComprobantes(compAnterior);
		const comprasMesActual = sumarCompras(comprasActual);
		const comprasMesAnterior = sumarCompras(comprasAnterior);

		const totalRetencionesRenta = (retActual || [])
			.filter(r => r.codigo_impuesto === '1')
			.reduce((s, r) => s + parseFloat(r.valor_retenido || 0), 0);
		const totalRetencionesIVA = (retActual || [])
			.filter(r => r.codigo_impuesto === '2')
			.reduce((s, r) => s + parseFloat(r.valor_retenido || 0), 0);

		contexto = {
			fecha_hoy: hoy.toISOString().split('T')[0],
			mes_actual: { periodo: `${mesActual}/${anioActual}`, ...mesActualData, compras: comprasMesActual },
			mes_anterior: { periodo: `${mesAnterior}/${anioAnterior}`, ...mesAnteriorData, compras: comprasMesAnterior },
			retenciones: { renta: totalRetencionesRenta.toFixed(2), iva: totalRetencionesIVA.toFixed(2) },
			clientes_activos: kpis.total_clientes || 0,
		};
	}

	const systemPrompt = buildDynamicPrompt(empresa, contexto);

	const result = streamText({
		model: google('gemini-3-flash-preview', { thinkingLevel: 'low' }),
		system: systemPrompt,
		messages: await convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
}

function buildDynamicPrompt(empresa, ctx) {
	const base = getAnalisisSystemPrompt(empresa);
	const ma = ctx.mes_actual || {};
	const mp = ctx.mes_anterior || {};

	return `${base}

FECHA ACTUAL: ${ctx.fecha_hoy || 'N/A'}

DATOS FISCALES EN TIEMPO REAL:

MES ACTUAL (${ma.periodo || 'N/A'}):
- Facturas autorizadas: ${ma.total_facturas || 0}
- Total ventas (facturas AUT): $${ma.ventas || '0.00'}
- IVA cobrado en ventas: $${ma.iva_cobrado || '0.00'}
- Total comprobantes emitidos: ${ma.total_comprobantes || 0}
- Autorizados SRI: ${ma.autorizados || 0} | Pendientes: ${ma.pendientes || 0}
- Compras registradas: ${ma.compras?.cantidad || 0} por $${ma.compras?.total || '0.00'}
- IVA pagado en compras: $${ma.compras?.iva_pagado || '0.00'}
- Credito tributario IVA: $${(parseFloat(ma.compras?.iva_pagado || 0) - parseFloat(ma.iva_cobrado || 0) > 0 ? (parseFloat(ma.compras?.iva_pagado || 0) - parseFloat(ma.iva_cobrado || 0)).toFixed(2) : '0.00')}
- IVA a pagar: $${(parseFloat(ma.iva_cobrado || 0) - parseFloat(ma.compras?.iva_pagado || 0) > 0 ? (parseFloat(ma.iva_cobrado || 0) - parseFloat(ma.compras?.iva_pagado || 0)).toFixed(2) : '0.00')}

MES ANTERIOR (${mp.periodo || 'N/A'}):
- Ventas: $${mp.ventas || '0.00'} | IVA: $${mp.iva_cobrado || '0.00'}
- Compras: $${mp.compras?.total || '0.00'} | IVA compras: $${mp.compras?.iva_pagado || '0.00'}

RETENCIONES ACUMULADAS:
- Renta: $${ctx.retenciones?.renta || '0.00'}
- IVA: $${ctx.retenciones?.iva || '0.00'}

TOTALES:
- Clientes activos: ${ctx.clientes_activos || 0}

REGLAS ADICIONALES:
- El usuario NO selecciona fechas; tu debes responder con los datos disponibles
- Si el usuario pregunta por un periodo especifico que no tienes, indica que los datos mostrados son del mes actual y anterior
- Responde de forma directa y concisa
- Usa formato de moneda con $ y 2 decimales
- No repitas todos los datos en cada respuesta, solo los relevantes a la pregunta
- Puedes calcular variaciones porcentuales entre mes actual y anterior
- Calcula la fecha de vencimiento de declaraciones segun el 9no digito del RUC`;
}
