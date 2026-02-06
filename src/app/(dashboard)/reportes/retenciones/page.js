'use client';

import { useState } from 'react';
import { FileSpreadsheet, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerForm103, exportarForm103Xlsx } from '../actions';
import PeriodoSelector from '@/components/reportes/PeriodoSelector';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';

export default function RetencionesPage() {
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [loading, setLoading] = useState(false);
	const [datos, setDatos] = useState(null);

	const handleCalcular = async () => {
		setLoading(true);
		const result = await obtenerForm103(parseInt(anio), parseInt(mes));
		setLoading(false);
		if (result.success) {
			setDatos(result.data);
			toast.success('Formulario 103 calculado');
		} else {
			toast.error(result.error);
		}
	};

	const handleExportar = async () => {
		setLoading(true);
		const result = await exportarForm103Xlsx(parseInt(anio), parseInt(mes));
		setLoading(false);
		if (result.success) {
			const link = document.createElement('a');
			link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.base64}`;
			link.download = result.data.filename;
			link.click();
		} else {
			toast.error(result.error);
		}
	};

	const rentaColumns = [
		{ key: 'codigo', label: 'Código', width: '80px' },
		{
			key: 'baseImponible', label: 'Base Imponible', width: '120px',
			render: (val) => `$${val.toFixed(2)}`,
		},
		{
			key: 'porcentaje', label: '%', width: '60px',
			render: (val) => `${val}%`,
		},
		{
			key: 'valorRetenido', label: 'Valor Retenido', width: '120px',
			render: (val) => `$${val.toFixed(2)}`,
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Formulario 103 — Retenciones en la Fuente</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pre-llenado automático de retenciones del período</p>
			</div>

			<GlassCard className="p-6">
				<div className="flex items-end gap-4 flex-wrap">
					<PeriodoSelector anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
					<GlassButton onClick={handleCalcular} loading={loading}>
						<Calculator className="w-4 h-4 mr-1" /> Calcular
					</GlassButton>
				</div>
			</GlassCard>

			{datos && (
				<>
					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Retenciones de Renta</h2>
						<GlassTable
							columns={rentaColumns}
							data={datos.retencionesRenta}
							emptyMessage="Sin retenciones de renta en este período"
						/>
						<div className="flex justify-end mt-3">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
								Total: ${datos.totalRetencionesRenta.toFixed(2)}
							</span>
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Retenciones de IVA</h2>
						<GlassTable
							columns={rentaColumns}
							data={datos.retencionesIVA}
							emptyMessage="Sin retenciones de IVA en este período"
						/>
						<div className="flex justify-end mt-3">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
								Total: ${datos.totalRetencionesIVA.toFixed(2)}
							</span>
						</div>
					</GlassCard>

					<GlassCard className="p-6">
						<div className="flex justify-between items-center">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Total a Pagar</span>
							<span className="text-lg font-bold" style={{ color: '#ef4444' }}>${datos.totalAPagar.toFixed(2)}</span>
						</div>
					</GlassCard>

					<div className="flex gap-3">
						<GlassButton onClick={handleExportar} variant="ghost" size="sm">
							<FileSpreadsheet className="w-4 h-4 mr-1" /> Exportar a Excel
						</GlassButton>
					</div>
				</>
			)}
		</div>
	);
}
