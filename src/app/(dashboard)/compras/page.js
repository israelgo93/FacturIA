'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { listarCompras, eliminarCompra } from './actions';
import { getLabelTipoIdProveedorATS } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';

export default function ComprasPage() {
	const [compras, setCompras] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [page, setPage] = useState(1);

	const cargarDatos = useCallback(async () => {
		setLoading(true);
		const result = await listarCompras({ busqueda, page });
		if (result.data) {
			setCompras(result.data);
			setPagination(result.pagination);
		}
		setLoading(false);
	}, [busqueda, page]);

	useEffect(() => { cargarDatos(); }, [cargarDatos]);

	const handleEliminar = async (id) => {
		if (!confirm('¿Eliminar esta compra?')) return;
		const result = await eliminarCompra(id);
		if (result.success) {
			toast.success('Compra eliminada');
			cargarDatos();
		} else {
			toast.error(result.error);
		}
	};

	const columns = [
		{
			key: 'fecha_emision', label: 'Fecha', width: '100px',
			render: (val) => new Date(val + 'T00:00:00').toLocaleDateString('es-EC'),
		},
		{
			key: 'tipo_id_proveedor', label: 'Tipo', width: '70px',
			render: (val) => <span className="text-xs">{getLabelTipoIdProveedorATS(val)}</span>,
		},
		{ key: 'identificacion_proveedor', label: 'Identificación', width: '130px' },
		{
			key: 'razon_social_proveedor', label: 'Proveedor',
			render: (val) => <span className="truncate block max-w-[200px]" title={val}>{val}</span>,
		},
		{
			key: 'tipo_comprobante', label: 'Comp.', width: '50px',
			render: (val) => <span className="text-xs">{val}</span>,
		},
		{
			key: 'base_imponible_iva', label: 'Base IVA', width: '100px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'monto_iva', label: 'IVA', width: '80px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'actions', label: '', width: '50px',
			render: (_, row) => (
				<button onClick={() => handleEliminar(row.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
					<Trash2 className="w-3.5 h-3.5" />
				</button>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Compras Recibidas</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Registro de compras/gastos para el ATS</p>
				</div>
				<Link href="/compras/nuevo">
					<GlassButton size="sm">
						<Plus className="w-4 h-4 mr-1" /> Nueva Compra
					</GlassButton>
				</Link>
			</div>

			<GlassCard className="p-4">
				<div className="flex gap-3 mb-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
						<GlassInput
							placeholder="Buscar por proveedor o identificación..."
							value={busqueda}
							onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
							className="pl-9"
						/>
					</div>
				</div>
				<GlassTable
					columns={columns}
					data={compras}
					loading={loading}
					emptyMessage="No hay compras registradas"
					pagination={pagination}
					onPageChange={setPage}
					mobileCard={(row) => (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{row.razon_social_proveedor}</span>
								<button onClick={() => handleEliminar(row.id)} className="p-1.5 rounded-lg transition-colors flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
							</div>
							<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
								<span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--glass-active)', color: 'var(--text-muted)' }}>{getLabelTipoIdProveedorATS(row.tipo_id_proveedor)}</span>
								<span>{row.identificacion_proveedor}</span>
							</div>
							<div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
								<span>{new Date(row.fecha_emision + 'T00:00:00').toLocaleDateString('es-EC')}</span>
								<div className="flex gap-3">
									<span>Base IVA: <strong style={{ color: 'var(--text-primary)' }}>${parseFloat(row.base_imponible_iva || 0).toFixed(2)}</strong></span>
									<span>IVA: <strong style={{ color: 'var(--text-primary)' }}>${parseFloat(row.monto_iva || 0).toFixed(2)}</strong></span>
								</div>
							</div>
						</div>
					)}
				/>
			</GlassCard>
		</div>
	);
}
