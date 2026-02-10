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
				<span
					className="text-xs px-2 py-0.5 rounded-full"
					style={{
						background: val === 'AUT' ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
						color: val === 'AUT' ? 'var(--color-success)' : 'var(--color-warning)',
					}}
				>
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
							{ label: 'Ventas Netas', value: `$${datos.resumen.ventasNetas.toFixed(2)}`, color: 'var(--color-success)' },
							{ label: 'IVA Cobrado', value: `$${datos.resumen.totalIVA.toFixed(2)}`, color: 'var(--text-primary)' },
							{ label: 'Notas de Crédito', value: datos.resumen.totalNC, color: 'var(--color-danger)' },
						].map((item) => (
							<GlassCard key={item.label} className="p-4">
								<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
								<p className="text-lg font-medium mt-1" style={{ color: item.color }}>{item.value}</p>
							</GlassCard>
						))}
					</div>

					<GlassCard className="p-6">
						<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Detalle de Comprobantes</h2>
						<GlassTable
							columns={columns}
							data={datos.comprobantes}
							emptyMessage="Sin comprobantes en este período"
							mobileCard={(row) => (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
											{row.tipo_comprobante} - {row.numero_completo}
										</span>
										<span
											className="text-[10px] px-1.5 py-0.5 rounded-full"
											style={{
												background: row.estado === 'AUT' ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
												color: row.estado === 'AUT' ? 'var(--color-success)' : 'var(--color-warning)',
											}}
										>
											{row.estado}
										</span>
									</div>
									<div className="flex flex-col">
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
											{row.razon_social_comprador || 'Consumidor Final'}
										</span>
										<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
											{new Date(row.fecha_emision + 'T00:00:00').toLocaleDateString('es-EC')}
										</span>
									</div>
									<div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--divider)' }}>
										<span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total</span>
										<span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
											${parseFloat(row.importe_total || 0).toFixed(2)}
										</span>
									</div>
								</div>
							)}
						/>
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
