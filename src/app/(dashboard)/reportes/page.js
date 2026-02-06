'use client';

import Link from 'next/link';
import { BarChart3, FileSpreadsheet, FileText, Calculator, Brain, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const reportes = [
	{
		title: 'ATS',
		desc: 'Anexo Transaccional Simplificado — Genera XML para DIMM',
		icon: FileSpreadsheet,
		href: '/reportes/ats',
		color: '#3b82f6',
	},
	{
		title: 'RDEP',
		desc: 'Relación de Dependencia — Retenciones anuales empleados',
		icon: FileText,
		href: '/reportes/rdep',
		color: '#8b5cf6',
	},
	{
		title: 'Form. 104',
		desc: 'Pre-llenado automático de declaración de IVA',
		icon: Calculator,
		href: '/reportes/iva',
		color: '#22c55e',
	},
	{
		title: 'Form. 103',
		desc: 'Pre-llenado de retenciones en la fuente',
		icon: Calculator,
		href: '/reportes/retenciones',
		color: '#f59e0b',
	},
	{
		title: 'Ventas',
		desc: 'Reporte detallado de comprobantes de venta',
		icon: BarChart3,
		href: '/reportes/ventas',
		color: '#06b6d4',
	},
	{
		title: 'Análisis IA',
		desc: 'Chat IA para análisis tributario y detección de anomalías',
		icon: Brain,
		href: '/reportes/analisis',
		color: '#ec4899',
	},
];

export default function ReportesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Reportes</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Genera reportes tributarios asistidos por IA</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{reportes.map((reporte) => (
					<Link key={reporte.title} href={reporte.href}>
						<GlassCard className="p-5 cursor-pointer h-full">
							<div
								className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
								style={{ background: `${reporte.color}15`, border: `1px solid ${reporte.color}30` }}
							>
								<reporte.icon className="w-4 h-4" style={{ color: reporte.color }} />
							</div>
							<h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{reporte.title}</h3>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{reporte.desc}</p>
						</GlassCard>
					</Link>
				))}
			</div>
		</div>
	);
}
