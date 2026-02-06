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
				<h1 className="text-xl font-medium text-white/90">Dashboard</h1>
				<p className="text-white/25 text-xs mt-1">Resumen de tu actividad</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{stats.map((stat) => (
					<GlassCard key={stat.label} className="p-5" hover={false}>
						<div className="flex items-center justify-between mb-3">
							<span className="text-[10px] text-white/25 uppercase tracking-widest">{stat.label}</span>
							<stat.icon className="w-4 h-4 text-white/15" />
						</div>
						<p className="text-xl font-semibold text-white/80">{stat.value}</p>
					</GlassCard>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<GlassCard className="p-6" hover={false}>
					<h3 className="text-sm font-medium text-white/60 mb-4">Ventas Mensuales</h3>
					<div className="h-48 flex items-center justify-center text-white/10 text-xs">
						Gráfico de ventas se mostrará aquí
					</div>
				</GlassCard>

				<GlassCard className="p-6" hover={false}>
					<h3 className="text-sm font-medium text-white/60 mb-4">Actividad Reciente</h3>
					<div className="h-48 flex items-center justify-center text-white/10 text-xs">
						Actividad reciente se mostrará aquí
					</div>
				</GlassCard>
			</div>
		</div>
	);
}
