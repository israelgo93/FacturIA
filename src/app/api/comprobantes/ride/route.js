/**
 * API Route: Genera RIDE PDF de un comprobante
 */
import { createClient } from '@/lib/supabase/server';
import { generarRIDEPDF } from '@/lib/sri/ride-generator';

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get('id');

	if (!id) {
		return Response.json({ error: 'id es requerido' }, { status: 400 });
	}

	try {
		const supabase = await createClient();

		const { data: comprobante, error } = await supabase
			.from('comprobantes')
			.select(`
				*,
				empresa:empresas(ruc, razon_social, nombre_comercial, direccion_matriz),
				establecimiento:establecimientos(codigo, direccion),
				punto_emision:puntos_emision(codigo),
				detalles:comprobante_detalles(*),
				pagos:comprobante_pagos(*)
			`)
			.eq('id', id)
			.single();

		if (error || !comprobante) {
			return Response.json({ error: 'Comprobante no encontrado' }, { status: 404 });
		}

		const pdfBuffer = await generarRIDEPDF(comprobante);

		return new Response(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="RIDE_${comprobante.numero_completo || comprobante.secuencial}.pdf"`,
			},
		});
	} catch (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
