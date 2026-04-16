import { createClient } from '@/lib/supabase/server';
import { obtenerMetricasDashboard, obtenerHistoricoVentas } from '@/lib/dashboard/metricas-service';
import { infoVencimiento } from '@/lib/utils/vencimientos';
import { mesActualEcuador, periodoActualEcuador } from '@/lib/utils/formatters';
import { obtenerEstadoTrial } from '@/lib/suscripciones/trial-manager';
import DashboardAnalitico from './DashboardAnalitico';
import TrialBanner from '../suscripcion/components/TrialBanner';

export default async function DashboardPage() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return null;
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ruc')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) {
		return (
			<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
				Configura tu empresa para ver el dashboard.
			</p>
		);
	}

	const mes = mesActualEcuador();

	let metricas = {};
	let historico = [];
	let usoPlan = {};

	try {
		[metricas, historico] = await Promise.all([
			obtenerMetricasDashboard(empresa.id, mes),
			obtenerHistoricoVentas(empresa.id, 6),
		]);
	} catch {
		metricas = {};
		historico = [];
	}

	try {
		const { data: uso } = await supabase.rpc('verificar_limite_plan', {
			p_empresa_id: empresa.id,
		});
		usoPlan = uso && typeof uso === 'object' ? uso : {};
	} catch {
		usoPlan = {};
	}

	const { anio: anioEC, mes: mesEC } = periodoActualEcuador();
	const mesAnterior = mesEC === 1 ? 12 : mesEC - 1;
	const anioV = mesEC === 1 ? anioEC - 1 : anioEC;
	const mesV = mesAnterior;
	let proximoVencimiento = null;
	if (empresa.ruc && empresa.ruc.length >= 9) {
		proximoVencimiento = infoVencimiento(empresa.ruc, anioV, mesV);
	}

	const { data: ultimos } = await supabase
		.from('comprobantes')
		.select('id, tipo_comprobante, numero_completo, estado, importe_total, razon_social_comprador')
		.eq('empresa_id', empresa.id)
		.order('created_at', { ascending: false })
		.limit(8);

	let trialData = null;
	try {
		trialData = await obtenerEstadoTrial(empresa.id);
	} catch {
		trialData = null;
	}

	return (
		<>
			{trialData?.estado === 'trial' && (
				<TrialBanner
					diasRestantes={trialData.dias_restantes}
					planNombre={trialData.plan}
				/>
			)}
			<DashboardAnalitico
				mes={mes}
				metricas={metricas}
				historico={historico}
				usoPlan={usoPlan}
				proximoVencimiento={proximoVencimiento}
				ultimosComprobantes={ultimos || []}
			/>
		</>
	);
}
