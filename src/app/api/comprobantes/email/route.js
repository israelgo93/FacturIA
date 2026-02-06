/**
 * API Route: Enviar comprobante por email con XML + RIDE
 */
import { createClient } from '@/lib/supabase/server';
import { generarRIDEPDF } from '@/lib/sri/ride-generator';
import { enviarComprobanteEmail } from '@/lib/email/resend-client';

export async function POST(req) {
	const { comprobanteId, emailDestino } = await req.json();

	if (!comprobanteId) {
		return Response.json({ error: 'comprobanteId es requerido' }, { status: 400 });
	}

	try {
		const supabase = await createClient();

		const { data: comp, error } = await supabase
			.from('comprobantes')
			.select(`
				*,
				empresa:empresas(ruc, razon_social, nombre_comercial, direccion_matriz),
				establecimiento:establecimientos(codigo, direccion),
				punto_emision:puntos_emision(codigo),
				detalles:comprobante_detalles(*),
				pagos:comprobante_pagos(*)
			`)
			.eq('id', comprobanteId)
			.single();

		if (error || !comp) {
			return Response.json({ error: 'Comprobante no encontrado' }, { status: 404 });
		}

		const email = emailDestino || comp.email_comprador;
		if (!email) {
			return Response.json({ error: 'No hay email de destino' }, { status: 400 });
		}

		// Generar RIDE PDF
		const ridePDF = await generarRIDEPDF(comp);

		// Enviar email
		const resultado = await enviarComprobanteEmail({
			to: email,
			razonSocialEmisor: comp.empresa?.razon_social || 'facturIA',
			numeroComprobante: comp.numero_completo || comp.secuencial,
			claveAcceso: comp.clave_acceso || '',
			xmlAutorizado: comp.xml_autorizado || comp.xml_firmado,
			ridePDF,
		});

		if (resultado.error) {
			return Response.json({ error: resultado.error }, { status: 500 });
		}

		// Marcar como enviado
		await supabase
			.from('comprobantes')
			.update({ email_enviado: true, email_enviado_at: new Date().toISOString() })
			.eq('id', comprobanteId);

		return Response.json({ success: true, emailId: resultado.data?.emailId });
	} catch (error) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
