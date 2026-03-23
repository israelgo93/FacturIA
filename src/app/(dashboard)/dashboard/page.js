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
		},
		{
			label: 'Comprobantes',
			value: kpis ? String(kpis.comprobantes_mes) : '...',
			icon: FileText,
		},
		{
			label: 'Clientes',
			value: kpis ? String(kpis.total_clientes) : '...',
			icon: Users,
		},
		{
			label: 'IVA Cobrado',
			value: kpis ? `$${parseFloat(kpis.iva_cobrado_mes).toFixed(2)}` : '...',
			icon: TrendingUp,
		},
	];

	const ultimos = kpis?.ultimos_comprobantes || [];

	return (
		<div className="space-y-6 min-w-0">
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
					<div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
						{stats.map((stat) => (
							<GlassCard key={stat.label} className="min-w-0 p-4 sm:p-5 overflow-hidden" hover={false}>
								<div className="flex items-center justify-between mb-3">
									<span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
										{stat.label}
									</span>
									<div
										className="w-8 h-8 rounded-lg flex items-center justify-center"
										style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
									>
										<stat.icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
									</div>
								</div>
								<p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
							</GlassCard>
						))}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0">
						<GlassCard className="min-w-0 p-4 sm:p-6 overflow-hidden" hover={false}>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-4">
								<h3 className="text-sm font-medium min-w-0" style={{ color: 'var(--text-secondary)' }}>
									Actividad Reciente
								</h3>
								<Link
									href="/comprobantes"
									className="text-xs inline-flex items-center gap-1 self-start sm:self-auto min-h-11 sm:min-h-0 px-1 -mx-1 rounded-lg transition-colors touch-target"
									style={{ color: 'var(--text-muted)' }}
								>
									Ver todos <ArrowRight className="w-3 h-3 shrink-0" aria-hidden />
								</Link>
							</div>
							{ultimos.length === 0 ? (
								<div className="min-h-[8rem] flex items-center justify-center text-xs px-2 text-center" style={{ color: 'var(--text-disabled)' }}>
									Sin comprobantes registrados
								</div>
							) : (
								<ul className="space-y-2 sm:space-y-1.5 list-none p-0 m-0">
									{ultimos.map((comp) => (
										<li key={comp.id}>
											<Link
												href={`/comprobantes/${comp.id}`}
												className="flex flex-col gap-2.5 rounded-xl px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2.5 transition-[transform,background-color] duration-200 active:scale-[0.99] touch-manipulation"
												style={{ background: 'var(--glass-bg)' }}
											>
												<div className="min-w-0 flex-1 w-full space-y-0.5">
													<p
														className="text-xs font-medium leading-snug line-clamp-2 sm:line-clamp-1 sm:truncate"
														style={{ color: 'var(--text-primary)' }}
													>
														<span className="text-[var(--text-muted)]">
															{TIPO_LABELS[comp.tipo_comprobante] || comp.tipo_comprobante}
														</span>
														{' '}
														<span className="break-words sm:break-normal">{comp.numero_completo || '—'}</span>
													</p>
													<p
														className="text-[10px] leading-snug line-clamp-2 sm:truncate"
														style={{ color: 'var(--text-muted)' }}
													>
														{comp.razon_social_comprador || '—'}
													</p>
												</div>
												<div
													className="flex flex-row items-center justify-between gap-3 shrink-0 w-full sm:w-auto sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0"
													style={{ borderColor: 'var(--glass-border)' }}
												>
													<span className="text-xs font-medium tabular-nums text-left sm:text-right" style={{ color: 'var(--text-primary)' }}>
														${parseFloat(comp.importe_total ?? 0).toFixed(2)}
													</span>
													<StatusBadge estado={comp.estado} size="sm" className="shrink-0" />
												</div>
											</Link>
										</li>
									))}
								</ul>
							)}
						</GlassCard>

						<div className="min-w-0 space-y-5">
							<GlassCard className="min-w-0 p-4 sm:p-6 overflow-hidden" hover={false}>
								<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>Resumen del Mes</h3>
								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>Autorizados SRI</span>
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{kpis?.autorizados_mes || 0}</span>
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
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
											${kpis ? parseFloat(kpis.iva_cobrado_mes).toFixed(2) : '0.00'}
										</span>
									</div>
								</div>
							</GlassCard>

							<Link href="/reportes/analisis" className="min-w-0 block">
								<GlassCard className="min-w-0 p-4 sm:p-5 group cursor-pointer overflow-hidden" hover={true}>
									<div className="flex items-center gap-4">
										<div
											className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
											style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
										>
											<Sparkles className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
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
