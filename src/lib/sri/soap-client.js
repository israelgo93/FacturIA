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

// Timeout para operaciones SOAP (ms)
const SOAP_TIMEOUT_MS = parseInt(process.env.SRI_SOAP_TIMEOUT_MS || '30000', 10);

/**
 * Códigos de error estructurados para operaciones SRI
 */
export const SRI_ERROR_CODES = {
	TIMEOUT: 'SRI_TIMEOUT',
	CONEXION: 'SRI_CONEXION_ERROR',
	SOAP_FAULT: 'SRI_SOAP_FAULT',
	URL_INVALIDA: 'SRI_URL_INVALIDA',
	RESPUESTA_INVALIDA: 'SRI_RESPUESTA_INVALIDA',
};

/**
 * Clasifica un error de red/SOAP en un código estructurado
 * @param {Error} error
 * @returns {{ codigo: string, mensaje: string }}
 */
function clasificarError(error) {
	const msg = error.message || '';

	if (msg.includes('ETIMEDOUT') || msg.includes('ESOCKETTIMEDOUT') || msg.includes('timeout')) {
		return {
			codigo: SRI_ERROR_CODES.TIMEOUT,
			mensaje: `Timeout al comunicarse con el SRI (${SOAP_TIMEOUT_MS}ms). El servicio puede estar temporalmente no disponible.`,
		};
	}
	if (msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
		return {
			codigo: SRI_ERROR_CODES.CONEXION,
			mensaje: `No se pudo conectar con el servidor del SRI. Verifique su conexión a internet.`,
		};
	}
	if (msg.includes('ECONNRESET') || msg.includes('socket hang up')) {
		return {
			codigo: SRI_ERROR_CODES.CONEXION,
			mensaje: 'La conexión con el SRI fue interrumpida. Intente nuevamente.',
		};
	}
	if (error.root?.Envelope?.Body?.Fault || msg.includes('Fault')) {
		return {
			codigo: SRI_ERROR_CODES.SOAP_FAULT,
			mensaje: `Error SOAP del SRI: ${msg}`,
		};
	}

	return {
		codigo: SRI_ERROR_CODES.CONEXION,
		mensaje: `Error de comunicación con el SRI: ${msg}`,
	};
}

/**
 * Crea un cliente SOAP con timeout configurado
 * @param {string} url - URL del WSDL
 * @returns {Promise<Object>} Cliente SOAP
 */
async function crearClienteSOAP(url) {
	if (!url) {
		throw Object.assign(new Error('URL del servicio web del SRI no configurada'), {
			codigoSRI: SRI_ERROR_CODES.URL_INVALIDA,
		});
	}

	const client = await soap.createClientAsync(url, {
		wsdl_options: { timeout: SOAP_TIMEOUT_MS },
	});

	// Configurar timeout en las peticiones HTTP
	client.setEndpoint(client.endpoint);
	if (client.httpClient?.options) {
		client.httpClient.options.timeout = SOAP_TIMEOUT_MS;
	}

	return client;
}

/**
 * Envía un comprobante firmado al WS de Recepción del SRI
 * @param {string} xmlFirmado - XML firmado con XAdES-BES
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Promise<Object>} { estado, comprobantes, mensajes, tiempoMs, codigo? }
 */
export async function enviarComprobante(xmlFirmado, ambiente = '1') {
	const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
	const startTime = Date.now();

	try {
		const client = await crearClienteSOAP(urls.recepcion);

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
		const errorInfo = clasificarError(error);
		return {
			estado: 'ERROR_CONEXION',
			codigo: errorInfo.codigo,
			comprobantes: [],
			mensajes: [{ tipo: 'ERROR', codigo: errorInfo.codigo, mensaje: errorInfo.mensaje }],
			tiempoMs: Date.now() - startTime,
		};
	}
}

/**
 * Consulta la autorización de un comprobante por clave de acceso
 * @param {string} claveAcceso - Clave de acceso de 49 dígitos
 * @param {string} ambiente - '1'=Pruebas, '2'=Producción
 * @returns {Promise<Object>} { estado, numeroAutorizacion, fechaAutorizacion, xmlAutorizado, mensajes, tiempoMs, codigo? }
 */
export async function consultarAutorizacion(claveAcceso, ambiente = '1') {
	const urls = ambiente === '2' ? WS_URLS.produccion : WS_URLS.pruebas;
	const startTime = Date.now();

	try {
		const client = await crearClienteSOAP(urls.autorizacion);

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
				mensajes: [{ tipo: 'INFO', mensaje: `Comprobante aún en procesamiento. numeroComprobantes: ${numComprobantes}` }],
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
		const errorInfo = clasificarError(error);
		console.error(`[SRI-AUTH] ${errorInfo.codigo}: ${errorInfo.mensaje}`);
		return {
			estado: 'ERROR_CONEXION',
			codigo: errorInfo.codigo,
			mensajes: [{ tipo: 'ERROR', codigo: errorInfo.codigo, mensaje: errorInfo.mensaje }],
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
