/**
 * Cliente Gemini actualizado para Fase 3
 * Modelo principal: gemini-3-flash-preview
 * Fallback: gemini-2.5-flash (estable, GA)
 * 
 * SDK: @google/genai (oficial unificado 2026)
 */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Modelo principal: Gemini 3 Flash (preview)
const PRIMARY_MODEL = 'gemini-3-flash-preview';
// Fallback: Gemini 2.5 Flash (estable, GA)
const FALLBACK_MODEL = 'gemini-2.5-flash';

/**
 * Genera contenido con fallback automático
 * @param {Object} options - Opciones para generateContent
 * @returns {Promise<Object>} Respuesta del modelo
 */
export async function generateWithFallback(options) {
	try {
		return await ai.models.generateContent({
			model: PRIMARY_MODEL,
			...options,
		});
	} catch (error) {
		console.warn(`Gemini 3 Flash falló, usando fallback: ${error.message}`);
		return await ai.models.generateContent({
			model: FALLBACK_MODEL,
			...options,
		});
	}
}

/**
 * Genera contenido estructurado (JSON) con schema
 * @param {string} prompt - Prompt para el modelo
 * @param {Object} schema - Schema JSON para la respuesta
 * @returns {Promise<Object>} Respuesta parseada como JSON
 */
export async function generateStructured(prompt, schema) {
	const response = await ai.models.generateContent({
		model: PRIMARY_MODEL,
		contents: prompt,
		config: {
			responseMimeType: 'application/json',
			responseSchema: schema,
			thinkingConfig: { thinkingLevel: 'low' },
		},
	});
	return JSON.parse(response.text);
}

/**
 * Stream de contenido para UI
 * @param {Object} options - Opciones para generateContentStream
 * @yields {string} Chunks de texto
 */
export async function* streamContent(options) {
	const stream = await ai.models.generateContentStream({
		model: PRIMARY_MODEL,
		...options,
	});
	for await (const chunk of stream) {
		if (chunk.text) yield chunk.text;
	}
}

export { ai, PRIMARY_MODEL, FALLBACK_MODEL };
