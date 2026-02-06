/**
 * Orquestador del flujo completo de facturación electrónica
 * BORRADOR → FIRMADO → ENVIADO → AUTORIZADO
 * 
 * Coordina: clave acceso, XML builder, firma, SOAP, logging
 */
import { generarClaveAcceso } from './clave-acceso';
import {
	buildFacturaXML,
	buildNotaCreditoXML,
	buildNotaDebitoXML,
	buildRetencionXML,
	buildGuiaRemisionXML,
	buildLiquidacionCompraXML,
} from './xml-builder';
import { firmarXML } from './xml-signer';
import { enviarComprobante, consultarAutorizacion, getWSUrl } from './soap-client';
import { validarFactura, calcularTotalesImpuestos } from './validators';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto/aes';

/**
 * Mapa de builders de XML por tipo de comprobante
 */
const XML_BUILDERS = {
	'01': buildFacturaXML,
	'03': buildLiquidacionCompraXML,
	'04': buildNotaCreditoXML,
	'05': buildNotaDebitoXML,
	'06': buildGuiaRemisionXML,
	'07': buildRetencionXML,
};

/**
 * Nombres de los tipos de comprobante para mensajes
 */
const NOMBRES_COMPROBANTE = {
	'01': 'Factura',
	'03': 'Liquidación de Compra',
	'04': 'Nota de Crédito',
	'05': 'Nota de Débito',
	'06': 'Guía de Remisión',
	'07': 'Comprobante de Retención',
};

/**
 * Obtiene el builder de XML según el tipo de comprobante
 * @param {string} tipoComprobante - Código del tipo de comprobante
 * @returns {Function} Función builder de XML
 */
function getXMLBuilder(tipoComprobante) {
	const builder = XML_BUILDERS[tipoComprobante];
	if (!builder) {
		throw new Error(`Tipo de comprobante no soportado: ${tipoComprobante}. Tipos válidos: ${Object.keys(XML_BUILDERS).join(', ')}`);
	}
	return builder;
}

const MAX_REINTENTOS_AUTORIZACION = 10;
const DELAY_REINTENTO_MS = 5000;

