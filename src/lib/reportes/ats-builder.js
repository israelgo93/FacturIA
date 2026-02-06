/**
 * Constructor XML del ATS compatible con esquema at.xsd del SRI
 * Genera el XML del Anexo Transaccional Simplificado
 */

/**
 * Construye el XML del ATS
 * @param {Object} datos - Datos consolidados del ats-consolidator
 * @returns {string} XML del ATS
 */
export function construirXMLATS(datos) {
	const { cabecera, compras, ventas, anulados, ventasEstablecimiento } = datos;

	let xml = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
	xml += '<iva>\n';

	// === CABECERA ===
	xml += `  <TipoIDInformante>${cabecera.tipoIdInformante}</TipoIDInformante>\n`;
	xml += `  <IdInformante>${cabecera.idInformante}</IdInformante>\n`;
	xml += `  <razonSocial>${escapeXml(cabecera.razonSocial)}</razonSocial>\n`;
	xml += `  <Anio>${cabecera.anio}</Anio>\n`;
	xml += `  <Mes>${cabecera.mes}</Mes>\n`;
	if (cabecera.regimenMicroempresa) {
		xml += `  <regimenMicroempresa>${cabecera.regimenMicroempresa}</regimenMicroempresa>\n`;
	}
	xml += `  <numEstabRuc>${cabecera.numEstabRuc}</numEstabRuc>\n`;
	xml += `  <totalVentas>${cabecera.totalVentas}</totalVentas>\n`;
	xml += `  <codigoOperativo>${cabecera.codigoOperativo}</codigoOperativo>\n`;

	// === MÓDULO COMPRAS ===
	if (compras.length > 0) {
		xml += '  <compras>\n';
		for (const compra of compras) {
			xml += construirDetalleCompra(compra);
		}
		xml += '  </compras>\n';
	}

	// === MÓDULO VENTAS ===
	if (ventas.length > 0) {
		xml += '  <ventas>\n';
		for (const venta of ventas) {
			xml += construirDetalleVenta(venta);
		}
		xml += '  </ventas>\n';
	}

	// === MÓDULO ANULADOS ===
	if (anulados.length > 0) {
		xml += '  <anulados>\n';
		for (const anulado of anulados) {
			xml += construirDetalleAnulado(anulado);
		}
		xml += '  </anulados>\n';
	}

	// === VENTAS POR ESTABLECIMIENTO ===
	xml += '  <ventasEstablecimiento>\n';
	for (const estab of ventasEstablecimiento) {
		xml += '    <ventaEst>\n';
		xml += `      <codEstab>${estab.codigo}</codEstab>\n`;
		xml += `      <ventasEstab>${formatDecimal(estab.totalVentas)}</ventasEstab>\n`;
		xml += `      <ivaComp>${formatDecimal(estab.ivaCompensado || 0)}</ivaComp>\n`;
		xml += '    </ventaEst>\n';
	}
	xml += '  </ventasEstablecimiento>\n';

	xml += '</iva>';
	return xml;
}

/**
 * Construye el detalle de una compra para el ATS
 */
function construirDetalleCompra(compra) {
	const retenciones = compra.compras_recibidas_retenciones || [];
	let xml = '    <detalleCompras>\n';
	xml += `      <codSustento>${compra.cod_sustento}</codSustento>\n`;
	xml += `      <tpIdProv>${compra.tipo_id_proveedor}</tpIdProv>\n`;
	xml += `      <idProv>${compra.identificacion_proveedor}</idProv>\n`;
	xml += `      <tipoComprobante>${compra.tipo_comprobante.padStart(2, '0')}</tipoComprobante>\n`;
	xml += `      <parteRel>${compra.parte_relacionada || 'NO'}</parteRel>\n`;
	xml += `      <fechaRegistro>${compra.fecha_registro}</fechaRegistro>\n`;
	xml += `      <establecimiento>${compra.establecimiento}</establecimiento>\n`;
	xml += `      <puntoEmision>${compra.punto_emision}</puntoEmision>\n`;
	xml += `      <secuencial>${(compra.secuencial || '').padStart(9, '0')}</secuencial>\n`;
	xml += `      <fechaEmision>${formatFechaSlash(compra.fecha_emision)}</fechaEmision>\n`;
	xml += `      <autorizacion>${compra.autorizacion || ''}</autorizacion>\n`;
	xml += `      <baseNoGraIva>${formatDecimal(compra.base_no_grava_iva)}</baseNoGraIva>\n`;
	xml += `      <baseImponible>${formatDecimal(compra.base_imponible_0)}</baseImponible>\n`;
	xml += `      <baseImpGrav>${formatDecimal(compra.base_imponible_iva)}</baseImpGrav>\n`;
	xml += `      <baseImpExe>${formatDecimal(compra.base_imp_exenta)}</baseImpExe>\n`;
	xml += `      <montoIce>${formatDecimal(compra.monto_ice)}</montoIce>\n`;
	xml += `      <montoIva>${formatDecimal(compra.monto_iva)}</montoIva>\n`;

	// Retenciones de IVA desglosadas
	const retIva = desglosarRetencionesIVA(retenciones);
	xml += `      <valorRetBienes>${formatDecimal(retIva.bienes)}</valorRetBienes>\n`;
	xml += `      <valorRetServicios>${formatDecimal(retIva.servicios)}</valorRetServicios>\n`;
	xml += `      <valRetBien10>${formatDecimal(retIva.bien10)}</valRetBien10>\n`;
	xml += `      <valRetServ20>${formatDecimal(retIva.serv20)}</valRetServ20>\n`;
	xml += `      <valRetServ50>${formatDecimal(retIva.serv50)}</valRetServ50>\n`;
	xml += `      <valorRetBienes100>${formatDecimal(retIva.bienes100)}</valorRetBienes100>\n`;
	xml += `      <valorRetServicios100>${formatDecimal(retIva.servicios100)}</valorRetServicios100>\n`;
	xml += '      <totbasesImpReemb>0.00</totbasesImpReemb>\n';

	// Pago exterior
	xml += '      <pagoExterior>\n';
	xml += `        <pagoLocExt>${compra.pago_loc_ext || '01'}</pagoLocExt>\n`;
	if (compra.pago_loc_ext === '02' && compra.pais_pago) {
		xml += `        <paisEfecPago>${compra.pais_pago}</paisEfecPago>\n`;
	}
	xml += '      </pagoExterior>\n';

	// Formas de pago (obligatorio si total > $500)
	const totalCompra = parseFloat(compra.base_imponible_iva || 0) +
		parseFloat(compra.base_imponible_0 || 0) +
		parseFloat(compra.monto_iva || 0);
	if (totalCompra > 500 || compra.forma_pago) {
		xml += '      <formasDePago>\n';
		xml += `        <formaPago>${compra.forma_pago || '20'}</formaPago>\n`;
		xml += '      </formasDePago>\n';
	}

	// Retenciones AIR (Renta)
	const retAir = retenciones.filter((r) => r.tipo_retencion === '1');
	if (retAir.length > 0) {
		xml += '      <air>\n';
		for (const ret of retAir) {
			xml += '        <detalleAir>\n';
			xml += `          <codRetAir>${ret.codigo_retencion}</codRetAir>\n`;
			xml += `          <baseImpAir>${formatDecimal(ret.base_imponible)}</baseImpAir>\n`;
			xml += `          <porcentajeAir>${formatDecimal(ret.porcentaje)}</porcentajeAir>\n`;
			xml += `          <valRetAir>${formatDecimal(ret.valor_retenido)}</valRetAir>\n`;
			xml += '        </detalleAir>\n';
		}
		xml += '      </air>\n';
	}

	xml += '    </detalleCompras>\n';
	return xml;
}

