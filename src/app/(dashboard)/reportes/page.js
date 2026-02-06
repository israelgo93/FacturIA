'use client';

import { BarChart3, FileSpreadsheet, FileText, Calculator } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const reportes = [
	{ title: 'ATS', desc: 'Anexo Transaccional Simplificado', icon: FileSpreadsheet },
	{ title: 'RDEP', desc: 'Relación de Dependencia', icon: FileText },
	{ title: 'Form. 104', desc: 'Pre-llenado Declaración IVA', icon: Calculator },
	{ title: 'Form. 103', desc: 'Pre-llenado Retenciones', icon: Calculator },
	{ title: 'Ventas', desc: 'Reporte de ventas por período', icon: BarChart3 },
];

export default function ReportesPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium text-white/90">Reportes</h1>
				<p className="text-white/25 text-xs mt-1">Genera reportes tributarios asistidos por IA</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{reportes.map((reporte) => (
					<GlassCard key={reporte.title} className="p-5 cursor-pointer">
						<div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
							<reporte.icon className="w-4 h-4 text-white/35" />
						</div>
						<h3 className="text-sm text-white/70 font-medium mb-1">{reporte.title}</h3>
						<p className="text-xs text-white/25">{reporte.desc}</p>
					</GlassCard>
				))}
			</div>
		</div>
	);
}
