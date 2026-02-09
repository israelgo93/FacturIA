'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, BarChart3, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { obtenerReporteVentas, exportarVentasXlsx } from '../actions';
import PeriodoSelector from '@/components/reportes/PeriodoSelector';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';

export default function VentasPage() {
	const [anio, setAnio] = useState(String(new Date().getFullYear()));
	const [mes, setMes] = useState(String(new Date().getMonth() + 1));
	const [loading, setLoading] = useState(false);
	const [datos, setDatos] = useState(null);

	const handleGenerar = async () => {
		setLoading(true);
		const result = await obtenerReporteVentas(parseInt(anio), parseInt(mes));
		setLoading(false);
		if (result.success) {
			setDatos(result.data);
			toast.success('Reporte de ventas generado');
		} else {
			toast.error(result.error);
		}
	};

	const handleExportar = async () => {
		setLoading(true);
		const result = await exportarVentasXlsx(parseInt(anio), parseInt(mes));
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

	const columns = [
		{
			key: 'fecha_emision', label: 'Fecha', width: '90px',
			render: (val) => new Date(val + 'T00:00:00').toLocaleDateString('es-EC'),
		},
		{ key: 'tipo_comprobante', label: 'Tipo', width: '50px' },
		{ key: 'numero_completo', label: 'Número', width: '140px' },
		{
			key: 'razon_social_comprador', label: 'Cliente',
			render: (val) => <span className="truncate block max-w-[180px]" title={val}>{val || '-'}</span>,
		},
		{
			key: 'subtotal_iva', label: 'Base Grav.', width: '100px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'valor_iva', label: 'IVA', width: '80px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'importe_total', label: 'Total', width: '100px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'estado', label: 'Estado', width: '70px',
			render: (val) => (
				<span className={`text-xs px-2 py-0.5 rounded-full ${val === 'AUT' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
					{val}
				</span>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link href="/reportes">
					<GlassButton variant="ghost" size="sm" icon={ArrowLeft} />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Reporte de Ventas</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Detalle y resumen de comprobantes de venta emitidos</p>
				</div>
			</div>

			<GlassCard className="p-6">
				<div className="flex items-end gap-4 flex-wrap">
					<PeriodoSelector anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
					<GlassButton onClick={handleGenerar} loading={loading}>
						<BarChart3 className="w-4 h-4 mr-1" /> Generar Reporte
					</GlassButton>
				</div>
			</GlassCard>

			{datos && (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[
							{ label: 'Facturas', value: datos.resumen.totalFacturas, color: 'var(--text-primary)' },
							{ label: 'Ventas Netas', value: `$${datos.resumen.ventasNetas.toFixed(2)}`, color: '#22c55e' },
							{ label: 'IVA Cobrado', value: `$${datos.resumen.totalIVA.toFixed(2)}`, color: 'var(--text-primary)' },
							{ label: 'Notas de Crédito', value: datos.resumen.totalNC, color: '#ef4444' },
						].map((item) => (
							<GlassCard key={item.label} className="p-4">
								<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
								<p className="text-lg font-medium mt-1" style={{ color: item.color }}>{item.value}</p>
							</GlassCard>
						))}
					</div>

					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Detalle de Comprobantes</h2>
						<GlassTable columns={columns} data={datos.comprobantes} emptyMessage="Sin comprobantes en este período" />
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
