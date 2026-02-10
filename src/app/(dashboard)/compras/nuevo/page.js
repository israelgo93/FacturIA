'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { crearCompra } from '../actions';
import {
	TIPO_ID_PROVEEDOR_ATS, TIPO_COMPROBANTE_ATS, COD_SUSTENTO_ATS, FORMA_PAGO_ATS,
} from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';

function getEmptyForm() {
	return {
		tipo_id_proveedor: '01', identificacion_proveedor: '', razon_social_proveedor: '',
		tipo_comprobante: '01', cod_sustento: '01',
		establecimiento: '001', punto_emision: '001', secuencial: '',
		fecha_emision: '',
		fecha_registro: '',
		autorizacion: '',
		base_no_grava_iva: 0, base_imponible_0: 0, base_imponible_iva: 0,
		base_imp_exenta: 0, monto_iva: 0, monto_ice: 0,
		forma_pago: '20', pago_loc_ext: '01', parte_relacionada: 'NO',
		observaciones: '', retenciones: [],
	};
}

export default function NuevaCompraPage() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(getEmptyForm());

	useEffect(() => {
		const hoy = new Date().toISOString().split('T')[0];
		setForm((prev) => ({
			...prev,
			fecha_emision: prev.fecha_emision || hoy,
			fecha_registro: prev.fecha_registro || hoy,
		}));
	}, []);

	const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

	const handleGuardar = async () => {
		setSaving(true);
		const result = await crearCompra(form);
		setSaving(false);
		if (result.success) {
			toast.success('Compra registrada correctamente');
			router.push('/compras');
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
				<Link href="/compras" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Registrar Compra Recibida</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Registro de compras/gastos para el ATS</p>
				</div>
			</div>

			<GlassCard className="p-6">
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
				<div className="flex justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
					<Link href="/compras">
						<GlassButton variant="ghost">Cancelar</GlassButton>
					</Link>
					<GlassButton onClick={handleGuardar} loading={saving}>Guardar Compra</GlassButton>
				</div>
			</GlassCard>
		</div>
	);
}
