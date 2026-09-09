/**
 * API Route autenticada: consultar autorización inicial de un comprobante.
 * El ambiente y la clave siempre se obtienen de la base de datos.
 */
import { createClient } from '@/lib/supabase/server';
import { reConsultarAutorizacion } from '@/app/(dashboard)/comprobantes/actions';

export async function POST(req) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return Response.json({ error: 'No autenticado' }, { status: 401 });

		const { comprobanteId } = await req.json();
		if (!comprobanteId) {
			return Response.json({ error: 'comprobanteId es requerido' }, { status: 400 });
		}

		const resultado = await reConsultarAutorizacion(comprobanteId);
		return Response.json(resultado, { status: resultado.error ? 400 : 200 });
	} catch (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