/**
 * Procesa un comprobante completo: Firma → Envío → Autorización
 * @param {string} comprobanteId - UUID del comprobante
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function procesarComprobante(comprobanteId) {
	const supabase = await createClient();

	// 1. Obtener comprobante con todos sus datos
	const comprobante = await obtenerComprobanteCompleto(supabase, comprobanteId);
	if (!comprobante) throw new Error('Comprobante no encontrado');
	if (comprobante.estado !== 'draft') {
		throw new Error(`Estado inválido para procesar: ${comprobante.estado}. Debe ser "draft".`);
	}

	try {
		// 2. Preparar datos para XML
		const datosXML = prepararDatosXML(comprobante);

		// 3. Validar datos antes de generar XML
		const validacion = validarFactura(datosXML);
		if (!validacion.valid) {
			return { estado: 'ERROR_VALIDACION', errores: validacion.errores };
		}

		// 4. Generar clave de acceso
		const claveAcceso = generarClaveAcceso({
			fechaEmision: comprobante.fecha_emision,
			tipoComprobante: comprobante.tipo_comprobante,
			ruc: comprobante.empresa.ruc,
			ambiente: String(comprobante.ambiente),
			establecimiento: comprobante.establecimiento.codigo,
			puntoEmision: comprobante.punto_emision.codigo,
			secuencial: comprobante.secuencial,
		});

		// Asignar clave al objeto para XML
		datosXML.claveAcceso = claveAcceso;

		// 5. Construir XML usando el builder correspondiente al tipo
		const xmlBuilder = getXMLBuilder(comprobante.tipo_comprobante);
		const xmlSinFirma = xmlBuilder(datosXML);

		// 6. Obtener certificado y firmar
		const { p12Buffer, p12Password } = await obtenerCertificado(supabase, comprobante.empresa_id);
		const xmlFirmado = firmarXML(xmlSinFirma, p12Buffer, p12Password);

		// Actualizar estado: FIRMADO
		await actualizarComprobante(supabase, comprobanteId, {
			clave_acceso: claveAcceso,
			xml_sin_firma: xmlSinFirma,
			xml_firmado: xmlFirmado,
			estado: 'signed',
		});

		// 7. Enviar al SRI
		const ambiente = String(comprobante.ambiente);
		const respuestaRecepcion = await enviarComprobante(xmlFirmado, ambiente);

		// Registrar en log
		await registrarLogSRI(supabase, {
			empresa_id: comprobante.empresa_id,
			comprobante_id: comprobanteId,
			tipo_operacion: 'RECEPCION',
			url_servicio: getWSUrl(ambiente, 'recepcion'),
			request_xml: xmlFirmado.substring(0, 1000),
			estado_respuesta: respuestaRecepcion.estado,
			mensajes_error: respuestaRecepcion.mensajes,
			duracion_ms: respuestaRecepcion.tiempoMs,
		});

		if (respuestaRecepcion.estado === 'DEVUELTA') {
			// Código 70: "CLAVE DE ACCESO EN PROCESAMIENTO" — el SRI ya tiene el comprobante
			// En este caso, no es un rechazo real, debemos consultar autorización
			const esEnProcesamiento = respuestaRecepcion.mensajes?.some(
				(m) => m.codigo === '70' || m.mensaje?.includes('EN PROCESAMIENTO')
			);

			if (!esEnProcesamiento) {
				await actualizarComprobante(supabase, comprobanteId, { estado: 'DEV' });
				return { estado: 'DEV', mensajes: respuestaRecepcion.mensajes, claveAcceso };
			}
			// Si está en procesamiento, continuar con la consulta de autorización
		}

		// Actualizar estado: ENVIADO
		await actualizarComprobante(supabase, comprobanteId, { estado: 'sent' });

		// 8. Consultar autorización (con reintentos)
		let autorizacion = null;
		for (let i = 0; i < MAX_REINTENTOS_AUTORIZACION; i++) {
			await delay(DELAY_REINTENTO_MS);

			autorizacion = await consultarAutorizacion(claveAcceso, ambiente);

			await registrarLogSRI(supabase, {
				empresa_id: comprobante.empresa_id,
				comprobante_id: comprobanteId,
				tipo_operacion: 'AUTORIZACION',
				url_servicio: getWSUrl(ambiente, 'autorizacion'),
				estado_respuesta: autorizacion.estado,
				mensajes_error: autorizacion.mensajes,
				duracion_ms: autorizacion.tiempoMs,
			});

			if (autorizacion.estado === 'AUTORIZADO' || autorizacion.estado === 'NO AUTORIZADO') {
				break;
			}
		}

		// 9. Actualizar estado final
		if (autorizacion?.estado === 'AUTORIZADO') {
			await actualizarComprobante(supabase, comprobanteId, {
				estado: 'AUT',
				numero_autorizacion: autorizacion.numeroAutorizacion,
				fecha_autorizacion: autorizacion.fechaAutorizacion,
				xml_autorizado: autorizacion.xmlAutorizado,
			});
			return { estado: 'AUT', claveAcceso, autorizacion };
		} else if (autorizacion?.estado === 'NO AUTORIZADO') {
			await actualizarComprobante(supabase, comprobanteId, { estado: 'NAT' });
			return { estado: 'NAT', mensajes: autorizacion.mensajes, claveAcceso };
		} else {
			// EN PROCESAMIENTO — polling continuará por separado
			await actualizarComprobante(supabase, comprobanteId, { estado: 'PPR' });
			return { estado: 'PPR', claveAcceso };
		}
	} catch (error) {
		console.error('Error procesando comprobante:', error);
		throw error;
	}
}

// =========================================
// Funciones auxiliares
// =========================================

async function obtenerComprobanteCompleto(supabase, id) {
	const { data, error } = await supabase
		.from('comprobantes')
		.select(`
			*,
			empresa:empresas(*),
			establecimiento:establecimientos(*),
			punto_emision:puntos_emision(*),
			cliente:clientes(*),
			detalles:comprobante_detalles(
				*,
				impuestos:comprobante_impuestos(*)
			),
			pagos:comprobante_pagos(*),
			retencion_detalles(*),
			destinatarios:guia_remision_destinatarios(
				*,
				detalles:guia_remision_detalles(*)
			)
		`)
		.eq('id', id)
		.single();

	if (error) throw new Error(`Error obteniendo comprobante: ${error.message}`);
	return data;
}

async function actualizarComprobante(supabase, id, datos) {
	const { error } = await supabase.from('comprobantes').update(datos).eq('id', id);
	if (error) throw new Error(`Error actualizando comprobante: ${error.message}`);
}

async function registrarLogSRI(supabase, log) {
	await supabase.from('sri_log').insert(log);
}

async function obtenerCertificado(supabase, empresaId) {
	// Obtener certificado activo de la empresa
	const { data: cert, error } = await supabase
		.from('certificados')
		.select('storage_path, password_encrypted')
		.eq('empresa_id', empresaId)
		.eq('activo', true)
		.single();

	if (error || !cert) {
		throw new Error('No se encontró certificado digital activo para la empresa');
	}

	// Usar admin client (service_role) para descargar el certificado,
	// así evitamos problemas de RLS en Storage.
	// Si no hay service_role key, fallback al client regular (depende de RLS).
	let storageClient = supabase;
	try {
		storageClient = createAdminClient();
	} catch {
		// Si no hay service_role key configurada, usar el client regular
		console.warn('SUPABASE_SERVICE_ROLE_KEY no configurada. Usando client regular para descargar certificado.');
	}

	// Descargar .p12 de Storage
	const { data: fileData, error: downloadError } = await storageClient.storage
		.from('certificados')
		.download(cert.storage_path);

	if (downloadError || !fileData) {
		throw new Error('Error descargando certificado: ' + (downloadError?.message || 'archivo no encontrado'));
	}

	const p12Buffer = Buffer.from(await fileData.arrayBuffer());

	// Descifrar password AES-256
	const p12Password = decrypt(cert.password_encrypted);

	return { p12Buffer, p12Password };
}

function prepararDatosXML(comp) {
	const tipoComprobante = comp.tipo_comprobante;
	
	// Datos base comunes a todos los comprobantes
	const datosBase = {
		ambiente: String(comp.ambiente),
		tipoEmision: String(comp.tipo_emision || 1),
		tipoComprobante: tipoComprobante,
		claveAcceso: '', // Se asigna después
		secuencial: comp.secuencial,
		fechaEmision: comp.fecha_emision,
		moneda: comp.moneda || 'DOLAR',
		emisor: {
			ruc: comp.empresa.ruc,
			razonSocial: comp.empresa.razon_social,
			nombreComercial: comp.empresa.nombre_comercial,
			direccion: comp.empresa.direccion_matriz,
			obligadoContabilidad: comp.empresa.obligado_contabilidad,
			contribuyenteEspecial: comp.empresa.contribuyente_especial,
		contribuyenteRimpe: comp.empresa.regimen_fiscal?.startsWith('RIMPE')
			? 'CONTRIBUYENTE RÉGIMEN RIMPE'
			: null,
			agenteRetencion: comp.empresa.agente_retencion,
		},
		establecimiento: {
			codigo: comp.establecimiento.codigo,
			direccion: comp.establecimiento.direccion,
		},
		puntoEmision: {
			codigo: comp.punto_emision.codigo,
		},
		infoAdicional: Array.isArray(comp.info_adicional) ? comp.info_adicional : [],
	};

	// Preparar según tipo de comprobante
	switch (tipoComprobante) {
		case '01': // Factura
		case '03': // Liquidación de Compra
			return prepararDatosFacturaOLC(comp, datosBase);
		case '04': // Nota de Crédito
			return prepararDatosNotaCredito(comp, datosBase);
		case '05': // Nota de Débito
			return prepararDatosNotaDebito(comp, datosBase);
		case '06': // Guía de Remisión
			return prepararDatosGuiaRemision(comp, datosBase);
		case '07': // Retención
			return prepararDatosRetencion(comp, datosBase);
		default:
			throw new Error(`Tipo de comprobante no soportado: ${tipoComprobante}`);
	}
}

/**
 * Prepara datos para Factura (01) o Liquidación de Compra (03)
 */
