'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { crearEmpleado } from '../actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';

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

function getEmptyForm() {
	return {
		tipo_identificacion: 'C', identificacion: '',
		apellidos: '', nombres: '',
		fecha_ingreso: '',
		fecha_salida: '', cargo: '', tipo_contrato: '01',
		sueldo_mensual: 0,
	};
}

export default function NuevoEmpleadoPage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(getEmptyForm());

	useEffect(() => {
		const hoy = new Date().toISOString().split('T')[0];
		setForm((prev) => ({
			...prev,
			fecha_ingreso: prev.fecha_ingreso || hoy,
		}));
	}, []);

	const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

	const handleGuardar = async () => {
		setSaving(true);
		const result = await crearEmpleado(form);
		setSaving(false);
		if (result.success) {
			toast.success('Empleado registrado');
			router.push('/empleados');
		} else if (result.errors) {
			const firstError = Object.values(result.errors)[0];
			toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
		} else {
			toast.error(result.error || 'Error al guardar');
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link href="/empleados" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Registrar Empleado</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Registro de empleados para el RDEP</p>
				</div>
			</div>

			<GlassCard className="p-6">
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
				<div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
					<Link href="/empleados">
						<GlassButton variant="ghost">Cancelar</GlassButton>
					</Link>
					<GlassButton onClick={handleGuardar} loading={saving}>Guardar</GlassButton>
				</div>
			</GlassCard>
		</div>
	);
}
