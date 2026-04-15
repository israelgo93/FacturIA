/**
 * Generador de códigos de barras para comprobantes electrónicos SRI
 * Usa bwip-js para generar Code 128 como PNG buffer (server-side, sin DOM)
 */
import bwipjs from 'bwip-js';

/**
 * Genera un código de barras Code 128 como data URI PNG
 * para la clave de acceso de 49 dígitos del SRI
 * @param {string} claveAcceso - Clave de acceso de 49 dígitos
 * @returns {Promise<string|null>} Data URI base64 del PNG, o null si falla
 */
export async function generarCodigoBarras(claveAcceso) {
	if (!claveAcceso || claveAcceso.length !== 49) return null;

	try {
		const pngBuffer = await bwipjs.toBuffer({
			bcid: 'code128',
			text: claveAcceso,
			scale: 2,
			height: 10,
			includetext: false,
		});
		return `data:image/png;base64,${pngBuffer.toString('base64')}`;
	} catch (err) {
		console.error('[barcode] Error generando codigo de barras:', err.message);
		return null;
	}
}