function prepararDatosFacturaOLC(comp, datosBase) {
	const detallesConImpuestos = comp.detalles.map((d) => ({
		codigoPrincipal: d.codigo_principal,
		codigoAuxiliar: null,
		descripcion: d.descripcion,
		cantidad: Number(d.cantidad),
		precioUnitario: Number(d.precio_unitario),
		descuento: Number(d.descuento || 0),
		precioTotalSinImpuesto: Number(d.precio_total_sin_impuesto),
		detallesAdicionales: d.detalles_adicionales || [],
		impuestos: (d.impuestos || []).map((i) => ({
			codigo: i.codigo,
			codigoPorcentaje: i.codigo_porcentaje,
			tarifa: Number(i.tarifa),
			baseImponible: Number(i.base_imponible),
			valor: Number(i.valor),
		})),
	}));

	const datos = {
		...datosBase,
		detalles: detallesConImpuestos,
		totales: {
			totalSinImpuestos: Number(comp.subtotal_sin_impuestos),
			totalDescuento: Number(comp.total_descuento),
			propina: Number(comp.propina || 0),
			importeTotal: Number(comp.importe_total),
			impuestos: calcularTotalesImpuestos(detallesConImpuestos),
		},
		pagos: (comp.pagos || []).map((p) => ({
			formaPago: p.forma_pago,
			total: Number(p.total),
			plazo: p.plazo,
			unidadTiempo: p.unidad_tiempo,
		})),
	};

	// Factura usa comprador
	if (comp.tipo_comprobante === '01') {
		datos.comprador = {
			tipoIdentificacion: comp.tipo_identificacion_comprador,
			identificacion: comp.identificacion_comprador,
			razonSocial: comp.razon_social_comprador,
			direccion: comp.direccion_comprador,
		};
	}
	// Liquidación de Compra usa proveedor
	else if (comp.tipo_comprobante === '03') {
		datos.proveedor = {
			tipoIdentificacion: comp.tipo_identificacion_proveedor,
			identificacion: comp.identificacion_proveedor,
			razonSocial: comp.razon_social_proveedor,
			direccion: comp.direccion_proveedor,
		};
	}

	return datos;
}

