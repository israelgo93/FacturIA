'use client';

import { useEffect, useState, useActionState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { obtenerProducto, actualizarProducto } from '../actions';
import { TARIFAS_IVA } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function EditarProductoPage() {
	const router = useRouter();
	const params = useParams();
	const [producto, setProducto] = useState(null);
	const [loading, setLoading] = useState(true);
	const [state, formAction, isPending] = useActionState(actualizarProducto, null);

	useEffect(() => {
		obtenerProducto(params.id).then((result) => {
			if (result.data) setProducto(result.data);
			else { toast.error('Producto no encontrado'); router.push('/productos'); }
			setLoading(false);
		});
	}, [params.id, router]);

	useEffect(() => {
		if (state?.success) {
			toast.success('Producto actualizado');
			router.push('/productos');
		}
		if (state?.error) toast.error(state.error);
	}, [state, router]);

	const ivaOptions = TARIFAS_IVA.map((t) => ({ value: t.value, label: t.label }));

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
				<Link href="/productos" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Editar Producto</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{producto?.nombre}</p>
				</div>
			</div>

			{state?.error && <GlassAlert type="error" message={state.error} />}

			<form action={formAction}>
				<input type="hidden" name="id" value={producto?.id} />
				<GlassCard className="p-6 space-y-5" hover={false} animate={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Código Principal" name="codigo_principal" required defaultValue={producto?.codigo_principal} error={state?.errors?.codigo_principal?.[0]} />
						<GlassInput label="Código Auxiliar" name="codigo_auxiliar" defaultValue={producto?.codigo_auxiliar || ''} />
					</div>
					<GlassInput label="Nombre" name="nombre" required defaultValue={producto?.nombre} error={state?.errors?.nombre?.[0]} />
					<GlassInput label="Descripción" name="descripcion" defaultValue={producto?.descripcion || ''} />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Precio Unitario ($)" name="precio_unitario" type="number" step="0.01" min="0" required defaultValue={producto?.precio_unitario} error={state?.errors?.precio_unitario?.[0]} />
						<GlassSelect label="Tarifa IVA" name="iva_codigo_porcentaje" required options={ivaOptions} defaultValue={producto?.iva_codigo_porcentaje || '2'} error={state?.errors?.iva_codigo_porcentaje?.[0]} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Código ICE" name="ice_codigo" defaultValue={producto?.ice_codigo || ''} />
						<GlassInput label="Tarifa ICE ($)" name="ice_tarifa" type="number" step="0.01" defaultValue={producto?.ice_tarifa || ''} />
					</div>
					<GlassInput label="Categoría" name="categoria" defaultValue={producto?.categoria || ''} />
				</GlassCard>

				<div className="flex justify-end mt-4 gap-2">
					<Link href="/productos"><GlassButton variant="ghost">Cancelar</GlassButton></Link>
					<GlassButton type="submit" loading={isPending} icon={Save} size="lg">Guardar</GlassButton>
				</div>
			</form>
		</div>
	);
}
