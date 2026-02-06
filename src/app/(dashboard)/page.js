'use client';

import { DollarSign, FileText, Users, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const stats = [
	{ label: 'Ventas del Mes', value: '$0.00', icon: DollarSign },
	{ label: 'Comprobantes', value: '0', icon: FileText },
	{ label: 'Clientes', value: '0', icon: Users },
	{ label: 'IVA Cobrado', value: '$0.00', icon: TrendingUp },
];

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Resumen de tu actividad</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat) => (
					<GlassCard key={stat.label} className="p-5" hover={false}>
						<div className="flex items-center justify-between mb-3">
							<span
								className="text-[10px] uppercase tracking-widest"
								style={{ color: 'var(--text-muted)' }}
							>
								{stat.label}
							</span>
							<stat.icon className="w-4 h-4" style={{ color: 'var(--text-disabled)' }} />
						</div>
						<p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
					</GlassCard>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<GlassCard className="p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Ventas Mensuales</h3>
					<div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--text-disabled)' }}>
						Gráfico de ventas se mostrará aquí
					</div>
				</GlassCard>

				<GlassCard className="p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Actividad Reciente</h3>
					<div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--text-disabled)' }}>
						Actividad reciente se mostrará aquí
					</div>
				</GlassCard>
			</div>
		</div>
	);
}
