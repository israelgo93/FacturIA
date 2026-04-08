import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificarSuperAdmin, registrarAccionAdmin } from '@/lib/auth/superadmin-guard';

export async function GET() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from('v_admin_metricas_globales')
		.select('*')
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	await registrarAccionAdmin('consulta', 'metricas_globales');

	return NextResponse.json(data);
}
