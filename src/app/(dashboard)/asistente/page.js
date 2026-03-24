import { obtenerContextoEmpresa } from '../reportes/actions';
import { obtenerDashboardKPIs } from '../dashboard/actions';
import ChatContainer from './components/ChatContainer';

export const metadata = {
	title: 'Asistente Tributario IA — facturIA',
};

export default async function AsistentePage() {
	const [empresaResult, kpisResult] = await Promise.all([
		obtenerContextoEmpresa(),
		obtenerDashboardKPIs(),
	]);

	return (
		<ChatContainer
			empresa={empresaResult?.data || null}
			kpis={kpisResult?.data || null}
		/>
	);
}
