'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trash2, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { listarCompras, crearCompra, eliminarCompra } from './actions';
import {
	TIPO_ID_PROVEEDOR_ATS, TIPO_COMPROBANTE_ATS, COD_SUSTENTO_ATS, FORMA_PAGO_ATS,
	getLabelTipoIdProveedorATS, getLabelCodSustentoATS,
} from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassTable from '@/components/ui/GlassTable';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassModal from '@/components/ui/GlassModal';

export default function ComprasPage() {
	const [compras, setCompras] = useState([]);
	const [pagination, setPagination] = useState(null);
	const [loading, setLoading] = useState(true);
	const [busqueda, setBusqueda] = useState('');
	const [page, setPage] = useState(1);
	const [showModal, setShowModal] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(getEmptyForm());

	function getEmptyForm() {
		return {
			tipo_id_proveedor: '01', identificacion_proveedor: '', razon_social_proveedor: '',
			tipo_comprobante: '01', cod_sustento: '01',
			establecimiento: '001', punto_emision: '001', secuencial: '',
			fecha_emision: '', // Se establece en useEffect para evitar hydration mismatch
			fecha_registro: '', // Se establece en useEffect para evitar hydration mismatch
			autorizacion: '',
			base_no_grava_iva: 0, base_imponible_0: 0, base_imponible_iva: 0,
			base_imp_exenta: 0, monto_iva: 0, monto_ice: 0,
			forma_pago: '20', pago_loc_ext: '01', parte_relacionada: 'NO',
			observaciones: '', retenciones: [],
		};
	}

	// Establecer fechas en el cliente para evitar hydration mismatch con new Date()
	useEffect(() => {
		const hoy = new Date().toISOString().split('T')[0];
		setForm((prev) => ({
			...prev,
			fecha_emision: prev.fecha_emision || hoy,
			fecha_registro: prev.fecha_registro || hoy,
		}));
	}, []);

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

	const handleGuardar = async () => {
		setSaving(true);
		const result = await crearCompra(form);
		setSaving(false);
		if (result.success) {
			toast.success('Compra registrada correctamente');
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
		if (!confirm('¿Eliminar esta compra?')) return;
		const result = await eliminarCompra(id);
		if (result.success) {
			toast.success('Compra eliminada');
			cargarDatos();
		} else {
			toast.error(result.error);
		}
	};

	const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
				<GlassButton onClick={() => setShowModal(true)} size="sm">
					<Plus className="w-4 h-4 mr-1" /> Nueva Compra
				</GlassButton>
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

			<GlassModal isOpen={showModal} title="Registrar Compra Recibida" onClose={() => setShowModal(false)} size="lg">
				<div className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<GlassSelect label="Tipo ID Proveedor" value={form.tipo_id_proveedor} onChange={(e) => updateForm('tipo_id_proveedor', e.target.value)} options={TIPO_ID_PROVEEDOR_ATS} />
						<GlassInput label="Identificación" value={form.identificacion_proveedor} onChange={(e) => updateForm('identificacion_proveedor', e.target.value)} />
						<GlassInput label="Razón Social" value={form.razon_social_proveedor} onChange={(e) => updateForm('razon_social_proveedor', e.target.value)} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<GlassSelect label="Tipo Comprobante" value={form.tipo_comprobante} onChange={(e) => updateForm('tipo_comprobante', e.target.value)} options={TIPO_COMPROBANTE_ATS} />
						<GlassSelect label="Cód. Sustento" value={form.cod_sustento} onChange={(e) => updateForm('cod_sustento', e.target.value)} options={COD_SUSTENTO_ATS} />
						<GlassSelect label="Forma de Pago" value={form.forma_pago} onChange={(e) => updateForm('forma_pago', e.target.value)} options={FORMA_PAGO_ATS} />
					</div>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						<GlassInput label="Estab." value={form.establecimiento} onChange={(e) => updateForm('establecimiento', e.target.value)} maxLength={3} />
						<GlassInput label="Pto. Emi." value={form.punto_emision} onChange={(e) => updateForm('punto_emision', e.target.value)} maxLength={3} />
						<GlassInput label="Secuencial" value={form.secuencial} onChange={(e) => updateForm('secuencial', e.target.value)} maxLength={9} />
						<GlassInput label="Fecha Emisión" type="date" value={form.fecha_emision} onChange={(e) => updateForm('fecha_emision', e.target.value)} />
						<GlassInput label="Fecha Registro" type="date" value={form.fecha_registro} onChange={(e) => updateForm('fecha_registro', e.target.value)} />
					</div>
					<GlassInput label="Autorización" value={form.autorizacion} onChange={(e) => updateForm('autorizacion', e.target.value)} maxLength={49} />
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						<GlassInput label="Base No Grava IVA" type="number" step="0.01" value={form.base_no_grava_iva} onChange={(e) => updateForm('base_no_grava_iva', e.target.value)} />
						<GlassInput label="Base Imponible 0%" type="number" step="0.01" value={form.base_imponible_0} onChange={(e) => updateForm('base_imponible_0', e.target.value)} />
						<GlassInput label="Base Imponible IVA" type="number" step="0.01" value={form.base_imponible_iva} onChange={(e) => updateForm('base_imponible_iva', e.target.value)} />
						<GlassInput label="Base Exenta" type="number" step="0.01" value={form.base_imp_exenta} onChange={(e) => updateForm('base_imp_exenta', e.target.value)} />
						<GlassInput label="Monto IVA" type="number" step="0.01" value={form.monto_iva} onChange={(e) => updateForm('monto_iva', e.target.value)} />
						<GlassInput label="Monto ICE" type="number" step="0.01" value={form.monto_ice} onChange={(e) => updateForm('monto_ice', e.target.value)} />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<GlassSelect label="Parte Relacionada" value={form.parte_relacionada} onChange={(e) => updateForm('parte_relacionada', e.target.value)} options={[{ value: 'NO', label: 'No' }, { value: 'SI', label: 'Sí' }]} />
						<GlassSelect label="Pago Local/Exterior" value={form.pago_loc_ext} onChange={(e) => updateForm('pago_loc_ext', e.target.value)} options={[{ value: '01', label: 'Local' }, { value: '02', label: 'Exterior' }]} />
					</div>
					<GlassInput label="Observaciones" value={form.observaciones} onChange={(e) => updateForm('observaciones', e.target.value)} />
				</div>
				<div className="flex justify-end gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
					<GlassButton variant="ghost" onClick={() => setShowModal(false)}>Cancelar</GlassButton>
					<GlassButton onClick={handleGuardar} loading={saving}>Guardar Compra</GlassButton>
				</div>
			</GlassModal>
		</div>
	);
}
