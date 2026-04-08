import { redirect } from 'next/navigation';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';
import EmpresasTable from '../components/EmpresasTable';

export default async function AdminEmpresasPage() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) redirect('/dashboard');

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
					Empresas
				</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Listado de empresas registradas en la plataforma
				</p>
			</div>
			<EmpresasTable />
		</div>
	);
}
