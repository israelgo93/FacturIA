import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ComprobanteDetalle from '@/components/comprobantes/ComprobanteDetalle';

export default async function ComprobanteDetallePage({ params }) {
	const { id } = await params;
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect('/login');

	const { data: comprobante, error } = await supabase
		.from('comprobantes')
		.select(`
			*,
			empresa:empresas(ruc, razon_social, nombre_comercial, direccion_matriz),
			establecimiento:establecimientos(codigo, direccion),
			punto_emision:puntos_emision(codigo),
			cliente:clientes(razon_social, identificacion, email),
			detalles:comprobante_detalles(
				*,
				impuestos:comprobante_impuestos(*)
			),
			pagos:comprobante_pagos(*)
		`)
		.eq('id', id)
		.single();

	if (error || !comprobante) notFound();

	return <ComprobanteDetalle comprobante={comprobante} />;
}
