/**
 * API Route: Enviar comprobante al SRI
 */
import { createClient } from '@/lib/supabase/server';
import { procesarComprobante } from '@/lib/sri/comprobante-orchestrator';

export async function POST(req) {
	try {
		const { comprobanteId } = await req.json();
		if (!comprobanteId) {
			return Response.json({ error: 'comprobanteId es requerido' }, { status: 400 });
		}

		const resultado = await procesarComprobante(comprobanteId);
		return Response.json(resultado);
	} catch (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
