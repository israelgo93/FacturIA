'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, FileText, Users, TrendingUp, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/comprobantes/StatusBadge';
import { obtenerDashboardKPIs } from './actions';

const TIPO_LABELS = {
	'01': 'Factura',
	'03': 'Liq. Compra',
	'04': 'Nota Crédito',
	'05': 'Nota Débito',
	'06': 'Guía Remisión',
	'07': 'Retención',
};

export default function DashboardPage() {
	const [kpis, setKpis] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		obtenerDashboardKPIs().then((result) => {
			if (result.data) setKpis(result.data);
			setLoading(false);
		});
	}, []);

	const stats = [
		{
			label: 'Ventas del Mes',
			value: kpis ? `$${parseFloat(kpis.ventas_mes).toFixed(2)}` : '...',
			icon: DollarSign,
			color: '#22c55e',
		},
		{
			label: 'Comprobantes',
			value: kpis ? String(kpis.comprobantes_mes) : '...',
			icon: FileText,
			color: '#3b82f6',
		},
		{
			label: 'Clientes',
			value: kpis ? String(kpis.total_clientes) : '...',
			icon: Users,
			color: '#8b5cf6',
		},
		{
			label: 'IVA Cobrado',
			value: kpis ? `$${parseFloat(kpis.iva_cobrado_mes).toFixed(2)}` : '...',
			icon: TrendingUp,
			color: '#f59e0b',
		},
	];

	const ultimos = kpis?.ultimos_comprobantes || [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Resumen de tu actividad — {new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
				</p>
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-40">
					<Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						{stats.map((stat) => (
							<GlassCard key={stat.label} className="p-5" hover={false}>
								<div className="flex items-center justify-between mb-3">
									<span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
										{stat.label}
									</span>
									<div
										className="w-8 h-8 rounded-lg flex items-center justify-center"
										style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
									>
										<stat.icon className="w-4 h-4" style={{ color: stat.color }} />
									</div>
								</div>
								<p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
							</GlassCard>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
						<GlassCard className="p-6" hover={false}>
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Actividad Reciente</h3>
								<Link href="/comprobantes" className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
									Ver todos <ArrowRight className="w-3 h-3" />
								</Link>
							</div>
							{ultimos.length === 0 ? (
								<div className="h-32 flex items-center justify-center text-xs" style={{ color: 'var(--text-disabled)' }}>
									Sin comprobantes registrados
								</div>
							) : (
								<div className="space-y-2">
									{ultimos.map((comp) => (
										<Link
											key={comp.id}
											href={`/comprobantes/${comp.id}`}
											className="flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200"
											style={{ background: 'var(--glass-bg)' }}
										>
											<div className="flex items-center gap-3 min-w-0">
												<div>
													<p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
														{TIPO_LABELS[comp.tipo_comprobante] || comp.tipo_comprobante} {comp.numero_completo}
													</p>
													<p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
														{comp.razon_social_comprador || '—'}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3 shrink-0">
												<span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>
													${parseFloat(comp.importe_total).toFixed(2)}
												</span>
												<StatusBadge estado={comp.estado} />
											</div>
										</Link>
									))}
								</div>
							)}
						</GlassCard>

						<div className="space-y-5">
							<GlassCard className="p-6" hover={false}>
								<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Resumen del Mes</h3>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Autorizados SRI</span>
										<span className="text-sm font-medium" style={{ color: '#22c55e' }}>{kpis?.autorizados_mes || 0}</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total emitidos</span>
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{kpis?.comprobantes_mes || 0}</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ventas netas</span>
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
											${kpis ? parseFloat(kpis.ventas_mes).toFixed(2) : '0.00'}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>IVA cobrado</span>
										<span className="text-sm font-medium" style={{ color: '#f59e0b' }}>
											${kpis ? parseFloat(kpis.iva_cobrado_mes).toFixed(2) : '0.00'}
										</span>
									</div>
								</div>
							</GlassCard>

							<Link href="/reportes/analisis">
								<GlassCard className="p-5 group cursor-pointer" hover={true}>
									<div className="flex items-center gap-4">
										<div
											className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
											style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)' }}
										>
											<Sparkles className="w-5 h-5" style={{ color: '#a855f7' }} />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
												Asistente Tributario IA
											</p>
											<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
												Consulta IVA, retenciones, vencimientos y mas
											</p>
										</div>
										<ArrowRight className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
									</div>
								</GlassCard>
							</Link>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