/**
 * Construye detalle de venta para ATS
 */
function construirDetalleVenta(venta) {
	let xml = '    <detalleVentas>\n';
	xml += `      <tpIdCliente>${venta.tipoIdCliente}</tpIdCliente>\n`;
	xml += `      <idCliente>${venta.idCliente}</idCliente>\n`;
	xml += `      <parteRelVtas>NO</parteRelVtas>\n`;
	xml += `      <tipoComprobante>${venta.tipoComprobante}</tipoComprobante>\n`;
	xml += `      <tipoEmision>E</tipoEmision>\n`;
	xml += `      <numeroComprobantes>${venta.numeroComprobantes}</numeroComprobantes>\n`;
	xml += `      <baseNoGraIva>${formatDecimal(venta.baseNoGraIva)}</baseNoGraIva>\n`;
	xml += `      <baseImponible>${formatDecimal(venta.baseImponible)}</baseImponible>\n`;
	xml += `      <baseImpGrav>${formatDecimal(venta.baseImpGrav)}</baseImpGrav>\n`;
	xml += `      <montoIva>${formatDecimal(venta.montoIva)}</montoIva>\n`;
	xml += `      <montoIce>${formatDecimal(venta.montoIce)}</montoIce>\n`;
	xml += `      <valorRetIva>${formatDecimal(venta.valorRetIva)}</valorRetIva>\n`;
	xml += `      <valorRetRenta>${formatDecimal(venta.valorRetRenta)}</valorRetRenta>\n`;
	xml += `      <formaPago>${venta.formaPago || '20'}</formaPago>\n`;
	xml += '    </detalleVentas>\n';
	return xml;
}

/**
 * Construye detalle de comprobante anulado
 */
function construirDetalleAnulado(anulado) {
	let xml = '    <detalleAnulados>\n';
	xml += `      <tipoComprobante>${anulado.tipoComprobante}</tipoComprobante>\n`;
	xml += `      <establecimiento>${anulado.establecimiento}</establecimiento>\n`;
	xml += `      <puntoEmision>${anulado.puntoEmision}</puntoEmision>\n`;
	xml += `      <secuencialInicio>${anulado.secuencialInicio}</secuencialInicio>\n`;
	xml += `      <secuencialFin>${anulado.secuencialFin}</secuencialFin>\n`;
	xml += `      <autorizacion>${anulado.autorizacion || ''}</autorizacion>\n`;
	xml += '    </detalleAnulados>\n';
	return xml;
}

/**
 * Desglosa retenciones de IVA por porcentaje
 */
function desglosarRetencionesIVA(retenciones) {
	const retIva = retenciones.filter((r) => r.tipo_retencion === '2');
	const result = {
		bienes: 0, servicios: 0, bien10: 0,
		serv20: 0, serv50: 0, bienes100: 0, servicios100: 0,
	};

	for (const ret of retIva) {
		const pct = parseFloat(ret.porcentaje);
		const val = parseFloat(ret.valor_retenido || 0);
		if (pct === 30) result.bienes += val;
		else if (pct === 70) result.servicios += val;
		else if (pct === 10) result.bien10 += val;
		else if (pct === 20) result.serv20 += val;
		else if (pct === 50) result.serv50 += val;
		else if (pct === 100) {
			// Asumir servicios si no se especifica
			result.servicios100 += val;
		}
	}

	return result;
}

// Utilidades
function formatDecimal(value) {
	return parseFloat(value || 0).toFixed(2);
}

function formatFechaSlash(fecha) {
	if (!fecha) return '';
	const d = new Date(fecha + 'T00:00:00');
	return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function escapeXml(str) {
	return (str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export { escapeXml, formatFechaSlash };
