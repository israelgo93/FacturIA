'use client';

import { useEffect, useActionState } from 'react';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { importarClientesCSV } from '../actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function ImportarClientesPage() {
	const [state, formAction, isPending] = useActionState(importarClientesCSV, null);

	useEffect(() => {
		if (state?.success) {
			toast.success(`${state.importados} clientes importados`);
		}
		if (state?.error) toast.error(state.error);
	}, [state]);

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link href="/clientes" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Importar Clientes</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Importa clientes desde un archivo CSV</p>
				</div>
			</div>

			<GlassCard className="p-6" hover={false} animate={false}>
				<div className="flex items-center gap-3 mb-5">
					<FileText className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
					<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Formato del CSV</h3>
				</div>
				<div className="p-4 rounded-xl mb-5 font-mono text-xs" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
					tipo_identificacion,identificacion,razon_social,direccion,email,telefono<br />
					04,1790012345001,Empresa ABC,Quito,info@abc.com,0991234567<br />
					05,1712345678,Juan Pérez,Guayaquil,juan@email.com,0981234567
				</div>

				{state?.error && <GlassAlert type="error" message={state.error} className="mb-4" />}

				{state?.success && (
					<GlassAlert
						type="success"
						title={`${state.importados} clientes importados`}
						message={state.errores?.length > 0 ? `${state.errores.length} filas con errores` : 'Todos los registros importados correctamente'}
						className="mb-4"
					/>
				)}

				{state?.errores?.length > 0 && (
					<div className="mb-4 max-h-40 overflow-y-auto">
						{state.errores.map((err, i) => (
							<p key={i} className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>
								Fila {err.fila}: {err.error}
							</p>
						))}
					</div>
				)}

				<form action={formAction}>
					<div className="mb-4">
						<label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
							Archivo CSV *
						</label>
						<input type="file" name="archivo" accept=".csv" required className="w-full text-sm" style={{ color: 'var(--text-secondary)' }} />
					</div>
					<GlassButton type="submit" loading={isPending} icon={Upload} size="lg" className="w-full">
						Importar
					</GlassButton>
				</form>
			</GlassCard>
		</div>
	);
}
