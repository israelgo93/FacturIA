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

// =============================================
// XML BUILDERS - FASE 4: Comprobantes Adicionales
// =============================================

/**
 * Construye la sección infoTributaria genérica para todos los comprobantes
 * @param {Object} data - Datos del comprobante
 * @returns {Object} Objeto infoTributaria
 */
function buildInfoTributariaGenerica(data) {
	return {
		ambiente: data.ambiente,
		tipoEmision: data.tipoEmision || '1',
		razonSocial: data.emisor.razonSocial,
		...(data.emisor.nombreComercial && { nombreComercial: data.emisor.nombreComercial }),
		ruc: data.emisor.ruc,
		claveAcceso: data.claveAcceso,
		codDoc: data.tipoComprobante,
		estab: data.establecimiento.codigo,
		ptoEmi: data.puntoEmision.codigo,
		secuencial: data.secuencial,
		dirMatriz: data.emisor.direccion,
		...(data.emisor.agenteRetencion && { agenteRetencion: data.emisor.agenteRetencion }),
		...(data.emisor.contribuyenteRimpe && { contribuyenteRimpe: data.emisor.contribuyenteRimpe }),
	};
}

/**
 * Construye el XML de una Nota de Crédito electrónica v1.1.0
 * Ficha Técnica SRI — Anexo 4 (Nota de Crédito)
 * @param {Object} nc - Datos completos de la nota de crédito
 * @returns {string} XML generado
 */
