import { redirect } from 'next/navigation';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';
import { createClient } from '@/lib/supabase/server';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/comprobantes/StatusBadge';

export default async function AdminSuscripcionesPage() {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) redirect('/dashboard');

	const supabase = await createClient();
	const { data: suscripciones } = await supabase
		.from('suscripciones')
		.select(`
			id, estado, trial_ends_at, fecha_inicio, stripe_subscription_id,
			empresas ( razon_social, ruc ),
			planes ( nombre, precio_mensual )
		`)
		.order('created_at', { ascending: false });

	const rows = (suscripciones || []).map((s) => {
		const empresa = Array.isArray(s.empresas) ? s.empresas[0] : s.empresas;
		const plan = Array.isArray(s.planes) ? s.planes[0] : s.planes;
		return { ...s, empresa, plan };
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
					Suscripciones
				</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Gestion de suscripciones de la plataforma
				</p>
			</div>

			<GlassCard className="overflow-hidden" hover={false}>
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr style={{ borderBottom: '1px solid var(--divider)' }}>
								{['Empresa', 'Plan', 'Estado', 'Trial', 'Stripe ID'].map((h) => (
									<th key={h} className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((s) => (
								<tr key={s.id} style={{ borderBottom: '1px solid var(--divider)' }}>
									<td className="px-4 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
										{s.empresa?.razon_social || '—'}
									</td>
									<td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
										{s.plan?.nombre || '—'}
									</td>
									<td className="px-4 py-3">
										<StatusBadge estado={s.estado} size="sm" />
									</td>
									<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
										{s.trial_ends_at
											? new Date(s.trial_ends_at).toLocaleDateString('es-EC')
											: '—'}
									</td>
									<td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
										{s.stripe_subscription_id
											? `...${s.stripe_subscription_id.slice(-8)}`
											: '—'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</GlassCard>
		</div>
	);
}
