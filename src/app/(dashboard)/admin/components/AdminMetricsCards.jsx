'use client';

import GlassCard from '@/components/ui/GlassCard';
import { Building2, Users, FileText, CreditCard, Clock, XCircle } from 'lucide-react';

const metricConfig = [
	{ key: 'total_empresas', label: 'Empresas', icon: Building2 },
	{ key: 'total_usuarios', label: 'Usuarios', icon: Users },
	{ key: 'comprobantes_mes_actual', label: 'Comprobantes (mes)', icon: FileText },
	{ key: 'total_comprobantes', label: 'Comprobantes total', icon: FileText },
	{ key: 'suscripciones_activas', label: 'Suscripciones activas', icon: CreditCard },
	{ key: 'suscripciones_trial', label: 'En trial', icon: Clock },
	{ key: 'suscripciones_canceladas', label: 'Canceladas', icon: XCircle },
];

export default function AdminMetricsCards({ metricas }) {
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
			{metricConfig.map(({ key, label, icon: Icon }) => (
				<GlassCard key={key} className="p-4" hover={false}>
					<div className="flex items-center gap-2 mb-2">
						<Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
						<span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
							{label}
						</span>
					</div>
					<p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
						{metricas?.[key] ?? 0}
					</p>
				</GlassCard>
			))}
		</div>
	);
}
