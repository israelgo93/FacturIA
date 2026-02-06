/**
 * Generador de reporte de ventas por período
 */
import { getRangoPeriodo } from '@/lib/utils/vencimientos';

/**
 * Genera reporte de ventas
 * @param {Object} supabase
 * @param {string} empresaId
 * @param {number} anio
 * @param {number} mes
 * @returns {Object} Datos del reporte de ventas
 */
export async function generarReporteVentas(supabase, empresaId, anio, mes) {
	const { fechaInicio, fechaFin } = getRangoPeriodo(anio, mes, false);

	const { data: comprobantes } = await supabase
		.from('comprobantes')
		.select(`
			id, tipo_comprobante, serie, secuencial, numero_completo,
			clave_acceso, fecha_emision, estado,
			razon_social_comprador, identificacion_comprador,
			subtotal_sin_impuestos, subtotal_iva, subtotal_iva_0,
			subtotal_exento, subtotal_no_objeto,
			valor_iva, importe_total, total_descuento
		`)
		.eq('empresa_id', empresaId)
		.in('tipo_comprobante', ['01', '03', '04', '05'])
		.gte('fecha_emision', fechaInicio)
		.lte('fecha_emision', fechaFin)
		.order('fecha_emision', { ascending: true });

	const datos = comprobantes || [];
	const autorizados = datos.filter((c) => c.estado === 'AUT');

	const totalFacturas = autorizados.filter((c) => c.tipo_comprobante === '01' || c.tipo_comprobante === '03');
	const totalNC = autorizados.filter((c) => c.tipo_comprobante === '04');
	const totalND = autorizados.filter((c) => c.tipo_comprobante === '05');

	const sumarCampo = (arr, campo) => arr.reduce((s, c) => s + parseFloat(c[campo] || 0), 0);

	return {
		comprobantes: datos,
		resumen: {
			totalFacturas: totalFacturas.length,
			totalNC: totalNC.length,
			totalND: totalND.length,
			ventasBrutas: sumarCampo(totalFacturas, 'importe_total'),
			devolucionesNC: sumarCampo(totalNC, 'importe_total'),
			cargosND: sumarCampo(totalND, 'importe_total'),
			ventasNetas: sumarCampo(totalFacturas, 'importe_total') - sumarCampo(totalNC, 'importe_total') + sumarCampo(totalND, 'importe_total'),
			baseGravada: sumarCampo(autorizados, 'subtotal_iva'),
			base0: sumarCampo(autorizados, 'subtotal_iva_0'),
			totalIVA: sumarCampo(autorizados, 'valor_iva'),
			totalDescuentos: sumarCampo(autorizados, 'total_descuento'),
		},
		periodo: { anio, mes, fechaInicio, fechaFin },
	};
}
