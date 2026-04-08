import { redirect } from 'next/navigation';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';
import AuditLog from '../components/AuditLog';

export default async function AdminAuditPage() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) redirect('/dashboard');

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
					Auditoria
				</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Registro de acciones administrativas en la plataforma
				</p>
			</div>
			<AuditLog />
		</div>
	);
}
