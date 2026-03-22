'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { listarEmpleados, eliminarEmpleado } from './actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/comprobantes/StatusBadge';

export default function EmpleadosPage() {
	const [empleados, setEmpleados] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [page, setPage] = useState(1);

	const cargarDatos = useCallback(async () => {
		setLoading(true);
		const result = await listarEmpleados({ busqueda, page });
		if (result.data) {
			setEmpleados(result.data);
			setPagination(result.pagination);
		}
		setLoading(false);
	}, [busqueda, page]);

	useEffect(() => { cargarDatos(); }, [cargarDatos]);

	const handleEliminar = async (id) => {
		if (!confirm('¿Eliminar este empleado?')) return;
		const result = await eliminarEmpleado(id);
		if (result.success) {
			toast.success('Empleado eliminado');
			cargarDatos();
		} else {
			toast.error(result.error);
		}
	};

	const columns = [
		{ key: 'identificacion', label: 'Identificación', width: '130px' },
		{
			key: 'apellidos', label: 'Nombre Completo',
			render: (val, row) => `${val} ${row.nombres}`,
		},
		{ key: 'cargo', label: 'Cargo', render: (val) => val || '-' },
		{
			key: 'sueldo_mensual', label: 'Sueldo', width: '100px',
			render: (val) => `$${parseFloat(val || 0).toFixed(2)}`,
		},
		{
			key: 'activo', label: 'Estado', width: '80px',
			render: (val) => <StatusBadge estado={val ? 'active' : 'inactive'} size="sm" />,
		},
		{
			key: 'actions', label: '', width: '50px',
			render: (_, row) => (
				<button onClick={() => handleEliminar(row.id)} className="p-2 rounded-xl transition-colors touch-target flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
					<Trash2 className="w-4 h-4" />
				</button>
			),
		},
	];

	return (
		<div className="space-y-5">
			{/* Header responsive */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Empleados</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Registro de empleados para el RDEP</p>
				</div>
				<Link href="/empleados/nuevo" className="sm:flex-none">
					<GlassButton icon={Plus} className="w-full sm:w-auto">Nuevo Empleado</GlassButton>
				</Link>
			</div>

			<GlassCard className="p-4">
				<div className="mb-4">
					<GlassInput
						icon={Search}
						placeholder="Buscar por nombre o identificación..."
						value={busqueda}
						onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
					/>
				</div>
				<GlassTable
					columns={columns}
					data={empleados}
					loading={loading}
					emptyMessage="No hay empleados registrados"
					pagination={pagination}
					onPageChange={setPage}
					mobileCard={(row) => (
						<div className="space-y-2.5">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.apellidos} {row.nombres}</span>
								<StatusBadge estado={row.activo ? 'active' : 'inactive'} size="sm" />
							</div>
							<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
								<span>{row.identificacion}</span>
								{row.cargo && <span>· {row.cargo}</span>}
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>${parseFloat(row.sueldo_mensual || 0).toFixed(2)}/mes</span>
								<button onClick={() => handleEliminar(row.id)} className="p-2.5 rounded-xl transition-colors touch-target flex items-center justify-center active:bg-[var(--glass-active)]" style={{ color: 'var(--text-muted)' }}>
									<Trash2 className="w-5 h-5" />
								</button>
							</div>
						</div>
					)}
				/>
			</GlassCard>
		</div>
	);
}