export function buildNotaCreditoXML(nc) {
	const xmlObj = {
		notaCredito: {
			'@_id': 'comprobante',
			'@_version': '1.1.0',
			infoTributaria: buildInfoTributariaGenerica(nc),
			infoNotaCredito: {
				fechaEmision: formatDateSRI(nc.fechaEmision),
				...(nc.establecimiento.direccion && { dirEstablecimiento: nc.establecimiento.direccion }),
				tipoIdentificacionComprador: nc.comprador.tipoIdentificacion,
				razonSocialComprador: nc.comprador.razonSocial,
				identificacionComprador: nc.comprador.identificacion,
				...(nc.emisor.contribuyenteEspecial && { contribuyenteEspecial: nc.emisor.contribuyenteEspecial }),
				obligadoContabilidad: nc.emisor.obligadoContabilidad ? 'SI' : 'NO',
				codDocModificado: nc.docSustento.tipo,
				numDocModificado: nc.docSustento.numero,
				fechaEmisionDocSustento: formatDateSRI(nc.docSustento.fecha),
				totalSinImpuestos: Number(nc.totales.totalSinImpuestos).toFixed(2),
				valorModificacion: Number(nc.totales.valorModificacion).toFixed(2),
				moneda: nc.moneda || 'DOLAR',
				totalConImpuestos: {
					totalImpuesto: nc.totales.impuestos.map((imp) => ({
						codigo: imp.codigo,
						codigoPorcentaje: imp.codigoPorcentaje,
						baseImponible: Number(imp.baseImponible).toFixed(2),
						valor: Number(imp.valor).toFixed(2),
					})),
				},
				motivo: nc.motivo,
			},
			detalles: {
				detalle: nc.detalles.map((d) => ({
					codigoInterno: d.codigoPrincipal,
					...(d.codigoAdicional && { codigoAdicional: d.codigoAdicional }),
					descripcion: d.descripcion,
					cantidad: Number(d.cantidad).toFixed(6),
					precioUnitario: Number(d.precioUnitario).toFixed(6),
					descuento: Number(d.descuento || 0).toFixed(2),
					precioTotalSinImpuesto: Number(d.precioTotalSinImpuesto).toFixed(2),
					impuestos: {
						impuesto: d.impuestos.map((imp) => ({
							codigo: imp.codigo,
							codigoPorcentaje: imp.codigoPorcentaje,
							tarifa: Number(imp.tarifa).toFixed(2),
							baseImponible: Number(imp.baseImponible).toFixed(2),
							valor: Number(imp.valor).toFixed(2),
						})),
					},
				})),
			},
		},
	};

	// Info adicional (opcional)
	if (nc.infoAdicional && nc.infoAdicional.length > 0) {
		xmlObj.notaCredito.infoAdicional = {
			campoAdicional: nc.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Construye el XML de una Nota de Débito electrónica v1.0.0
 * Ficha Técnica SRI — Anexo 5 (Nota de Débito)
 * @param {Object} nd - Datos completos de la nota de débito
 * @returns {string} XML generado
 */
export function buildNotaDebitoXML(nd) {
	const xmlObj = {
		notaDebito: {
			'@_id': 'comprobante',
			'@_version': '1.0.0',
			infoTributaria: buildInfoTributariaGenerica(nd),
			infoNotaDebito: {
				fechaEmision: formatDateSRI(nd.fechaEmision),
				...(nd.establecimiento.direccion && { dirEstablecimiento: nd.establecimiento.direccion }),
				tipoIdentificacionComprador: nd.comprador.tipoIdentificacion,
				razonSocialComprador: nd.comprador.razonSocial,
				identificacionComprador: nd.comprador.identificacion,
				...(nd.emisor.contribuyenteEspecial && { contribuyenteEspecial: nd.emisor.contribuyenteEspecial }),
				obligadoContabilidad: nd.emisor.obligadoContabilidad ? 'SI' : 'NO',
				codDocModificado: nd.docSustento.tipo,
				numDocModificado: nd.docSustento.numero,
				fechaEmisionDocSustento: formatDateSRI(nd.docSustento.fecha),
				totalSinImpuestos: Number(nd.totales.totalSinImpuestos).toFixed(2),
				impuestos: {
					impuesto: nd.totales.impuestos.map((imp) => ({
						codigo: imp.codigo,
						codigoPorcentaje: imp.codigoPorcentaje,
						tarifa: Number(imp.tarifa).toFixed(2),
						baseImponible: Number(imp.baseImponible).toFixed(2),
						valor: Number(imp.valor).toFixed(2),
					})),
				},
				valorTotal: Number(nd.totales.valorTotal).toFixed(2),
				pagos: {
					pago: nd.pagos.map((pago) => ({
						formaPago: pago.formaPago,
						total: Number(pago.total).toFixed(2),
						...(pago.plazo && { plazo: pago.plazo }),
						...(pago.unidadTiempo && { unidadTiempo: pago.unidadTiempo }),
					})),
				},
			},
			motivos: {
				motivo: nd.motivos.map((m) => ({
					razon: m.razon,
					valor: Number(m.valor).toFixed(2),
				})),
			},
		},
	};

	// Info adicional (opcional)
	if (nd.infoAdicional && nd.infoAdicional.length > 0) {
		xmlObj.notaDebito.infoAdicional = {
			campoAdicional: nd.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Construye el XML de un Comprobante de Retención electrónico v2.0.0
 * Ficha Técnica SRI — Anexo 10 (Comprobante de Retención)
 * @param {Object} ret - Datos completos de la retención
 * @returns {string} XML generado
 */
export function buildRetencionXML(ret) {
	const xmlObj = {
		comprobanteRetencion: {
			'@_id': 'comprobante',
			'@_version': '2.0.0',
			infoTributaria: buildInfoTributariaGenerica(ret),
			infoCompRetencion: {
				fechaEmision: formatDateSRI(ret.fechaEmision),
				...(ret.establecimiento.direccion && { dirEstablecimiento: ret.establecimiento.direccion }),
				...(ret.emisor.contribuyenteEspecial && { contribuyenteEspecial: ret.emisor.contribuyenteEspecial }),
				obligadoContabilidad: ret.emisor.obligadoContabilidad ? 'SI' : 'NO',
				tipoIdentificacionSujetoRetenido: ret.sujetoRetenido.tipoIdentificacion,
				...(ret.tipoSujetoRetenido && { tipoSujetoRetenido: ret.tipoSujetoRetenido }),
				parteRelacionada: ret.parteRelacionada || 'NO',
				razonSocialSujetoRetenido: ret.sujetoRetenido.razonSocial,
				identificacionSujetoRetenido: ret.sujetoRetenido.identificacion,
				periodoFiscal: ret.periodoFiscal,
			},
			docsSustento: {
				docSustento: ret.documentosSustento.map((doc) => ({
					codSustento: doc.codSustento,
					codDocSustento: doc.codDocSustento,
					numDocSustento: doc.numDocSustento,
					fechaEmisionDocSustento: formatDateSRI(doc.fechaEmision),
					fechaRegistroContable: formatDateSRI(doc.fechaRegistro || doc.fechaEmision),
					numAutDocSustento: doc.numAutorizacion,
					pagoLocExt: doc.pagoLocExt || '01',
					totalSinImpuestos: Number(doc.totalSinImpuestos).toFixed(2),
					importeTotal: Number(doc.importeTotal).toFixed(2),
					impuestosDocSustento: {
						impuestoDocSustento: doc.impuestos.map((imp) => ({
							codImpuestoDocSustento: imp.codigo,
							codigoPorcentaje: imp.codigoPorcentaje,
							baseImponible: Number(imp.baseImponible).toFixed(2),
							tarifa: Number(imp.tarifa).toFixed(2),
							valorImpuesto: Number(imp.valorImpuesto).toFixed(2),
						})),
					},
					retenciones: {
						retencion: doc.retenciones.map((r) => ({
							codigo: r.codigoImpuesto,
							codigoRetencion: r.codigoRetencion,
							baseImponible: Number(r.baseImponible).toFixed(2),
							porcentajeRetener: Number(r.porcentaje).toFixed(2),
							valorRetenido: Number(r.valorRetenido).toFixed(2),
						})),
					},
					pagos: {
						pago: doc.pagos.map((p) => ({
							formaPago: p.formaPago,
							total: Number(p.total).toFixed(2),
						})),
					},
				})),
			},
		},
	};

	// Info adicional (opcional)
	if (ret.infoAdicional && ret.infoAdicional.length > 0) {
		xmlObj.comprobanteRetencion.infoAdicional = {
			campoAdicional: ret.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Construye el XML de una Guía de Remisión electrónica v1.0.0
 * Ficha Técnica SRI — Anexo 6 (Guía de Remisión)
 * @param {Object} gr - Datos completos de la guía de remisión
 * @returns {string} XML generado
 */
export function buildGuiaRemisionXML(gr) {
	const xmlObj = {
		guiaRemision: {
			'@_id': 'comprobante',
			'@_version': '1.0.0',
			infoTributaria: buildInfoTributariaGenerica(gr),
			infoGuiaRemision: {
				...(gr.establecimiento.direccion && { dirEstablecimiento: gr.establecimiento.direccion }),
				dirPartida: gr.dirPartida,
				razonSocialTransportista: gr.transportista.razonSocial,
				tipoIdentificacionTransportista: gr.transportista.tipoIdentificacion,
				rucTransportista: gr.transportista.identificacion,
				...(gr.emisor.obligadoContabilidad !== undefined && {
					obligadoContabilidad: gr.emisor.obligadoContabilidad ? 'SI' : 'NO',
				}),
				...(gr.emisor.contribuyenteEspecial && { contribuyenteEspecial: gr.emisor.contribuyenteEspecial }),
				fechaIniTransporte: formatDateSRI(gr.fechaIniTransporte),
				fechaFinTransporte: formatDateSRI(gr.fechaFinTransporte),
				placa: gr.placa,
			},
			destinatarios: {
				destinatario: gr.destinatarios.map((dest) => ({
					identificacionDestinatario: dest.identificacion,
					razonSocialDestinatario: dest.razonSocial,
					dirDestinatario: dest.direccion,
					motivoTraslado: dest.motivoTraslado,
					...(dest.docAduaneroUnico && { docAduaneroUnico: dest.docAduaneroUnico }),
					...(dest.codEstabDestino && { codEstabDestino: dest.codEstabDestino }),
					...(dest.ruta && { ruta: dest.ruta }),
					...(dest.codDocSustento && { codDocSustento: dest.codDocSustento }),
					...(dest.numDocSustento && { numDocSustento: dest.numDocSustento }),
					...(dest.numAutDocSustento && { numAutDocSustento: dest.numAutDocSustento }),
					...(dest.fechaEmisionDocSustento && {
						fechaEmisionDocSustento: formatDateSRI(dest.fechaEmisionDocSustento),
					}),
					detalles: {
						detalle: dest.items.map((item) => ({
							...(item.codigoInterno && { codigoInterno: item.codigoInterno }),
							...(item.codigoAdicional && { codigoAdicional: item.codigoAdicional }),
							descripcion: item.descripcion,
							cantidad: Number(item.cantidad).toFixed(6),
						})),
					},
				})),
			},
		},
	};

	// Info adicional (opcional)
	if (gr.infoAdicional && gr.infoAdicional.length > 0) {
		xmlObj.guiaRemision.infoAdicional = {
			campoAdicional: gr.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}

/**
 * Construye el XML de una Liquidación de Compra electrónica v1.1.0
 * Ficha Técnica SRI — Anexo 17 (Liquidación de Compra)
 * NOTA: codDoc = '03' según Ficha Técnica SRI v2.32
 * @param {Object} lc - Datos completos de la liquidación de compra
 * @returns {string} XML generado
 */
export function buildLiquidacionCompraXML(lc) {
	const xmlObj = {
		liquidacionCompra: {
			'@_id': 'comprobante',
			'@_version': '1.1.0',
			infoTributaria: buildInfoTributariaGenerica(lc),
			infoLiquidacionCompra: {
				fechaEmision: formatDateSRI(lc.fechaEmision),
				...(lc.establecimiento.direccion && { dirEstablecimiento: lc.establecimiento.direccion }),
				...(lc.emisor.contribuyenteEspecial && { contribuyenteEspecial: lc.emisor.contribuyenteEspecial }),
				obligadoContabilidad: lc.emisor.obligadoContabilidad ? 'SI' : 'NO',
				tipoIdentificacionProveedor: lc.proveedor.tipoIdentificacion,
				razonSocialProveedor: lc.proveedor.razonSocial,
				identificacionProveedor: lc.proveedor.identificacion,
				...(lc.proveedor.direccion && { direccionProveedor: lc.proveedor.direccion }),
				totalSinImpuestos: Number(lc.totales.totalSinImpuestos).toFixed(2),
				totalDescuento: Number(lc.totales.totalDescuento || 0).toFixed(2),
				totalConImpuestos: {
					totalImpuesto: lc.totales.impuestos.map((imp) => ({
						codigo: imp.codigo,
						codigoPorcentaje: imp.codigoPorcentaje,
						baseImponible: Number(imp.baseImponible).toFixed(2),
						valor: Number(imp.valor).toFixed(2),
					})),
				},
				importeTotal: Number(lc.totales.importeTotal).toFixed(2),
				moneda: lc.moneda || 'DOLAR',
				pagos: {
					pago: lc.pagos.map((pago) => ({
						formaPago: pago.formaPago,
						total: Number(pago.total).toFixed(2),
						...(pago.plazo && { plazo: pago.plazo }),
						...(pago.unidadTiempo && { unidadTiempo: pago.unidadTiempo }),
					})),
				},
			},
			detalles: {
				detalle: lc.detalles.map((d) => ({
					codigoPrincipal: d.codigoPrincipal,
					...(d.codigoAuxiliar && { codigoAuxiliar: d.codigoAuxiliar }),
					descripcion: d.descripcion,
					cantidad: Number(d.cantidad).toFixed(6),
					precioUnitario: Number(d.precioUnitario).toFixed(6),
					descuento: Number(d.descuento || 0).toFixed(2),
					precioTotalSinImpuesto: Number(d.precioTotalSinImpuesto).toFixed(2),
					impuestos: {
						impuesto: d.impuestos.map((imp) => ({
							codigo: imp.codigo,
							codigoPorcentaje: imp.codigoPorcentaje,
							tarifa: Number(imp.tarifa).toFixed(2),
							baseImponible: Number(imp.baseImponible).toFixed(2),
							valor: Number(imp.valor).toFixed(2),
						})),
					},
				})),
			},
		},
	};

	// Info adicional (opcional)
	if (lc.infoAdicional && lc.infoAdicional.length > 0) {
		xmlObj.liquidacionCompra.infoAdicional = {
			campoAdicional: lc.infoAdicional.map((campo) => ({
				'@_nombre': campo.nombre,
				'#text': campo.valor,
			})),
		};
	}

	const xmlContent = xmlBuilder.build(xmlObj);
	return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
}
