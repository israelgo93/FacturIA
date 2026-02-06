/**
 * Cliente SOAP para Web Services del SRI
 * WS Recepción: Envío de comprobantes firmados
 * WS Autorización: Consulta de autorización por clave de acceso
 */
import soap from 'soap';

// URLs Web Services SRI (desde variables de entorno)
const WS_URLS = {
	pruebas: {
		recepcion: process.env.SRI_WS_RECEPCION_PRUEBAS,
		autorizacion: process.env.SRI_WS_AUTORIZACION_PRUEBAS,
	},
	produccion: {
		recepcion: process.env.SRI_WS_RECEPCION_PROD,
		autorizacion: process.env.SRI_WS_AUTORIZACION_PROD,
	},
};

/**
 * Envía un comprobante firmado al WS de Recepción del SRI
 * @param {string} xmlFirmado - XML firmado con XAdES-BES
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Promise<Object>} { estado, comprobantes, mensajes, tiempoMs }
 */
export async function enviarComprobante(xmlFirmado, ambiente = '1') {
	const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
	const startTime = Date.now();

	try {
		const client = await soap.createClientAsync(urls.recepcion);

		// Convertir XML a Base64 para el WS
		const xmlBase64 = Buffer.from(xmlFirmado, 'utf-8').toString('base64');

		const [result] = await client.validarComprobanteAsync({
			xml: xmlBase64,
		});

		const tiempoMs = Date.now() - startTime;

		return {
			estado: result?.RespuestaRecepcionComprobante?.estado || 'ERROR',
			comprobantes: result?.RespuestaRecepcionComprobante?.comprobantes?.comprobante || [],
			mensajes: extraerMensajesRecepcion(result),
			tiempoMs,
		};
	} catch (error) {
		return {
			estado: 'ERROR_CONEXION',
			comprobantes: [],
			mensajes: [{ tipo: 'ERROR', mensaje: error.message }],
			tiempoMs: Date.now() - startTime,
		};
	}
}

/**
 * Consulta la autorización de un comprobante por clave de acceso
 * @param {string} claveAcceso - Clave de acceso de 49 dígitos
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Promise<Object>} { estado, numeroAutorizacion, fechaAutorizacion, xmlAutorizado, mensajes, tiempoMs }
 */
export async function consultarAutorizacion(claveAcceso, ambiente = '1') {
	const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
	const startTime = Date.now();

	try {
		const client = await soap.createClientAsync(urls.autorizacion);

		const [result] = await client.autorizacionComprobanteAsync({
			claveAccesoComprobante: claveAcceso,
		});

		const tiempoMs = Date.now() - startTime;

		// Debug: log de la respuesta completa del SRI
		console.log('[SRI-AUTH] Respuesta completa:', JSON.stringify(result, null, 2));

		const respuesta = result?.RespuestaAutorizacionComprobante;
		const numComprobantes = respuesta?.numeroComprobantes;
		const autorizaciones = respuesta?.autorizaciones;

		console.log('[SRI-AUTH] numeroComprobantes:', numComprobantes);
		console.log('[SRI-AUTH] autorizaciones keys:', autorizaciones ? Object.keys(autorizaciones) : 'null');

		// Intentar obtener la autorizacion de multiples formas
		let autorizacion = autorizaciones?.autorizacion?.[0]
			|| autorizaciones?.autorizacion
			|| null;

		if (!autorizacion || (numComprobantes === '0')) {
			return {
				estado: 'SIN_RESPUESTA',
				mensajes: [{ tipo: 'INFO', mensaje: `Comprobante aun en procesamiento. numeroComprobantes: ${numComprobantes}` }],
				tiempoMs,
			};
		}

		return {
			estado: autorizacion.estado, // AUTORIZADO, NO AUTORIZADO, EN PROCESAMIENTO
			numeroAutorizacion: autorizacion.numeroAutorizacion,
			fechaAutorizacion: autorizacion.fechaAutorizacion,
			xmlAutorizado: autorizacion.comprobante,
			mensajes: autorizacion.mensajes?.mensaje
				? (Array.isArray(autorizacion.mensajes.mensaje)
					? autorizacion.mensajes.mensaje
					: [autorizacion.mensajes.mensaje])
				: [],
			tiempoMs,
		};
	} catch (error) {
		console.error('[SRI-AUTH] Error consultando autorizacion:', error.message);
		return {
			estado: 'ERROR_CONEXION',
			mensajes: [{ tipo: 'ERROR', mensaje: error.message }],
			tiempoMs: Date.now() - startTime,
		};
	}
}

/**
 * Obtiene la URL del WS según ambiente y tipo
 * @param {string} ambiente - '1' o '2'
 * @param {'recepcion'|'autorizacion'} tipo
 * @returns {string}
 */
export function getWSUrl(ambiente, tipo) {
	const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
	return urls[tipo];
}

/**
 * Extrae mensajes de la respuesta de recepción
 */
function extraerMensajesRecepcion(result) {
	const comprobantes = result?.RespuestaRecepcionComprobante?.comprobantes?.comprobante;
	if (!comprobantes) return [];

	const msgs = [];
	const comps = Array.isArray(comprobantes) ? comprobantes : [comprobantes];

	for (const comp of comps) {
		const mensajes = comp?.mensajes?.mensaje;
		if (mensajes) {
			const msgArr = Array.isArray(mensajes) ? mensajes : [mensajes];
			msgs.push(
				...msgArr.map((m) => ({
					tipo: m.tipo,
					codigo: m.identificador,
					mensaje: m.mensaje,
					informacionAdicional: m.informacionAdicional,
				}))
			);
		}
	}

	return msgs;
}
