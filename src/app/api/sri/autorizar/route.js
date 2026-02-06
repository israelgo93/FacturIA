/**
 * API Route: Consultar autorización de comprobante en el SRI
 */
import { consultarAutorizacion } from '@/lib/sri/soap-client';

export async function POST(req) {
	try {
		const { claveAcceso, ambiente } = await req.json();
		if (!claveAcceso) {
			return Response.json({ error: 'claveAcceso es requerida' }, { status: 400 });
		}

		const resultado = await consultarAutorizacion(claveAcceso, ambiente || '1');
		return Response.json(resultado);
	} catch (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