/**
 * Prepara datos para Nota de Crédito (04)
 */
function prepararDatosNotaCredito(comp, datosBase) {
	const detallesConImpuestos = comp.detalles.map((d) => ({
		codigoPrincipal: d.codigo_principal,
		codigoAdicional: null,
		descripcion: d.descripcion,
		cantidad: Number(d.cantidad),
		precioUnitario: Number(d.precio_unitario),
		descuento: Number(d.descuento || 0),
		precioTotalSinImpuesto: Number(d.precio_total_sin_impuesto),
		impuestos: (d.impuestos || []).map((i) => ({
			codigo: i.codigo,
			codigoPorcentaje: i.codigo_porcentaje,
			tarifa: Number(i.tarifa),
			baseImponible: Number(i.base_imponible),
			valor: Number(i.valor),
		})),
	}));

	return {
		...datosBase,
		comprador: {
			tipoIdentificacion: comp.tipo_identificacion_comprador,
			identificacion: comp.identificacion_comprador,
			razonSocial: comp.razon_social_comprador,
			direccion: comp.direccion_comprador,
		},
		docSustento: {
			tipo: comp.doc_sustento_tipo,
			numero: comp.doc_sustento_numero,
			fecha: comp.doc_sustento_fecha,
		},
		motivo: comp.motivo_modificacion,
		detalles: detallesConImpuestos,
		totales: {
			totalSinImpuestos: Number(comp.subtotal_sin_impuestos),
			valorModificacion: Number(comp.importe_total),
			impuestos: calcularTotalesImpuestos(detallesConImpuestos),
		},
	};
}

/**
 * Prepara datos para Nota de Débito (05)
 */
function prepararDatosNotaDebito(comp, datosBase) {
	// Los motivos de la ND vienen de los detalles
	const motivos = comp.detalles.map((d) => ({
		razon: d.descripcion,
		valor: Number(d.precio_total_sin_impuesto),
	}));

	// Calcular impuestos desde los detalles
	const impuestos = [];
	for (const d of comp.detalles) {
		for (const i of (d.impuestos || [])) {
			const key = `${i.codigo}-${i.codigo_porcentaje}`;
			const existing = impuestos.find((imp) => `${imp.codigo}-${imp.codigoPorcentaje}` === key);
			if (existing) {
				existing.baseImponible += Number(i.base_imponible);
				existing.valor += Number(i.valor);
			} else {
				impuestos.push({
					codigo: i.codigo,
					codigoPorcentaje: i.codigo_porcentaje,
					tarifa: Number(i.tarifa),
					baseImponible: Number(i.base_imponible),
					valor: Number(i.valor),
				});
			}
		}
	}

	return {
		...datosBase,
		comprador: {
			tipoIdentificacion: comp.tipo_identificacion_comprador,
			identificacion: comp.identificacion_comprador,
			razonSocial: comp.razon_social_comprador,
			direccion: comp.direccion_comprador,
		},
		docSustento: {
			tipo: comp.doc_sustento_tipo,
			numero: comp.doc_sustento_numero,
			fecha: comp.doc_sustento_fecha,
		},
		motivos: motivos,
		totales: {
			totalSinImpuestos: Number(comp.subtotal_sin_impuestos),
			valorTotal: Number(comp.importe_total),
			impuestos: impuestos,
		},
		pagos: (comp.pagos || []).map((p) => ({
			formaPago: p.forma_pago,
			total: Number(p.total),
			plazo: p.plazo,
			unidadTiempo: p.unidad_tiempo,
		})),
	};
}

