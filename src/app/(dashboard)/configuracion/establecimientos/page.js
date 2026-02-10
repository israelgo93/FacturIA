'use client';

import { useEffect, useState, useActionState } from 'react';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { listarEstablecimientos, crearEstablecimiento, actualizarEstablecimiento, toggleEstablecimiento } from './actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassModal from '@/components/ui/GlassModal';
import GlassInput from '@/components/ui/GlassInput';
import StatusBadge from '@/components/comprobantes/StatusBadge';
import GlassAlert from '@/components/ui/GlassAlert';

export default function EstablecimientosPage() {
	const [establecimientos, setEstablecimientos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);

	const action = editItem ? actualizarEstablecimiento : crearEstablecimiento;
	const [state, formAction, isPending] = useActionState(action, null);

	const cargarDatos = async () => {
		setLoading(true);
		const result = await listarEstablecimientos();
		if (result.data) setEstablecimientos(result.data);
		setLoading(false);
	};

	useEffect(() => { cargarDatos(); }, []);

	useEffect(() => {
		if (state?.success) {
			toast.success(editItem ? 'Establecimiento actualizado' : 'Establecimiento creado');
			setModalOpen(false);
			setEditItem(null);
			cargarDatos();
		}
		if (state?.error) toast.error(state.error);
	}, [state, editItem]);

	const handleToggle = async (id, activo) => {
		const result = await toggleEstablecimiento(id, !activo);
		if (result.success) {
			toast.success(activo ? 'Desactivado' : 'Activado');
			cargarDatos();
		}
	};

	const columns = [
		{ key: 'codigo', label: 'Código', width: '100px' },
		{ key: 'direccion', label: 'Dirección' },
		{ key: 'nombre_comercial', label: 'Nombre Comercial' },
		{
			key: 'activo', label: 'Estado', width: '100px',
			render: (val) => <StatusBadge estado={val ? 'active' : 'inactive'} size="sm" />,
		},
		{
			key: 'actions', label: '', width: '80px',
			render: (_, row) => (
				<div className="flex gap-1">
					<button
						onClick={() => { setEditItem(row); setModalOpen(true); }}
						className="p-1.5 rounded-lg transition-colors"
						style={{ color: 'var(--text-muted)' }}
					>
						<Edit2 className="w-3.5 h-3.5" />
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/configuracion" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
						<ArrowLeft className="w-5 h-5" />
					</Link>
					<div>
						<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Establecimientos</h1>
						<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Gestiona los establecimientos</p>
					</div>
				</div>
				<GlassButton icon={Plus} onClick={() => { setEditItem(null); setModalOpen(true); }}>
					Nuevo
				</GlassButton>
			</div>

			<GlassTable
				columns={columns}
				data={establecimientos}
				loading={loading}
				emptyMessage="No hay establecimientos"
				mobileCard={(row) => (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.nombre_comercial || 'Sin nombre comercial'}</span>
							<StatusBadge estado={row.activo ? 'active' : 'inactive'} size="sm" />
						</div>
						<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
							<span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--glass-active)', color: 'var(--text-muted)' }}>{row.codigo}</span>
							<span>{row.direccion}</span>
						</div>
						<div className="flex justify-end pt-1">
							<button
								onClick={() => { setEditItem(row); setModalOpen(true); }}
								className="p-1.5 rounded-lg transition-colors"
								style={{ color: 'var(--text-muted)' }}
							>
								<Edit2 className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				)}
			/>

			<GlassModal
				isOpen={modalOpen}
				onClose={() => { setModalOpen(false); setEditItem(null); }}
				title={editItem ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}
				size="sm"
			>
				{state?.error && <GlassAlert type="error" message={state.error} className="mb-4" />}
				<form action={formAction} className="space-y-4">
					{editItem && <input type="hidden" name="id" value={editItem.id} />}
					<GlassInput
						label="Código"
						name="codigo"
						placeholder="001"
						required
						defaultValue={editItem?.codigo || ''}
						error={state?.errors?.codigo?.[0]}
					/>
					<GlassInput
						label="Dirección"
						name="direccion"
						placeholder="Dirección del establecimiento"
						required
						defaultValue={editItem?.direccion || ''}
						error={state?.errors?.direccion?.[0]}
					/>
					<GlassInput
						label="Nombre Comercial"
						name="nombre_comercial"
						placeholder="Nombre comercial (opcional)"
						defaultValue={editItem?.nombre_comercial || ''}
					/>
					<div className="flex justify-end gap-2 pt-2">
						<GlassButton variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</GlassButton>
						<GlassButton type="submit" loading={isPending}>
							{editItem ? 'Guardar' : 'Crear'}
						</GlassButton>
					</div>
				</form>
			</GlassModal>
		</div>
	);
}
