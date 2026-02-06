/**
 * Generador de RIDE (Representación Impresa de Documento Electrónico)
 * Genera un PDF conforme al formato del SRI usando @react-pdf/renderer
 * 
 * Este módulo es server-side: genera el PDF como Buffer para
 * descarga o envío por email.
 * 
 * Soporta todos los tipos de comprobantes electrónicos:
 * - 01: Factura
 * - 03: Liquidación de Compra
 * - 04: Nota de Crédito
 * - 05: Nota de Débito
 * - 06: Guía de Remisión
 * - 07: Comprobante de Retención
 */
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';

/**
 * Mapeo de tipo de comprobante a template RIDE
 */
const RIDE_TEMPLATES = {
	'01': '@/components/pdf/RIDETemplate',           // Factura
	'03': '@/components/pdf/RIDELiquidacionCompra',  // Liquidación de Compra
	'04': '@/components/pdf/RIDENotaCredito',        // Nota de Crédito
	'05': '@/components/pdf/RIDENotaDebito',         // Nota de Débito
	'06': '@/components/pdf/RIDEGuiaRemision',       // Guía de Remisión
	'07': '@/components/pdf/RIDERetencion',          // Comprobante de Retención
};

/**
 * Obtiene el template RIDE correcto según el tipo de comprobante
 * @param {string} tipoComprobante - Código del tipo de comprobante (01, 03, 04, 05, 06, 07)
 * @returns {Promise<React.Component>} Componente del template RIDE
 */
async function getRIDETemplate(tipoComprobante) {
	switch (tipoComprobante) {
		case '01':
			return (await import('@/components/pdf/RIDETemplate')).default;
		case '03':
			return (await import('@/components/pdf/RIDELiquidacionCompra')).default;
		case '04':
			return (await import('@/components/pdf/RIDENotaCredito')).default;
		case '05':
			return (await import('@/components/pdf/RIDENotaDebito')).default;
		case '06':
			return (await import('@/components/pdf/RIDEGuiaRemision')).default;
		case '07':
			return (await import('@/components/pdf/RIDERetencion')).default;
		default:
			// Default a factura para compatibilidad
			return (await import('@/components/pdf/RIDETemplate')).default;
	}
}

/**
 * Genera el RIDE PDF de un comprobante como Buffer
 * @param {Object} comprobante - Datos completos del comprobante
 * @returns {Promise<Buffer>} PDF como Buffer
 */
export async function generarRIDEPDF(comprobante) {
	// Obtener el template correcto según el tipo de comprobante
	const tipoComprobante = comprobante.tipo_comprobante || '01';
	const RIDETemplate = await getRIDETemplate(tipoComprobante);

	const pdfBuffer = await renderToBuffer(
		createElement(RIDETemplate, { comprobante })
	);

	return Buffer.from(pdfBuffer);
}

/**
 * Obtiene el nombre del archivo RIDE según el tipo de comprobante
 * @param {Object} comprobante - Datos del comprobante
 * @returns {string} Nombre del archivo PDF
 */
export function getNombreArchivoRIDE(comprobante) {
	const tipoNombres = {
		'01': 'FAC',
		'03': 'LIQ',
		'04': 'NC',
		'05': 'ND',
		'06': 'GR',
		'07': 'RET',
	};
	const prefix = tipoNombres[comprobante.tipo_comprobante] || 'COMP';
	const numero = comprobante.numero_completo || comprobante.clave_acceso?.substring(0, 20) || 'SN';
	return `RIDE_${prefix}_${numero.replace(/-/g, '')}.pdf`;
}