/**
 * Prepara datos para Guía de Remisión (06)
 */
function prepararDatosGuiaRemision(comp, datosBase) {
	// Los destinatarios vienen de la tabla guia_remision_destinatarios
	const destinatarios = (comp.destinatarios || []).map((dest) => ({
		identificacion: dest.identificacion_destinatario,
		razonSocial: dest.razon_social_destinatario,
		direccion: dest.direccion_destinatario,
		motivoTraslado: dest.motivo_traslado,
		ruta: dest.ruta,
		codDocSustento: dest.cod_doc_sustento,
		numDocSustento: dest.num_doc_sustento,
		numAutDocSustento: dest.num_autorizacion_doc_sustento,
		fechaEmisionDocSustento: dest.fecha_emision_doc_sustento,
		codEstabDestino: dest.cod_estab_destino,
		items: (dest.detalles || []).map((item) => ({
			codigoInterno: item.codigo_interno,
			codigoAdicional: item.codigo_adicional,
			descripcion: item.descripcion,
			cantidad: Number(item.cantidad),
		})),
	}));

	return {
		...datosBase,
		dirPartida: comp.dir_partida,
		fechaIniTransporte: comp.fecha_inicio_transporte,
		fechaFinTransporte: comp.fecha_fin_transporte,
		placa: comp.placa,
		transportista: {
			tipoIdentificacion: comp.tipo_identificacion_transportista,
			identificacion: comp.ruc_transportista,
			razonSocial: comp.razon_social_transportista,
		},
		destinatarios: destinatarios,
	};
}

/**
 * Prepara datos para Comprobante de Retención (07)
 */
function prepararDatosRetencion(comp, datosBase) {
	// Los documentos sustento vienen de la tabla retencion_detalles agrupados
	const docsMap = new Map();
	
	for (const det of (comp.retencion_detalles || [])) {
		const key = `${det.cod_doc_sustento}-${det.num_doc_sustento}`;
		
		if (!docsMap.has(key)) {
			docsMap.set(key, {
				codSustento: det.cod_sustento,
				codDocSustento: det.cod_doc_sustento,
				numDocSustento: det.num_doc_sustento,
				fechaEmision: det.fecha_emision_doc_sustento,
				fechaRegistro: det.fecha_registro_contable,
				numAutorizacion: det.num_aut_doc_sustento,
				pagoLocExt: det.pago_loc_ext || '01',
				totalSinImpuestos: Number(det.total_sin_impuestos || 0),
				importeTotal: Number(det.importe_total || 0),
				impuestos: [],
				retenciones: [],
				pagos: [],
			});
		}
		
		const doc = docsMap.get(key);
		
		// Agregar retención
		doc.retenciones.push({
			codigoImpuesto: det.codigo_impuesto,
			codigoRetencion: det.codigo_retencion,
			baseImponible: Number(det.base_imponible),
			porcentaje: Number(det.porcentaje_retener),
			valorRetenido: Number(det.valor_retenido),
		});
		
		// Agregar pago si existe
		if (det.forma_pago) {
			const existingPago = doc.pagos.find((p) => p.formaPago === det.forma_pago);
			if (!existingPago) {
				doc.pagos.push({
					formaPago: det.forma_pago,
					total: Number(det.base_imponible),
				});
			}
		}
	}

	// Agregar impuestos del documento (IVA calculado)
	for (const doc of docsMap.values()) {
		// Impuesto IVA del documento
		const baseIVA = doc.retenciones
			.filter((r) => r.codigoImpuesto === '2')
			.reduce((sum, r) => sum + r.baseImponible, 0);
		
		if (baseIVA > 0) {
			doc.impuestos.push({
				codigo: '2',
				codigoPorcentaje: '2',
				baseImponible: baseIVA,
				tarifa: 15,
				valorImpuesto: baseIVA * 0.15,
			});
		}
	}

	return {
		...datosBase,
		periodoFiscal: comp.periodo_fiscal,
		tipoSujetoRetenido: comp.tipo_sujeto_retenido,
		parteRelacionada: 'NO',
		sujetoRetenido: {
			tipoIdentificacion: comp.tipo_identificacion_comprador,
			identificacion: comp.identificacion_comprador,
			razonSocial: comp.razon_social_comprador,
		},
		documentosSustento: Array.from(docsMap.values()),
	};
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
