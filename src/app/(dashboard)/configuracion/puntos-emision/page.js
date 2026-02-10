'use client';

import { useEffect, useState, useActionState } from 'react';
import { ArrowLeft, Plus, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { listarPuntosEmision, crearPuntoEmision, actualizarPuntoEmision } from './actions';
import { listarEstablecimientos } from '../establecimientos/actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassModal from '@/components/ui/GlassModal';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassBadge from '@/components/ui/GlassBadge';
import GlassAlert from '@/components/ui/GlassAlert';

export default function PuntosEmisionPage() {
	const [puntos, setPuntos] = useState([]);
	const [establecimientos, setEstablecimientos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editItem, setEditItem] = useState(null);

	const action = editItem ? actualizarPuntoEmision : crearPuntoEmision;
	const [state, formAction, isPending] = useActionState(action, null);

	const cargarDatos = async () => {
		setLoading(true);
		const [puntosResult, estabResult] = await Promise.all([
			listarPuntosEmision(),
			listarEstablecimientos(),
		]);
		if (puntosResult.data) setPuntos(puntosResult.data);
		if (estabResult.data) setEstablecimientos(estabResult.data);
		setLoading(false);
	};

	useEffect(() => { cargarDatos(); }, []);

	useEffect(() => {
		if (state?.success) {
			toast.success(editItem ? 'Punto de emisión actualizado' : 'Punto de emisión creado');
			setModalOpen(false);
			setEditItem(null);
			cargarDatos();
		}
		if (state?.error) toast.error(state.error);
	}, [state, editItem]);

	const columns = [
		{ key: 'codigo', label: 'Código', width: '100px' },
		{
			key: 'establecimientos', label: 'Establecimiento',
			render: (val) => val ? `${val.codigo} - ${val.direccion}` : '-',
		},
		{ key: 'descripcion', label: 'Descripción' },
		{
			key: 'activo', label: 'Estado', width: '100px',
			render: (val) => <GlassBadge status={val ? 'active' : 'inactive'} size="sm" />,
		},
		{
			key: 'actions', label: '', width: '80px',
			render: (_, row) => (
				<button
					onClick={() => { setEditItem(row); setModalOpen(true); }}
					className="p-1.5 rounded-lg transition-colors"
					style={{ color: 'var(--text-muted)' }}
				>
					<Edit2 className="w-3.5 h-3.5" />
				</button>
			),
		},
	];

	const estabOptions = establecimientos.map((e) => ({
		value: e.id,
		label: `${e.codigo} - ${e.direccion}`,
	}));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/configuracion" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
						<ArrowLeft className="w-5 h-5" />
					</Link>
					<div>
						<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Puntos de Emisión</h1>
						<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Configura los puntos de emisión</p>
					</div>
				</div>
				<GlassButton icon={Plus} onClick={() => { setEditItem(null); setModalOpen(true); }}>
					Nuevo
				</GlassButton>
			</div>

			<GlassTable
				columns={columns}
				data={puntos}
				loading={loading}
				emptyMessage="No hay puntos de emisión"
				mobileCard={(row) => (
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{row.descripcion || 'Punto de Emisión'}</span>
							<GlassBadge status={row.activo ? 'active' : 'inactive'} size="sm" />
						</div>
						<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
							<span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--glass-active)', color: 'var(--text-muted)' }}>{row.codigo}</span>
							<span>{row.establecimientos ? `${row.establecimientos.codigo} - ${row.establecimientos.direccion}` : '-'}</span>
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
				title={editItem ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'}
				size="sm"
			>
				{state?.error && <GlassAlert type="error" message={state.error} className="mb-4" />}
				<form action={formAction} className="space-y-4">
					{editItem && <input type="hidden" name="id" value={editItem.id} />}
					<GlassSelect
						label="Establecimiento"
						name="establecimiento_id"
						required
						options={estabOptions}
						defaultValue={editItem?.establecimiento_id || ''}
						error={state?.errors?.establecimiento_id?.[0]}
					/>
					<GlassInput
						label="Código"
						name="codigo"
						placeholder="001"
						required
						defaultValue={editItem?.codigo || ''}
						error={state?.errors?.codigo?.[0]}
					/>
					<GlassInput
						label="Descripción"
						name="descripcion"
						placeholder="Descripción (opcional)"
						defaultValue={editItem?.descripcion || ''}
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
