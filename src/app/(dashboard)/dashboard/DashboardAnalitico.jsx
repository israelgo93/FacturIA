'use client';

import Link from 'next/link';
import {
	ArrowRight,
	TrendingDown,
	TrendingUp,
	Minus,
	Sparkles,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/comprobantes/StatusBadge';
import VentasChart from '@/components/dashboard/VentasChart';
import ComprobantesPieChart from '@/components/dashboard/ComprobantesPieChart';
import TendenciaMensual from '@/components/dashboard/TendenciaMensual';
import TopClientes from '@/components/dashboard/TopClientes';
import UsageMeter from '@/components/dashboard/UsageMeter';
import PrediccionIA from '@/components/dashboard/PrediccionIA';

function Variacion({ value }) {
	const n = Number(value);
	if (Number.isNaN(n) || n === 0) {
		return (
			<span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
				<Minus className="w-3 h-3" /> 0%
			</span>
		);
	}
	const up = n > 0;
	const Icon = up ? TrendingUp : TrendingDown;
	return (
		<span
			className="inline-flex items-center gap-0.5 text-[10px]"
			style={{ color: up ? 'var(--color-success)' : 'var(--color-danger)' }}
		>
			<Icon className="w-3 h-3" />
			{up ? '+' : ''}
			{n}%
		</span>
	);
}

export default function DashboardAnalitico({
	mes,
	metricas,
	historico,
	usoPlan,
	proximoVencimiento,
	ultimosComprobantes,
}) {
	const m = metricas || {};
	const kpis = [
		{
			label: 'Ventas del mes',
			value: `$${parseFloat(m.ventas_actual || 0).toFixed(2)}`,
			variacion: m.variacion_ventas,
		},
		{
			label: 'Comprobantes',
			value: String(m.comprobantes_actual ?? 0),
			variacion: m.variacion_comprobantes,
		},
		{
			label: 'Clientes activos',
			value: String(m.total_clientes ?? 0),
			variacion: null,
		},
		{
			label: 'IVA cobrado',
			value: `$${parseFloat(m.iva_cobrado || 0).toFixed(2)}`,
			variacion: null,
		},
	];

	return (
		<div className="space-y-6 min-w-0">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Analitica — {mes} · comparativo mes anterior
				</p>
			</div>

			<div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
				{kpis.map((k) => (
					<GlassCard key={k.label} className="min-w-0 p-4 sm:p-5 overflow-hidden" hover={false}>
						<span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
							{k.label}
						</span>
						<div className="flex items-end justify-between gap-2 mt-2">
							<p className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
								{k.value}
							</p>
							{k.variacion != null ? <Variacion value={k.variacion} /> : null}
						</div>
					</GlassCard>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Ventas ultimos 6 meses
					</h3>
					<VentasChart data={historico} />
				</GlassCard>
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Tendencia
					</h3>
					<TendenciaMensual data={historico} />
				</GlassCard>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Comprobantes por tipo (mes)
					</h3>
					<ComprobantesPieChart porTipo={m.comprobantes_por_tipo} />
				</GlassCard>
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Top clientes
					</h3>
					<TopClientes items={m.top_clientes} />
				</GlassCard>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Uso del plan
					</h3>
					<UsageMeter
						usados={usoPlan?.usados}
						limite={usoPlan?.limite}
						planNombre={usoPlan?.plan}
					/>
				</GlassCard>
				<GlassCard className="p-4 sm:p-6" hover={false}>
					<h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
						Proximo vencimiento tributario
					</h3>
					{proximoVencimiento ? (
						<div className="text-xs space-y-1">
							<p style={{ color: 'var(--text-primary)' }}>{proximoVencimiento.fecha}</p>
							<p style={{ color: 'var(--text-muted)' }}>
								{proximoVencimiento.dias >= 0
									? `Faltan ${proximoVencimiento.dias} dia(s)`
									: `Vencido hace ${Math.abs(proximoVencimiento.dias)} dia(s)`}
							</p>
							<StatusBadge estado={proximoVencimiento.estado === 'urgente' ? 'pendiente' : 'activo'} label={proximoVencimiento.estado} size="sm" />
						</div>
					) : (
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Configura el RUC de la empresa.</p>
					)}
				</GlassCard>
			</div>

			<PrediccionIA mes={mes} />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
				<GlassCard className="min-w-0 p-4 sm:p-6 overflow-hidden" hover={false}>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 mb-4">
						<h3 className="text-sm font-medium min-w-0" style={{ color: 'var(--text-secondary)' }}>
							Actividad reciente
						</h3>
						<Link
							href="/comprobantes"
							className="text-xs inline-flex items-center gap-1 self-start sm:self-auto min-h-11 sm:min-h-0 px-1 -mx-1 rounded-lg transition-colors touch-target"
							style={{ color: 'var(--text-muted)' }}
						>
							Ver todos <ArrowRight className="w-3 h-3 shrink-0" aria-hidden />
						</Link>
					</div>
					{!ultimosComprobantes?.length ? (
						<div className="min-h-[8rem] flex items-center justify-center text-xs px-2 text-center" style={{ color: 'var(--text-disabled)' }}>
							Sin comprobantes registrados
						</div>
					) : (
						<ul className="space-y-2 sm:space-y-1.5 list-none p-0 m-0">
							{ultimosComprobantes.map((comp) => (
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
												<span className="text-[var(--text-muted)]">{comp.tipo_comprobante}</span>
												{' '}
												<span className="break-words sm:break-normal">{comp.numero_completo || '—'}</span>
											</p>
											<p className="text-[10px] leading-snug line-clamp-2 sm:truncate" style={{ color: 'var(--text-muted)' }}>
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

				<Link href="/asistente" className="min-w-0 block">
					<GlassCard className="min-w-0 p-4 sm:p-5 group cursor-pointer overflow-hidden" hover={true}>
						<div className="flex items-center gap-4">
							<div
								className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
								style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
							>
								<Sparkles className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} aria-hidden />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									Asistente Tributario IA
								</p>
								<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
									Consulta IVA, retenciones y vencimientos
								</p>
							</div>
							<ArrowRight className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
						</div>
					</GlassCard>
				</Link>
			</div>
		</div>
	);
}
