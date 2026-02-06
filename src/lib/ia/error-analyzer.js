/**
 * Analiza errores del SRI usando Gemini 3 Flash
 * Traduce códigos técnicos a explicaciones en lenguaje natural
 * y sugiere acciones correctivas
 */
import { generateWithFallback } from './gemini-client';
import { ERROR_ANALYZER_PROMPT } from './factura-prompts';

/**
 * Analiza errores del SRI y genera explicaciones + soluciones
 * @param {Array} mensajes - Mensajes de error del SRI
 * @param {Object} contextoComprobante - Datos del comprobante
 * @returns {Promise<Object>} Análisis con explicaciones y soluciones
 */
export async function analizarErrorSRI(mensajes, contextoComprobante) {
	const prompt = `${ERROR_ANALYZER_PROMPT}

ERRORES DEL SRI:
${JSON.stringify(mensajes, null, 2)}

CONTEXTO DEL COMPROBANTE:
- Tipo: ${contextoComprobante.tipo || 'Factura'}
- RUC Emisor: ${contextoComprobante.ruc || 'N/A'}
- Fecha: ${contextoComprobante.fecha || 'N/A'}
- Estado: ${contextoComprobante.estado || 'N/A'}

Responde en JSON con el formato:
{
  "analisis": [
    {
      "codigo": "string",
      "explicacion": "string",
      "causa": "string",
      "solucion": "string",
      "severidad": "critico|medio|bajo"
    }
  ],
  "resumen": "string"
}`;

	try {
		const response = await generateWithFallback({
			contents: prompt,
			config: {
				responseMimeType: 'application/json',
				thinkingConfig: { thinkingLevel: 'medium' },
			},
		});

		return JSON.parse(response.text);
	} catch (error) {
		console.error('Error analizando con IA:', error);
		// Fallback sin IA: devolver los mensajes originales formateados
		return {
			analisis: mensajes.map((m) => ({
				codigo: m.codigo || m.identificador || 'N/A',
				explicacion: m.mensaje || 'Error desconocido',
				causa: m.informacionAdicional || 'No disponible',
				solucion: 'Revise los datos del comprobante y reintente',
				severidad: m.tipo === 'ERROR' ? 'critico' : 'medio',
			})),
			resumen: 'No se pudo analizar con IA. Revise los errores manualmente.',
		};
	}
}
