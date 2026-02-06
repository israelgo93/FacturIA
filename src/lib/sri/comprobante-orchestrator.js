/**
 * Orquestador del flujo completo de facturación electrónica
 * BORRADOR → FIRMADO → ENVIADO → AUTORIZADO
 * 
 * Coordina: clave acceso, XML builder, firma, SOAP, logging
 */
import { generarClaveAcceso } from './clave-acceso';
import { buildFacturaXML } from './xml-builder';
import { firmarXML } from './xml-signer';
import { enviarComprobante, consultarAutorizacion, getWSUrl } from './soap-client';
import { validarFactura, calcularTotalesImpuestos } from './validators';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto/aes';

const MAX_REINTENTOS_AUTORIZACION = 5;
const DELAY_REINTENTO_MS = 3000;

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

		// 5. Construir XML
		const xmlSinFirma = buildFacturaXML(datosXML);

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
			await actualizarComprobante(supabase, comprobanteId, { estado: 'DEV' });
			return { estado: 'DEV', mensajes: respuestaRecepcion.mensajes, claveAcceso };
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
			pagos:comprobante_pagos(*)
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

	// Descargar .p12 de Storage
	const { data: fileData, error: downloadError } = await supabase.storage
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

	return {
		ambiente: String(comp.ambiente),
		tipoEmision: String(comp.tipo_emision || 1),
		tipoComprobante: comp.tipo_comprobante,
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
			contribuyenteRimpe: comp.empresa.regimen_fiscal === 'RIMPE_EMPRENDEDOR'
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
		comprador: {
			tipoIdentificacion: comp.tipo_identificacion_comprador,
			identificacion: comp.identificacion_comprador,
			razonSocial: comp.razon_social_comprador,
			direccion: comp.direccion_comprador,
		},
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
		infoAdicional: Array.isArray(comp.info_adicional) ? comp.info_adicional : [],
	};
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
