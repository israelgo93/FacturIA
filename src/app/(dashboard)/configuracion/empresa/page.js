'use client';

import { useEffect, useState, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { empresaSchema } from '@/lib/validations/empresa';
import { obtenerEmpresa, crearEmpresa, actualizarEmpresa } from './actions';
import { REGIMENES_FISCALES } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function EmpresaPage() {
	const [empresa, setEmpresa] = useState(null);
	const [loading, setLoading] = useState(true);

	const action = empresa ? actualizarEmpresa : crearEmpresa;
	const [state, formAction, isPending] = useActionState(action, null);

	const { register, formState: { errors }, reset } = useForm({
		resolver: zodResolver(empresaSchema),
	});

	useEffect(() => {
		obtenerEmpresa().then((result) => {
			if (result.data) {
				setEmpresa(result.data);
				reset({
					ruc: result.data.ruc || '',
					razon_social: result.data.razon_social || '',
					nombre_comercial: result.data.nombre_comercial || '',
					direccion_matriz: result.data.direccion_matriz || '',
					obligado_contabilidad: result.data.obligado_contabilidad ? 'true' : 'false',
					contribuyente_especial: result.data.contribuyente_especial || '',
					regimen_fiscal: result.data.regimen_fiscal || 'GENERAL',
					agente_retencion: result.data.agente_retencion || '',
					ambiente: String(result.data.ambiente || 1),
					email_notificaciones: result.data.email_notificaciones || '',
					telefono: result.data.telefono || '',
				});
			}
			setLoading(false);
		});
	}, [reset]);

	useEffect(() => {
		if (state?.success) {
			toast.success(empresa ? 'Empresa actualizada' : 'Empresa creada exitosamente');
		}
		if (state?.error) {
			toast.error(state.error);
		}
	}, [state, empresa]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link
					href="/configuracion"
					className="p-2 rounded-xl transition-colors duration-300"
					style={{ color: 'var(--text-muted)' }}
				>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
						{empresa ? 'Editar Empresa' : 'Registrar Empresa'}
					</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
						Datos del contribuyente para facturación electrónica
					</p>
				</div>
			</div>

			{state?.error && <GlassAlert type="error" message={state.error} />}

			<form action={formAction}>
				{empresa && <input type="hidden" name="empresa_id" value={empresa.id} />}

				<GlassCard className="p-6 space-y-5" hover={false} animate={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput
							label="RUC"
							placeholder="1790012345001"
							required
							error={errors.ruc?.message || state?.errors?.ruc?.[0]}
							{...register('ruc')}
						/>
						<GlassSelect
							label="Ambiente SRI"
							required
							options={[
								{ value: '1', label: 'Pruebas' },
								{ value: '2', label: 'Producción' },
							]}
							error={state?.errors?.ambiente?.[0]}
							{...register('ambiente')}
						/>
					</div>

					<GlassInput
						label="Razón Social"
						placeholder="Nombre legal de la empresa"
						required
						error={errors.razon_social?.message || state?.errors?.razon_social?.[0]}
						{...register('razon_social')}
					/>

					<GlassInput
						label="Nombre Comercial"
						placeholder="Nombre comercial (opcional)"
						error={state?.errors?.nombre_comercial?.[0]}
						{...register('nombre_comercial')}
					/>

					<GlassInput
						label="Dirección Matriz"
						placeholder="Dirección del establecimiento principal"
						required
						error={errors.direccion_matriz?.message || state?.errors?.direccion_matriz?.[0]}
						{...register('direccion_matriz')}
					/>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassSelect
							label="Régimen Fiscal"
							required
							options={REGIMENES_FISCALES}
							error={state?.errors?.regimen_fiscal?.[0]}
							{...register('regimen_fiscal')}
						/>
						<GlassSelect
							label="Obligado a llevar Contabilidad"
							required
							options={[
								{ value: 'false', label: 'No' },
								{ value: 'true', label: 'Sí' },
							]}
							error={state?.errors?.obligado_contabilidad?.[0]}
							{...register('obligado_contabilidad')}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput
							label="Contribuyente Especial"
							placeholder="Nro. resolución (si aplica)"
							error={state?.errors?.contribuyente_especial?.[0]}
							{...register('contribuyente_especial')}
						/>
						<GlassInput
							label="Agente de Retención"
							placeholder="Nro. resolución (si aplica)"
							error={state?.errors?.agente_retencion?.[0]}
							{...register('agente_retencion')}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput
							label="Email de Notificaciones"
							type="email"
							placeholder="correo@empresa.com"
							error={state?.errors?.email_notificaciones?.[0]}
							{...register('email_notificaciones')}
						/>
						<GlassInput
							label="Teléfono"
							placeholder="0991234567"
							error={state?.errors?.telefono?.[0]}
							{...register('telefono')}
						/>
					</div>
				</GlassCard>

				<div className="flex justify-end mt-4">
					<GlassButton type="submit" loading={isPending} icon={Save} size="lg">
						{empresa ? 'Guardar Cambios' : 'Registrar Empresa'}
					</GlassButton>
				</div>
			</form>
		</div>
	);
}
