import { redirect } from 'next/navigation';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';
import { createClient } from '@/lib/supabase/server';
import AdminMetricsCards from './components/AdminMetricsCards';
import EmpresasTable from './components/EmpresasTable';

export default async function AdminPage() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) redirect('/dashboard');

	const supabase = await createClient();
	const { data: metricas } = await supabase
		.from('v_admin_metricas_globales')
		.select('*')
		.single();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
					Panel de Administracion
				</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Metricas globales de la plataforma. Solo datos agregados, sin informacion privada.
				</p>
			</div>

			<AdminMetricsCards metricas={metricas} />

			<div>
				<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
					Empresas registradas
				</h2>
				<EmpresasTable />
			</div>
		</div>
	);
}
