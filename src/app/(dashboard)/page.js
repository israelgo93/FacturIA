'use client';

import { DollarSign, FileText, Users, TrendingUp, Plus, ArrowRight, BarChart3, Activity } from 'lucide-react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

const stats = [
	{ label: 'Ventas del Mes', value: '$575.00', icon: DollarSign, color: 'var(--color-success)' },
	{ label: 'Comprobantes', value: '12', icon: FileText, color: 'var(--color-info)' },
	{ label: 'Clientes', value: '1', icon: Users, color: 'var(--color-warning)' },
	{ label: 'IVA Cobrado', value: '$75.00', icon: TrendingUp, color: 'var(--color-danger)' },
];

const quickActions = [
	{ label: 'Nueva Factura', icon: Plus, href: '/comprobantes/factura/nuevo' },
	{ label: 'Nuevo Cliente', icon: Users, href: '/clientes' },
	{ label: 'Ver Reportes', icon: BarChart3, href: '/reportes' },
];

export default function DashboardPage() {
	return (
		<div className="space-y-6">
			{/* Header con fecha */}
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Resumen de tu actividad — {new Date().toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })}
					</p>
				</div>
			</div>

			{/* Stats Grid - 2 columnas en móvil */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
				{stats.map((stat) => (
					<GlassCard key={stat.label} className="p-4 md:p-5 relative overflow-hidden group" hover={true}>
						<div className="flex justify-between items-start mb-2">
							<span
								className="text-[10px] uppercase tracking-widest font-medium"
								style={{ color: 'var(--text-muted)' }}
							>
								{stat.label}
							</span>
							<div
								className="p-1.5 rounded-lg transition-colors group-hover:scale-110 duration-300"
								style={{ background: 'var(--glass-hover)' }}
							>
								<stat.icon className="w-4 h-4" style={{ color: stat.color }} />
							</div>
						</div>
						<p className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
							{stat.value}
						</p>
					</GlassCard>
				))}
			</div>

			{/* Accesos Rápidos - Scroll horizontal en móvil */}
			<div>
				<h3 className="text-sm font-medium mb-3 px-1" style={{ color: 'var(--text-secondary)' }}>Accesos Rápidos</h3>
				<div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
					{quickActions.map((action) => (
						<Link key={action.label} href={action.href} className="flex-shrink-0">
							<GlassButton variant="secondary" size="md" icon={action.icon} className="whitespace-nowrap">
								{action.label}
							</GlassButton>
						</Link>
					))}
				</div>
			</div>

			{/* Gráficos y Actividad */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				{/* Gráfico de Ventas */}
				<GlassCard className="p-0 overflow-hidden flex flex-col h-[300px]" hover={false}>
					<div className="p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
						<div className="flex items-center justify-between">
							<h3 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Ventas Mensuales</h3>
							<GlassButton variant="ghost" size="sm" icon={ArrowRight} className="!p-1.5" />
						</div>
					</div>
					<div className="flex-1 flex flex-col items-center justify-center relative p-6">
						{/* Placeholder visual atractivo */}
						<div className="absolute inset-x-6 bottom-0 h-32 flex items-end justify-between gap-2 opacity-50">
							{[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
								<div
									key={i}
									className="w-full rounded-t-lg transition-all duration-1000"
									style={{
										height: `${h}%`,
										background: `linear-gradient(to top, var(--color-success-muted) 0%, transparent 100%)`,
										borderTop: '2px solid var(--color-success)',
									}}
								/>
							))}
						</div>
						<div className="z-10 text-center">
							<BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: 'var(--text-muted)' }} />
							<p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sin datos suficientes</p>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Empieza a facturar para ver estadísticas</p>
						</div>
					</div>
				</GlassCard>

				{/* Actividad Reciente */}
				<GlassCard className="p-0 overflow-hidden flex flex-col h-[300px]" hover={false}>
					<div className="p-5 border-b" style={{ borderColor: 'var(--glass-border)' }}>
						<div className="flex items-center justify-between">
							<h3 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Actividad Reciente</h3>
							<Link href="/comprobantes">
								<span className="text-xs hover:underline cursor-pointer" style={{ color: 'var(--text-muted)' }}>Ver todos &rarr;</span>
							</Link>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto p-0">
						{[
							{ type: 'Retención', num: '001-001-000000003', client: 'EMPRESA PUBLICA MUNICIPAL DE AGUA POTABLE', amount: '$50.00', status: 'PPR' },
							{ type: 'Retención', num: '001-001-000000002', client: 'EMPRESA PUBLICA MUNICIPAL DE AGUA POTABLE', amount: '$100.00', status: 'PPR' },
							{ type: 'Guía Remisión', num: '001-001-000000005', client: '—', amount: '$0.00', status: 'AUT' },
							{ type: 'Guía Remisión', num: '001-001-000000004', client: '—', amount: '$0.00', status: 'DEV' },
							{ type: 'Guía Remisión', num: '001-001-000000003', client: '—', amount: '$0.00', status: 'DEV' },
						].map((item, i) => (
							<div
								key={i}
								className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-[var(--glass-hover)] transition-colors"
								style={{ borderColor: 'var(--glass-border)' }}
							>
								<div className="min-w-0 flex-1 mr-4">
									<div className="flex items-center gap-2 mb-0.5">
										<span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.type} {item.num}</span>
									</div>
									<p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.client}</p>
								</div>
								<div className="text-right">
									<p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.amount}</p>
									<span
										className="text-[10px] px-1.5 py-0.5 rounded-full inline-block"
										style={{
											background: item.status === 'AUT' ? 'var(--color-success-muted)' : item.status === 'PPR' ? 'var(--color-warning-muted)' : 'var(--color-danger-muted)',
											color: item.status === 'AUT' ? 'var(--color-success)' : item.status === 'PPR' ? 'var(--color-warning)' : 'var(--color-danger)',
										}}
									>
										{item.status === 'AUT' ? 'Autorizado' : item.status === 'PPR' ? 'Procesando' : 'Devuelto'}
									</span>
								</div>
							</div>
						))}
					</div>
				</GlassCard>
			</div>

			{/* Banner Promocional / Info */}
			<GlassCard className="p-4 bg-gradient-to-br from-[var(--glass-bg)] to-[var(--glass-hover)]" hover={true}>
				<div className="flex items-center gap-4">
					<div className="p-3 rounded-full shrink-0" style={{ background: 'var(--glass-active)' }}>
						<Activity className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
					</div>
					<div>
						<h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Asistente Tributario IA</h4>
						<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
							Consulta sobre retenciones, fechas de vencimiento y más. <span className="underline cursor-pointer">Preguntar ahora &rarr;</span>
						</p>
					</div>
				</div>
			</GlassCard>
		</div>
	);
}
