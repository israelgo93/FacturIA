'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { listarClientes, toggleCliente } from './actions';
import { TIPOS_IDENTIFICACION } from '@/lib/utils/sri-catalogs';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassBadge from '@/components/ui/GlassBadge';

export default function ClientesPage() {
	const [clientes, setClientes] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [filtroTipo, setFiltroTipo] = useState('');
	const [filtroActivo, setFiltroActivo] = useState('');
	const [page, setPage] = useState(1);

	const cargarDatos = useCallback(async () => {
		setLoading(true);
		const result = await listarClientes({ busqueda, page, filtroTipo, filtroActivo });
		if (result.data) {
			setClientes(result.data);
			setPagination(result.pagination);
		}
		setLoading(false);
	}, [busqueda, page, filtroTipo, filtroActivo]);

	useEffect(() => { cargarDatos(); }, [cargarDatos]);

	const handleToggle = async (id, activo) => {
		const result = await toggleCliente(id, !activo);
		if (result.success) {
			toast.success(activo ? 'Cliente desactivado' : 'Cliente activado');
			cargarDatos();
		}
	};

	const tipoLabel = (tipo) => {
		const found = TIPOS_IDENTIFICACION.find((t) => t.value === tipo);
		return found ? found.label : tipo;
	};

	const columns = [
		{
			key: 'tipo_identificacion', label: 'Tipo', width: '80px',
			render: (val) => <span className="text-xs">{tipoLabel(val)}</span>,
		},
		{ key: 'identificacion', label: 'Identificación', width: '140px' },
		{ key: 'razon_social', label: 'Razón Social' },
		{ key: 'email', label: 'Email', render: (val) => val || '-' },
		{
			key: 'activo', label: 'Estado', width: '90px',
			render: (val) => <GlassBadge status={val ? 'active' : 'inactive'} size="sm" />,
		},
		{
			key: 'actions', label: '', width: '90px',
			render: (_, row) => (
				<div className="flex gap-1">
					<Link href={`/clientes/${row.id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
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
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Clientes</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Gestiona tus clientes y receptores</p>
				</div>
				<div className="flex gap-2">
					<Link href="/clientes/importar">
						<GlassButton variant="secondary" icon={Upload} size="sm">Importar</GlassButton>
					</Link>
					<Link href="/clientes/nuevo">
						<GlassButton icon={Plus}>Nuevo</GlassButton>
					</Link>
				</div>
			</div>

			{/* Filtros */}
			<div className="flex flex-col sm:flex-row gap-3">
				<GlassInput
					icon={Search}
					placeholder="Buscar por nombre o identificación..."
					value={busqueda}
					onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
					className="flex-1"
				/>
				<GlassSelect
					options={[{ value: '', label: 'Todos los tipos' }, ...TIPOS_IDENTIFICACION]}
					value={filtroTipo}
					onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
					className="sm:w-48"
				/>
				<GlassSelect
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
				data={clientes}
				loading={loading}
				emptyMessage="No hay clientes registrados"
				pagination={pagination}
				onPageChange={setPage}
			/>
		</div>
	);
}
