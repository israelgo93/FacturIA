'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { listarEmpleados, crearEmpleado, eliminarEmpleado } from './actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassModal from '@/components/ui/GlassModal';

const TIPOS_ID_EMPLEADO = [
	{ value: 'C', label: 'Cédula' },
	{ value: 'R', label: 'RUC' },
	{ value: 'P', label: 'Pasaporte' },
];

const TIPOS_CONTRATO = [
	{ value: '01', label: 'Indefinido' },
	{ value: '02', label: 'Fijo' },
	{ value: '03', label: 'Eventual' },
	{ value: '04', label: 'Ocasional' },
];

export default function EmpleadosPage() {
	const [empleados, setEmpleados] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [page, setPage] = useState(1);
	const [showModal, setShowModal] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(getEmptyForm());

	function getEmptyForm() {
		return {
			tipo_identificacion: 'C', identificacion: '',
			apellidos: '', nombres: '',
			fecha_ingreso: '', // Se establece en useEffect para evitar hydration mismatch
			fecha_salida: '', cargo: '', tipo_contrato: '01',
			sueldo_mensual: 0,
		};
	}

	// Establecer fecha en el cliente para evitar hydration mismatch con new Date()
	useEffect(() => {
		const hoy = new Date().toISOString().split('T')[0];
		setForm((prev) => ({
			...prev,
			fecha_ingreso: prev.fecha_ingreso || hoy,
		}));
	}, []);

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

	const handleGuardar = async () => {
		setSaving(true);
		const result = await crearEmpleado(form);
		setSaving(false);
		if (result.success) {
			toast.success('Empleado registrado');
			setShowModal(false);
			setForm(getEmptyForm());
			cargarDatos();
		} else if (result.errors) {
			const firstError = Object.values(result.errors)[0];
			toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
		} else {
			toast.error(result.error || 'Error al guardar');
		}
	};

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

	const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
			render: (val) => (
				<span className={`text-xs px-2 py-0.5 rounded-full ${val ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
					{val ? 'Activo' : 'Inactivo'}
				</span>
			),
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
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Empleados</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Registro de empleados para el RDEP</p>
				</div>
				<GlassButton onClick={() => setShowModal(true)} size="sm">
					<Plus className="w-4 h-4 mr-1" /> Nuevo Empleado
				</GlassButton>
			</div>

			<GlassCard className="p-4">
				<div className="flex gap-3 mb-4">
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
						<GlassInput
							placeholder="Buscar por nombre o identificación..."
							value={busqueda}
							onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
							className="pl-9"
						/>
					</div>
				</div>
				<GlassTable
					columns={columns}
					data={empleados}
					loading={loading}
					emptyMessage="No hay empleados registrados"
					pagination={pagination}
					onPageChange={setPage}
				/>
			</GlassCard>

			<GlassModal isOpen={showModal} title="Registrar Empleado" onClose={() => setShowModal(false)}>
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<GlassSelect label="Tipo ID" value={form.tipo_identificacion} onChange={(e) => updateForm('tipo_identificacion', e.target.value)} options={TIPOS_ID_EMPLEADO} />
							<GlassInput label="Identificación" value={form.identificacion} onChange={(e) => updateForm('identificacion', e.target.value)} />
							<GlassSelect label="Tipo Contrato" value={form.tipo_contrato} onChange={(e) => updateForm('tipo_contrato', e.target.value)} options={TIPOS_CONTRATO} />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<GlassInput label="Apellidos" value={form.apellidos} onChange={(e) => updateForm('apellidos', e.target.value)} />
							<GlassInput label="Nombres" value={form.nombres} onChange={(e) => updateForm('nombres', e.target.value)} />
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<GlassInput label="Cargo" value={form.cargo} onChange={(e) => updateForm('cargo', e.target.value)} />
							<GlassInput label="Fecha Ingreso" type="date" value={form.fecha_ingreso} onChange={(e) => updateForm('fecha_ingreso', e.target.value)} />
							<GlassInput label="Sueldo Mensual" type="number" step="0.01" value={form.sueldo_mensual} onChange={(e) => updateForm('sueldo_mensual', e.target.value)} />
						</div>
					</div>
					<div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
						<GlassButton variant="ghost" onClick={() => setShowModal(false)}>Cancelar</GlassButton>
						<GlassButton onClick={handleGuardar} loading={saving}>Guardar</GlassButton>
					</div>
			</GlassModal>
		</div>
	);
}
