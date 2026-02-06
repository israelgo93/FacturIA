'use client';

import { useEffect, useState, useActionState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { obtenerCliente, actualizarCliente } from '../actions';
import { TIPOS_IDENTIFICACION } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function EditarClientePage() {
	const router = useRouter();
	const params = useParams();
	const [cliente, setCliente] = useState(null);
	const [loading, setLoading] = useState(true);
	const [state, formAction, isPending] = useActionState(actualizarCliente, null);

	useEffect(() => {
		obtenerCliente(params.id).then((result) => {
			if (result.data) setCliente(result.data);
			else { toast.error('Cliente no encontrado'); router.push('/clientes'); }
			setLoading(false);
		});
	}, [params.id, router]);

	useEffect(() => {
		if (state?.success) {
			toast.success('Cliente actualizado');
			router.push('/clientes');
		}
		if (state?.error) toast.error(state.error);
	}, [state, router]);

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
				<Link href="/clientes" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Editar Cliente</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cliente?.razon_social}</p>
				</div>
			</div>

			{state?.error && <GlassAlert type="error" message={state.error} />}

			<form action={formAction}>
				<input type="hidden" name="id" value={cliente?.id} />
				<GlassCard className="p-6 space-y-5" hover={false} animate={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassSelect label="Tipo de Identificación" name="tipo_identificacion" required options={TIPOS_IDENTIFICACION} defaultValue={cliente?.tipo_identificacion} error={state?.errors?.tipo_identificacion?.[0]} />
						<GlassInput label="Identificación" name="identificacion" required defaultValue={cliente?.identificacion} error={state?.errors?.identificacion?.[0]} />
					</div>
					<GlassInput label="Razón Social" name="razon_social" required defaultValue={cliente?.razon_social} error={state?.errors?.razon_social?.[0]} />
					<GlassInput label="Dirección" name="direccion" defaultValue={cliente?.direccion || ''} />
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Email" name="email" type="email" defaultValue={cliente?.email || ''} />
						<GlassInput label="Teléfono" name="telefono" defaultValue={cliente?.telefono || ''} />
					</div>
				</GlassCard>

				<div className="flex justify-end mt-4 gap-2">
					<Link href="/clientes"><GlassButton variant="ghost">Cancelar</GlassButton></Link>
					<GlassButton type="submit" loading={isPending} icon={Save} size="lg">Guardar</GlassButton>
				</div>
			</form>
		</div>
	);
}
