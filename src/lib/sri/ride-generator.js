/**
 * Generador de RIDE (Representación Impresa de Documento Electrónico)
 * Genera un PDF conforme al formato del SRI usando @react-pdf/renderer
 * 
 * Este módulo es server-side: genera el PDF como Buffer para
 * descarga o envío por email.
 */
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';

/**
 * Genera el RIDE PDF de un comprobante como Buffer
 * @param {Object} comprobante - Datos completos del comprobante
 * @returns {Promise<Buffer>} PDF como Buffer
 */
export async function generarRIDEPDF(comprobante) {
	// Importación dinámica del componente React-PDF (solo server-side)
	const { default: RIDETemplate } = await import('@/components/pdf/RIDETemplate');

	const pdfBuffer = await renderToBuffer(
		createElement(RIDETemplate, { comprobante })
	);

	return Buffer.from(pdfBuffer);
}
