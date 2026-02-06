/**
 * Constructor de XML para comprobantes electrónicos
 * Basado en Ficha Técnica SRI — Anexo 3 (Factura v1.1.0)
 * 
 * Usa fast-xml-parser para generar XML conforme al XSD del SRI.
 */
import { XMLBuilder } from 'fast-xml-parser';

const xmlBuilder = new XMLBuilder({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	format: true,
	indentBy: '  ',
	suppressEmptyNode: true,
	processEntities: false,
});

/**
 * Construye el XML de una factura electrónica v1.1.0
 * @param {Object} factura - Datos completos de la factura
 * @returns {string} XML generado
 */
export function buildFacturaXML(factura) {
	const xmlObj = {
		factura: {
			'@_id': 'comprobante',
			'@_version': '1.1.0',
			infoTributaria: buildInfoTributaria(factura),
			infoFactura: buildInfoFactura(factura),
			detalles: {
				detalle: factura.detalles.map(buildDetalle),
			},
		},
	};

	// Formas de pago
	if (factura.pagos && factura.pagos.length > 0) {
		xmlObj.factura.infoFactura.pagos = {
			pago: factura.pagos.map((pago) => ({
				formaPago: pago.formaPago,
				total: Number(pago.total).toFixed(2),
				...(pago.plazo && { plazo: pago.plazo }),
				...(pago.unidadTiempo && { unidadTiempo: pago.unidadTiempo }),
			})),
		};
	}

	// Info adicional (opcional)
	if (factura.infoAdicional && factura.infoAdicional.length > 0) {
		xmlObj.factura.infoAdicional = {
			campoAdicional: factura.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);

	// Agregar declaración XML manualmente (fast-xml-parser no la agrega con build)
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Construye la sección infoTributaria
 */
function buildInfoTributaria(f) {
	return {
		ambiente: f.ambiente,
		tipoEmision: f.tipoEmision || '1',
		razonSocial: f.emisor.razonSocial,
		...(f.emisor.nombreComercial && { nombreComercial: f.emisor.nombreComercial }),
		ruc: f.emisor.ruc,
		claveAcceso: f.claveAcceso,
		codDoc: f.tipoComprobante,
		estab: f.establecimiento.codigo,
		ptoEmi: f.puntoEmision.codigo,
		secuencial: f.secuencial,
		dirMatriz: f.emisor.direccion,
		...(f.emisor.agenteRetencion && { agenteRetencion: f.emisor.agenteRetencion }),
		...(f.emisor.contribuyenteRimpe && { contribuyenteRimpe: f.emisor.contribuyenteRimpe }),
	};
}

/**
 * Construye la sección infoFactura
 */
function buildInfoFactura(f) {
	return {
		fechaEmision: formatDateSRI(f.fechaEmision),
		...(f.establecimiento.direccion && { dirEstablecimiento: f.establecimiento.direccion }),
		...(f.emisor.contribuyenteEspecial && { contribuyenteEspecial: f.emisor.contribuyenteEspecial }),
		obligadoContabilidad: f.emisor.obligadoContabilidad ? 'SI' : 'NO',
		tipoIdentificacionComprador: f.comprador.tipoIdentificacion,
		...(f.comprador.guiaRemision && { guiaRemision: f.comprador.guiaRemision }),
		razonSocialComprador: f.comprador.razonSocial,
		identificacionComprador: f.comprador.identificacion,
		...(f.comprador.direccion && { direccionComprador: f.comprador.direccion }),
		totalSinImpuestos: Number(f.totales.totalSinImpuestos).toFixed(2),
		totalDescuento: Number(f.totales.totalDescuento).toFixed(2),
		totalConImpuestos: {
			totalImpuesto: buildTotalImpuestos(f.totales.impuestos),
		},
		propina: Number(f.totales.propina || 0).toFixed(2),
		importeTotal: Number(f.totales.importeTotal).toFixed(2),
		moneda: f.moneda || 'DOLAR',
	};
}

/**
 * Construye una línea de detalle
 */
function buildDetalle(detalle) {
	return {
		codigoPrincipal: detalle.codigoPrincipal,
		...(detalle.codigoAuxiliar && { codigoAuxiliar: detalle.codigoAuxiliar }),
		descripcion: detalle.descripcion,
		cantidad: Number(detalle.cantidad).toFixed(6),
		precioUnitario: Number(detalle.precioUnitario).toFixed(6),
		descuento: Number(detalle.descuento || 0).toFixed(2),
		precioTotalSinImpuesto: Number(detalle.precioTotalSinImpuesto).toFixed(2),
		...(detalle.detallesAdicionales &&
			detalle.detallesAdicionales.length > 0 && {
				detallesAdicionales: {
					detAdicional: detalle.detallesAdicionales.map((d) => ({
						'@_nombre': d.nombre,
						'@_valor': d.valor,
					})),
				},
			}),
		impuestos: {
			impuesto: detalle.impuestos.map((imp) => ({
				codigo: imp.codigo,
				codigoPorcentaje: imp.codigoPorcentaje,
				tarifa: Number(imp.tarifa).toFixed(2),
				baseImponible: Number(imp.baseImponible).toFixed(2),
				valor: Number(imp.valor).toFixed(2),
			})),
		},
	};
}

/**
 * Construye los totales de impuestos agrupados
 */
function buildTotalImpuestos(impuestos) {
	return impuestos.map((imp) => ({
		codigo: imp.codigo,
		codigoPorcentaje: imp.codigoPorcentaje,
		baseImponible: Number(imp.baseImponible).toFixed(2),
		valor: Number(imp.valor).toFixed(2),
	}));
}

/**
 * Formatea fecha al formato SRI: dd/mm/aaaa
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateSRI(date) {
	const d = new Date(date);
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}/${mm}/${yyyy}`;
}
