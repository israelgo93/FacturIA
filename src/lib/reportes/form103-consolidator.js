/**
 * Consolidador de datos para pre-llenado del Formulario 103 (Retenciones)
 * Agrupa retenciones por código para declaración mensual
 */
import { getRangoPeriodo } from '@/lib/utils/vencimientos';

/**
 * Consolida datos para el Form 103
 * @param {Object} supabase - Cliente Supabase
 * @param {string} empresaId - UUID empresa
 * @param {number} anio
 * @param {number} mes
 * @returns {Object} Casilleros del formulario 103
 */
export async function consolidarForm103(supabase, empresaId, anio, mes) {
	const { fechaInicio, fechaFin } = getRangoPeriodo(anio, mes, false);

	// Retenciones de comprobantes electrónicos emitidos
	const { data: retenciones } = await supabase
		.from('retencion_detalles')
		.select(`
			codigo_impuesto, codigo_retencion, base_imponible, 
			porcentaje_retener, valor_retenido,
			comprobante:comprobantes!inner(estado, fecha_emision, empresa_id)
		`)
		.eq('empresa_id', empresaId);

	// Filtrar solo autorizadas en el período
	const retencionesEnPeriodo = (retenciones || []).filter((r) => {
		const comp = r.comprobante;
		if (!comp || comp.estado !== 'AUT') return false;
		const fecha = comp.fecha_emision;
		return fecha >= fechaInicio && fecha <= fechaFin;
	});

	// Retenciones de compras recibidas
	const { data: retCompras } = await supabase
		.from('compras_recibidas_retenciones')
		.select(`
			tipo_retencion, codigo_retencion, base_imponible,
			porcentaje, valor_retenido,
			compra:compras_recibidas!inner(fecha_registro, empresa_id)
		`)
		.eq('empresa_id', empresaId);

	const retComprasEnPeriodo = (retCompras || []).filter((r) => {
		const compra = r.compra;
		if (!compra) return false;
		return compra.fecha_registro >= fechaInicio && compra.fecha_registro <= fechaFin;
	});

	// Agrupar por código de retención
	const casilleros = {};

	// Retenciones de comprobantes electrónicos (código impuesto 1 = renta)
	for (const ret of retencionesEnPeriodo) {
		if (ret.codigo_impuesto === '1') {
			const cod = ret.codigo_retencion;
			if (!casilleros[cod]) {
				casilleros[cod] = { codigo: cod, baseImponible: 0, valorRetenido: 0, porcentaje: parseFloat(ret.porcentaje_retener || 0) };
			}
			casilleros[cod].baseImponible += parseFloat(ret.base_imponible || 0);
			casilleros[cod].valorRetenido += parseFloat(ret.valor_retenido || 0);
		}
	}

	// Retenciones de compras recibidas (tipo_retencion 1 = renta)
	for (const ret of retComprasEnPeriodo) {
		if (ret.tipo_retencion === '1') {
			const cod = ret.codigo_retencion;
			if (!casilleros[cod]) {
				casilleros[cod] = { codigo: cod, baseImponible: 0, valorRetenido: 0, porcentaje: parseFloat(ret.porcentaje || 0) };
			}
			casilleros[cod].baseImponible += parseFloat(ret.base_imponible || 0);
			casilleros[cod].valorRetenido += parseFloat(ret.valor_retenido || 0);
		}
	}

	// Retenciones IVA
	const retencionesIVA = {};
	for (const ret of [...retencionesEnPeriodo, ...retComprasEnPeriodo]) {
		const tipo = ret.codigo_impuesto || ret.tipo_retencion;
		if (tipo === '2') {
			const cod = ret.codigo_retencion;
			if (!retencionesIVA[cod]) {
				retencionesIVA[cod] = { codigo: cod, baseImponible: 0, valorRetenido: 0, porcentaje: parseFloat(ret.porcentaje_retener || ret.porcentaje || 0) };
			}
			retencionesIVA[cod].baseImponible += parseFloat(ret.base_imponible || 0);
			retencionesIVA[cod].valorRetenido += parseFloat(ret.valor_retenido || 0);
		}
	}

	const totalRetencionesRenta = Object.values(casilleros).reduce((s, c) => s + c.valorRetenido, 0);
	const totalRetencionesIVA = Object.values(retencionesIVA).reduce((s, c) => s + c.valorRetenido, 0);

	return {
		retencionesRenta: Object.values(casilleros).sort((a, b) => a.codigo.localeCompare(b.codigo)),
		retencionesIVA: Object.values(retencionesIVA).sort((a, b) => a.codigo.localeCompare(b.codigo)),
		totalRetencionesRenta,
		totalRetencionesIVA,
		totalAPagar: totalRetencionesRenta + totalRetencionesIVA,
		periodo: { anio, mes, fechaInicio, fechaFin },
	};
}
