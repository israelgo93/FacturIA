import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

/**
 * Genera hasta 3 insights breves con Gemini (servidor).
 * @param {object} metricas
 * @param {Array<{ mes: string, ventas: number }>} historicoVentas
 * @returns {Promise<string>}
 */
export async function generarPrediccionInsights(metricas, historicoVentas) {
	const { text } = await generateText({
		model: google('gemini-2.5-flash'),
		system:
			'Eres analista tributario ecuatoriano. Genera como maximo 3 lineas breves en espanol (viñetas con "- "). ' +
			'Solo hechos derivados de los datos; no inventes cifras. Sin markdown pesado.',
		prompt: `Metricas (JSON): ${JSON.stringify(metricas)}
Historico ventas 6 meses (JSON): ${JSON.stringify(historicoVentas)}
Lista 3 insights: tendencia, anomalia o recomendacion tributaria.`,
		maxOutputTokens: 400,
	});

	return text || '';
}
