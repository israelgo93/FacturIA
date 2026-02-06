/**
 * Exportador Excel para reportes tributarios
 * Usa SheetJS (xlsx) para generar archivos .xlsx
 */
import * as XLSX from 'xlsx';

/**
 * Exporta datos del ATS a Excel
 * @param {Object} datosConsolidados - Datos del ats-consolidator
 * @returns {Buffer} Excel como Buffer
 */
export function exportarATSExcel(datosConsolidados) {
	const wb = XLSX.utils.book_new();

	// Hoja: Resumen
	const resumenData = [
		['Anexo Transaccional Simplificado (ATS)'],
		['RUC Informante', datosConsolidados.cabecera.idInformante],
		['Razón Social', datosConsolidados.cabecera.razonSocial],
		['Año', datosConsolidados.cabecera.anio],
		['Mes', datosConsolidados.cabecera.mes],
		['Total Ventas', datosConsolidados.cabecera.totalVentas],
		['Total Compras Registradas', datosConsolidados.resumen?.totalCompras || 0],
		['Base Total Compras', datosConsolidados.resumen?.totalBaseCompras?.toFixed(2) || '0.00'],
		['IVA Total Compras', datosConsolidados.resumen?.totalIVACompras?.toFixed(2) || '0.00'],
	];
	const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
	XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

	// Hoja: Compras
	if (datosConsolidados.compras.length > 0) {
		const comprasData = datosConsolidados.compras.map((c) => ({
			'Cód. Sustento': c.cod_sustento,
			'Tipo ID Prov.': c.tipo_id_proveedor,
			'RUC/CI Proveedor': c.identificacion_proveedor,
			'Razón Social': c.razon_social_proveedor,
			'Tipo Comp.': c.tipo_comprobante,
			'Establecimiento': c.establecimiento,
			'Pto. Emisión': c.punto_emision,
			'Secuencial': c.secuencial,
			'Fecha Emisión': c.fecha_emision,
			'Base 0%': parseFloat(c.base_imponible_0 || 0),
			'Base Gravada': parseFloat(c.base_imponible_iva || 0),
			'IVA': parseFloat(c.monto_iva || 0),
			'Ret. Renta': parseFloat(c.retencion_renta || 0),
			'Ret. IVA': parseFloat(c.retencion_iva || 0),
			'Forma Pago': c.forma_pago || '',
		}));
		const wsCompras = XLSX.utils.json_to_sheet(comprasData);
		XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras');
	}

	return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Exporta datos del Form 104 a Excel
 * @param {Object} datos - Datos del form104-consolidator
 * @returns {Buffer}
 */
export function exportarForm104Excel(datos) {
	const wb = XLSX.utils.book_new();
	const rows = [
		['Formulario 104 - Declaración de IVA (Pre-llenado)'],
		['Período', `${datos.periodo.mes}/${datos.periodo.anio}`],
		[],
		['VENTAS'],
		['411 - Ventas gravadas (tarifa diferente 0%)', datos.casillero_411?.toFixed(2)],
		['421 - Ventas tarifa 0%', datos.casillero_421?.toFixed(2)],
		['422 - Ventas no objeto IVA', datos.casillero_422?.toFixed(2)],
		['423 - Ventas exentas IVA', datos.casillero_423?.toFixed(2)],
		['480 - Total transferencias', datos.casillero_480?.toFixed(2)],
		[],
		['COMPRAS'],
		['500 - Adquisiciones gravadas (crédito tributario)', datos.casillero_500?.toFixed(2)],
		['510 - Adquisiciones tarifa 0%', datos.casillero_510?.toFixed(2)],
		['520 - Adquisiciones exentas', datos.casillero_520?.toFixed(2)],
		[],
		['LIQUIDACIÓN DEL IVA'],
		['601 - IVA cobrado en ventas', datos.casillero_601?.toFixed(2)],
		['602 - IVA devuelto NC', datos.casillero_602?.toFixed(2)],
		['605 - IVA cobrado neto', datos.casillero_605?.toFixed(2)],
		['615 - Crédito tributario (IVA pagado)', datos.casillero_615?.toFixed(2)],
		[],
		['RESULTADO'],
		['Impuesto a pagar', datos.impuesto_a_pagar?.toFixed(2)],
		['Crédito próximo mes', datos.credito_proximo_mes?.toFixed(2)],
	];
	const ws = XLSX.utils.aoa_to_sheet(rows);
	XLSX.utils.book_append_sheet(wb, ws, 'Form 104');
	return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Exporta datos del Form 103 a Excel
 * @param {Object} datos - Datos del form103-consolidator
 * @returns {Buffer}
 */
export function exportarForm103Excel(datos) {
	const wb = XLSX.utils.book_new();

	// Retenciones Renta
	const rentaRows = [
		['Formulario 103 - Retenciones en la Fuente (Pre-llenado)'],
		['Período', `${datos.periodo.mes}/${datos.periodo.anio}`],
		[],
		['RETENCIONES DE RENTA'],
		['Código', 'Base Imponible', 'Porcentaje', 'Valor Retenido'],
		...datos.retencionesRenta.map((r) => [r.codigo, r.baseImponible.toFixed(2), `${r.porcentaje}%`, r.valorRetenido.toFixed(2)]),
		[],
		['Total Retenciones Renta', '', '', datos.totalRetencionesRenta.toFixed(2)],
		[],
		['RETENCIONES DE IVA'],
		['Código', 'Base Imponible', 'Porcentaje', 'Valor Retenido'],
		...datos.retencionesIVA.map((r) => [r.codigo, r.baseImponible.toFixed(2), `${r.porcentaje}%`, r.valorRetenido.toFixed(2)]),
		[],
		['Total Retenciones IVA', '', '', datos.totalRetencionesIVA.toFixed(2)],
		[],
		['TOTAL A PAGAR', '', '', datos.totalAPagar.toFixed(2)],
	];

	const ws = XLSX.utils.aoa_to_sheet(rentaRows);
	XLSX.utils.book_append_sheet(wb, ws, 'Form 103');
	return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Exporta reporte de ventas a Excel
 * @param {Object} datos - Datos del ventas-report
 * @returns {Buffer}
 */
export function exportarVentasExcel(datos) {
	const wb = XLSX.utils.book_new();

	// Hoja detalle
	const detalleData = datos.comprobantes.map((c) => ({
		'Tipo': c.tipo_comprobante,
		'Número': c.numero_completo || `${c.serie}-${c.secuencial}`,
		'Fecha': c.fecha_emision,
		'Cliente': c.razon_social_comprador || '',
		'RUC/CI': c.identificacion_comprador || '',
		'Subtotal': parseFloat(c.subtotal_sin_impuestos || 0),
		'Base Gravada': parseFloat(c.subtotal_iva || 0),
		'Base 0%': parseFloat(c.subtotal_iva_0 || 0),
		'IVA': parseFloat(c.valor_iva || 0),
		'Total': parseFloat(c.importe_total || 0),
		'Estado': c.estado,
	}));
	const wsDetalle = XLSX.utils.json_to_sheet(detalleData);
	XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Ventas');

	// Hoja resumen
	const resumen = [
		['Reporte de Ventas'],
		['Período', `${datos.periodo.mes}/${datos.periodo.anio}`],
		[],
		['Total Facturas', datos.resumen.totalFacturas],
		['Notas de Crédito', datos.resumen.totalNC],
		['Notas de Débito', datos.resumen.totalND],
		[],
		['Ventas Brutas', datos.resumen.ventasBrutas.toFixed(2)],
		['(-) Devoluciones NC', datos.resumen.devolucionesNC.toFixed(2)],
		['(+) Cargos ND', datos.resumen.cargosND.toFixed(2)],
		['= Ventas Netas', datos.resumen.ventasNetas.toFixed(2)],
		[],
		['Base Gravada', datos.resumen.baseGravada.toFixed(2)],
		['Base 0%', datos.resumen.base0.toFixed(2)],
		['Total IVA', datos.resumen.totalIVA.toFixed(2)],
		['Total Descuentos', datos.resumen.totalDescuentos.toFixed(2)],
	];
	const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
	XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

	return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}
