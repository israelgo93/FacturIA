'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { listarProductos, toggleProducto } from './actions';
import { TARIFAS_IVA } from '@/lib/utils/sri-catalogs';
import { formatCurrency } from '@/lib/utils/formatters';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import StatusBadge from '@/components/comprobantes/StatusBadge';

export default function ProductosPage() {
	const [productos, setProductos] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [filtroActivo, setFiltroActivo] = useState('');
	const [page, setPage] = useState(1);

	const cargarDatos = useCallback(async () => {
		setLoading(true);
		const result = await listarProductos({ busqueda, page, filtroActivo });
		if (result.data) {
			setProductos(result.data);
			setPagination(result.pagination);
		}
		setLoading(false);
	}, [busqueda, page, filtroActivo]);

	useEffect(() => { cargarDatos(); }, [cargarDatos]);

	const handleToggle = async (id, activo) => {
		const result = await toggleProducto(id, !activo);
		if (result.success) {
			toast.success(activo ? 'Producto desactivado' : 'Producto activado');
			cargarDatos();
		}
	};

	const ivaLabel = (codigo) => {
		const found = TARIFAS_IVA.find((t) => t.value === codigo);
		return found ? found.label : codigo;
	};

	const columns = [
		{ key: 'codigo_principal', label: 'Código', width: '120px' },
		{ key: 'nombre', label: 'Nombre' },
		{
			key: 'precio_unitario', label: 'Precio', width: '110px',
			render: (val) => formatCurrency(val),
		},
		{
			key: 'iva_codigo_porcentaje', label: 'IVA', width: '80px',
			render: (val) => <span className="text-xs">{ivaLabel(val)}</span>,
		},
		{ key: 'categoria', label: 'Categoría', render: (val) => val || '-' },
		{
			key: 'activo', label: 'Estado', width: '90px',
			render: (val) => <StatusBadge estado={val ? 'active' : 'inactive'} size="sm" />,
		},
		{
			key: 'actions', label: '', width: '90px',
			render: (_, row) => (
				<div className="flex gap-1">
					<Link href={`/productos/${row.id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
						<Edit2 className="w-3.5 h-3.5" />
					</Link>
					<button onClick={() => handleToggle(row.id, row.activo)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
						{row.activo ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Productos</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Catálogo de productos y servicios</p>
				</div>
				<div className="flex gap-2">
					<Link href="/productos/importar">
						<GlassButton variant="secondary" icon={Upload} size="sm">Importar</GlassButton>
					</Link>
					<Link href="/productos/nuevo">
						<GlassButton icon={Plus}>Nuevo</GlassButton>
					</Link>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<GlassInput
					icon={Search}
					placeholder="Buscar por nombre o código..."
					value={busqueda}
					onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
					className="flex-1"
				/>
				<GlassSelect
					label="Estado"
					options={[
						{ value: '', label: 'Todos' },
						{ value: 'true', label: 'Activos' },
						{ value: 'false', label: 'Inactivos' },
					]}
					value={filtroActivo}
					onChange={(e) => { setFiltroActivo(e.target.value); setPage(1); }}
					className="sm:w-36"
				/>
			</div>

			<GlassTable
				columns={columns}
				data={productos}
				loading={loading}
				emptyMessage="No hay productos registrados"
				pagination={pagination}
				onPageChange={setPage}
				mobileCard={(row) => (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.nombre}</span>
							<StatusBadge estado={row.activo ? 'active' : 'inactive'} size="sm" />
						</div>
						<div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
							<span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--glass-active)', color: 'var(--text-muted)' }}>{row.codigo_principal}</span>
							<span className="font-medium">{formatCurrency(row.precio_unitario)}</span>
							<span>{ivaLabel(row.iva_codigo_porcentaje)}</span>
						</div>
						{row.categoria && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.categoria}</p>}
						<div className="flex items-center gap-2 pt-1">
							<Link href={`/productos/${row.id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
								<Edit2 className="w-3.5 h-3.5" />
							</Link>
							<button onClick={() => handleToggle(row.id, row.activo)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
								{row.activo ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
							</button>
						</div>
					</div>
				)}
			/>
		</div>
	);
}
