import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';

export async function GET() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from('empresas')
		.select(`
			id, razon_social, nombre_comercial, ruc, created_at,
			suscripciones (
				estado, trial_ends_at,
				planes ( nombre, precio_mensual )
			)
		`)
		.order('created_at', { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	const empresas = (data || []).map((e) => {
		const sub = Array.isArray(e.suscripciones) ? e.suscripciones[0] : e.suscripciones;
		const plan = sub?.planes;
		const planRow = Array.isArray(plan) ? plan[0] : plan;
		return {
			id: e.id,
			razon_social: e.razon_social,
			nombre_comercial: e.nombre_comercial,
			ruc: e.ruc,
			created_at: e.created_at,
			plan: planRow?.nombre || 'Sin plan',
			precio: planRow?.precio_mensual || 0,
			estado_suscripcion: sub?.estado || 'sin_suscripcion',
			trial_ends_at: sub?.trial_ends_at,
		};
	});

	return NextResponse.json(empresas);
}
