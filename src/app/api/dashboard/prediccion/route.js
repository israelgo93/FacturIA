import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { obtenerMetricasDashboard, obtenerHistoricoVentas } from '@/lib/dashboard/metricas-service';
import { generarPrediccionInsights } from '@/lib/dashboard/prediccion-ia';
import { mesActualEcuador } from '@/lib/utils/formatters';

export const maxDuration = 30;

export async function GET(req) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) {
		return NextResponse.json({ error: 'Empresa no configurada' }, { status: 400 });
	}

	const { searchParams } = new URL(req.url);
	const mes = searchParams.get('mes') || mesActualEcuador();

	try {
		const [metricas, historico] = await Promise.all([
			obtenerMetricasDashboard(empresa.id, mes),
			obtenerHistoricoVentas(empresa.id, 6),
		]);

		const insights = await generarPrediccionInsights(metricas, historico);
		return NextResponse.json({ insights });
	} catch (e) {
		return NextResponse.json(
			{ error: e instanceof Error ? e.message : 'Error IA' },
			{ status: 500 },
		);
	}
}
