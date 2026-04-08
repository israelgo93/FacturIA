import { obtenerContextoEmpresa } from '../reportes/actions';
import { obtenerDashboardKPIs } from '../dashboard/actions';
import { verificarAccesoFeature } from '@/lib/suscripciones/subscription-guard';
import FeatureGate from '@/components/suscripcion/FeatureGate';
import ChatContainer from './components/ChatContainer';

export const metadata = {
	title: 'Asistente Tributario IA — facturIA',
};

export default async function AsistentePage() {
	const [empresaResult, kpisResult] = await Promise.all([
		obtenerContextoEmpresa(),
		obtenerDashboardKPIs(),
	]);

	const empresaId = empresaResult?.data?.id;
	const allowed = empresaId ? await verificarAccesoFeature(empresaId, 'reportes_ia') : false;

	return (
		<FeatureGate allowed={allowed} featureName="Asistente IA" planRequerido="Professional">
			<ChatContainer
				empresa={empresaResult?.data || null}
				kpis={kpisResult?.data || null}
			/>
		</FeatureGate>
	);
}
