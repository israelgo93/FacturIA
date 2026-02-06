/**
 * Consolidador de datos para pre-llenado del Formulario 104 (IVA)
 * Calcula los casilleros del formulario de declaración de IVA
 */
import { getRangoPeriodo } from '@/lib/utils/vencimientos';

/**
 * Consolida datos para el Form 104
 * @param {Object} supabase - Cliente Supabase
 * @param {string} empresaId - UUID empresa
 * @param {number} anio
 * @param {number} mes
 * @param {boolean} esSemestral
 * @returns {Object} Casilleros del formulario 104
 */
export async function consolidarForm104(supabase, empresaId, anio, mes, esSemestral = false) {
	const { fechaInicio, fechaFin } = getRangoPeriodo(anio, mes, esSemestral);

	// Ventas del período (comprobantes autorizados)
	const { data: ventas } = await supabase
		.from('comprobantes')
		.select('tipo_comprobante, subtotal_iva, subtotal_iva_0, subtotal_no_objeto, subtotal_exento, valor_iva, importe_total')
		.eq('empresa_id', empresaId)
		.in('tipo_comprobante', ['01', '03'])
		.eq('estado', 'AUT')
		.gte('fecha_emision', fechaInicio)
		.lte('fecha_emision', fechaFin);

	// Notas de crédito del período
	const { data: notasCredito } = await supabase
		.from('comprobantes')
		.select('subtotal_iva, subtotal_iva_0, valor_iva, importe_total')
		.eq('empresa_id', empresaId)
		.eq('tipo_comprobante', '04')
		.eq('estado', 'AUT')
		.gte('fecha_emision', fechaInicio)
		.lte('fecha_emision', fechaFin);

	// Compras recibidas del período
	const { data: compras } = await supabase
		.from('compras_recibidas')
		.select('base_imponible_0, base_imponible_iva, base_imp_exenta, base_no_grava_iva, monto_iva')
		.eq('empresa_id', empresaId)
		.gte('fecha_registro', fechaInicio)
		.lte('fecha_registro', fechaFin);

	// Calcular ventas
	const sumVentas = (arr, campo) => (arr || []).reduce((s, v) => s + parseFloat(v[campo] || 0), 0);

	const ventasGravadas = sumVentas(ventas, 'subtotal_iva');
	const ventas0 = sumVentas(ventas, 'subtotal_iva_0');
	const ventasNoObjeto = sumVentas(ventas, 'subtotal_no_objeto');
	const ventasExentas = sumVentas(ventas, 'subtotal_exento');
	const ivaCobrado = sumVentas(ventas, 'valor_iva');

	// NC
	const ncIva = sumVentas(notasCredito, 'valor_iva');
	const ncBase = sumVentas(notasCredito, 'subtotal_iva');

	// Compras
	const comprasGravadas = sumVentas(compras, 'base_imponible_iva');
	const compras0 = sumVentas(compras, 'base_imponible_0');
	const comprasExentas = sumVentas(compras, 'base_imp_exenta');
	const ivaCompras = sumVentas(compras, 'monto_iva');

	const ivaCobradoNeto = ivaCobrado - ncIva;
	const creditoTributario = ivaCompras;

	return {
		// Ventas
		casillero_411: ventasGravadas,
		casillero_421: ventas0,
		casillero_422: ventasNoObjeto,
		casillero_423: ventasExentas,
		casillero_480: ventasGravadas + ventas0 + ventasNoObjeto + ventasExentas,
		// Compras
		casillero_500: comprasGravadas,
		casillero_510: compras0,
		casillero_520: comprasExentas,
		// IVA
		casillero_601: ivaCobrado,
		casillero_602: ncIva,
		casillero_605: ivaCobradoNeto,
		casillero_615: creditoTributario,
		// Resumen
		impuesto_a_pagar: Math.max(0, ivaCobradoNeto - creditoTributario),
		credito_proximo_mes: Math.max(0, creditoTributario - ivaCobradoNeto),
		periodo: { anio, mes, esSemestral, fechaInicio, fechaFin },
	};
}
