/**
 * API Route para el wizard de factura con asistencia IA
 * Usa Vercel AI SDK con Gemini 3 Flash para streaming
 */
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getWizardSystemPrompt } from '@/lib/ia/factura-prompts';

export const maxDuration = 30;

export async function POST(req) {
	const { messages, context } = await req.json();
	const supabase = await createClient();

	// Obtener datos de la empresa para contexto
	let empresa = null;
	if (context?.empresaId) {
		const { data } = await supabase
			.from('empresas')
			.select('ruc, razon_social, obligado_contabilidad, regimen_fiscal')
			.eq('id', context.empresaId)
			.single();
		empresa = data;
	}

	const result = streamText({
		model: google('gemini-3-flash-preview', {
			thinkingLevel: 'low',
		}),
		system: getWizardSystemPrompt(empresa),
		messages,
		tools: {
			buscarCliente: tool({
				description: 'Busca un cliente por nombre o identificación',
				parameters: z.object({
					termino: z.string().describe('Nombre, RUC o cédula del cliente'),
				}),
				execute: async ({ termino }) => {
					const { data } = await supabase
						.from('clientes')
						.select('id, razon_social, identificacion, tipo_identificacion, email')
						.or(`razon_social.ilike.%${termino}%,identificacion.ilike.%${termino}%`)
						.eq('activo', true)
						.limit(5);
					return data || [];
				},
			}),
			buscarProducto: tool({
				description: 'Busca productos por nombre o código',
				parameters: z.object({
					termino: z.string().describe('Nombre o código del producto'),
				}),
				execute: async ({ termino }) => {
					const { data } = await supabase
						.from('productos')
						.select('id, codigo_principal, nombre, precio_unitario, iva_codigo_porcentaje')
						.or(`nombre.ilike.%${termino}%,codigo_principal.ilike.%${termino}%`)
						.eq('activo', true)
						.limit(10);
					return data || [];
				},
			}),
			calcularTotales: tool({
				description: 'Calcula los totales de la factura',
				parameters: z.object({
					items: z.array(
						z.object({
							cantidad: z.number(),
							precioUnitario: z.number(),
							descuento: z.number().default(0),
							tarifaIva: z.number(),
						})
					),
				}),
				execute: async ({ items }) => {
					let subtotal = 0;
					let totalIva = 0;
					let totalDescuento = 0;

					for (const item of items) {
						const base = item.cantidad * item.precioUnitario - item.descuento;
						subtotal += base;
						totalIva += base * (item.tarifaIva / 100);
						totalDescuento += item.descuento;
					}

					return {
						subtotalSinImpuestos: subtotal.toFixed(2),
						totalDescuento: totalDescuento.toFixed(2),
						totalIva: totalIva.toFixed(2),
						importeTotal: (subtotal + totalIva).toFixed(2),
					};
				},
			}),
		},
	});

	return result.toUIMessageStreamResponse();
}
