'use client';

import { useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { crearProducto } from '../actions';
import { TARIFAS_IVA } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function NuevoProductoPage() {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(crearProducto, null);

	useEffect(() => {
		if (state?.success) {
			toast.success('Producto creado exitosamente');
			router.push('/productos');
		}
		if (state?.error) toast.error(state.error);
	}, [state, router]);

	const ivaOptions = TARIFAS_IVA.map((t) => ({ value: t.value, label: t.label }));

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link href="/productos" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo Producto</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Agrega un producto o servicio al catálogo</p>
				</div>
			</div>

			{state?.error && <GlassAlert type="error" message={state.error} />}

			<form action={formAction}>
				<GlassCard className="p-6 space-y-5" hover={false} animate={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Código Principal" name="codigo_principal" placeholder="PROD-001" required error={state?.errors?.codigo_principal?.[0]} />
						<GlassInput label="Código Auxiliar" name="codigo_auxiliar" placeholder="Opcional" />
					</div>
					<GlassInput label="Nombre" name="nombre" placeholder="Nombre del producto o servicio" required error={state?.errors?.nombre?.[0]} />
					<GlassInput label="Descripción" name="descripcion" placeholder="Descripción (opcional)" />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Precio Unitario ($)" name="precio_unitario" type="number" step="0.01" min="0" placeholder="0.00" required error={state?.errors?.precio_unitario?.[0]} />
						<GlassSelect label="Tarifa IVA" name="iva_codigo_porcentaje" required options={ivaOptions} defaultValue="2" error={state?.errors?.iva_codigo_porcentaje?.[0]} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Código ICE" name="ice_codigo" placeholder="Si aplica" />
						<GlassInput label="Tarifa ICE ($)" name="ice_tarifa" type="number" step="0.01" placeholder="0.00" />
					</div>
					<GlassInput label="Categoría" name="categoria" placeholder="Categoría (opcional)" />
				</GlassCard>

				<div className="flex justify-end mt-4 gap-2">
					<Link href="/productos"><GlassButton variant="ghost">Cancelar</GlassButton></Link>
					<GlassButton type="submit" loading={isPending} icon={Save} size="lg">Crear Producto</GlassButton>
				</div>
			</form>
		</div>
	);
}
