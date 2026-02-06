'use client';

import { useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { crearCliente } from '../actions';
import { TIPOS_IDENTIFICACION } from '@/lib/utils/sri-catalogs';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function NuevoClientePage() {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(crearCliente, null);

	useEffect(() => {
		if (state?.success) {
			toast.success('Cliente creado exitosamente');
			router.push('/clientes');
		}
		if (state?.error) toast.error(state.error);
	}, [state, router]);

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link href="/clientes" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo Cliente</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Registra un nuevo cliente o receptor</p>
				</div>
			</div>

			{state?.error && <GlassAlert type="error" message={state.error} />}

			<form action={formAction}>
				<GlassCard className="p-6 space-y-5" hover={false} animate={false}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassSelect
							label="Tipo de Identificación"
							name="tipo_identificacion"
							required
							options={TIPOS_IDENTIFICACION}
							error={state?.errors?.tipo_identificacion?.[0]}
						/>
						<GlassInput
							label="Identificación"
							name="identificacion"
							placeholder="Número de identificación"
							required
							error={state?.errors?.identificacion?.[0]}
						/>
					</div>
					<GlassInput
						label="Razón Social"
						name="razon_social"
						placeholder="Nombre o razón social del cliente"
						required
						error={state?.errors?.razon_social?.[0]}
					/>
					<GlassInput
						label="Dirección"
						name="direccion"
						placeholder="Dirección (opcional)"
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<GlassInput label="Email" name="email" type="email" placeholder="correo@cliente.com" />
						<GlassInput label="Teléfono" name="telefono" placeholder="0991234567" />
					</div>
				</GlassCard>

				<div className="flex justify-end mt-4 gap-2">
					<Link href="/clientes"><GlassButton variant="ghost">Cancelar</GlassButton></Link>
					<GlassButton type="submit" loading={isPending} icon={Save} size="lg">Crear Cliente</GlassButton>
				</div>
			</form>
		</div>
	);
}
