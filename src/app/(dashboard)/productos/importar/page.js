'use client';

import { useEffect, useActionState } from 'react';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { importarProductosCSV } from '../actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function ImportarProductosPage() {
	const [state, formAction, isPending] = useActionState(importarProductosCSV, null);

	useEffect(() => {
		if (state?.success) toast.success(`${state.importados} productos importados`);
		if (state?.error) toast.error(state.error);
	}, [state]);

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link href="/productos" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Importar Productos</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Importa productos desde un archivo CSV</p>
				</div>
			</div>

			<GlassCard className="p-6" hover={false} animate={false}>
				<div className="flex items-center gap-3 mb-5">
					<FileText className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
					<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Formato del CSV</h3>
				</div>
				<div className="p-4 rounded-xl mb-5 font-mono text-xs" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
					codigo_principal,nombre,descripcion,precio_unitario,iva_codigo_porcentaje,categoria<br />
					PROD-001,Servicio de consultoría,Asesoría tributaria,50.00,2,Servicios<br />
					PROD-002,Papel bond A4,Resma 500 hojas,4.50,2,Suministros
				</div>

				{state?.error && <GlassAlert type="error" message={state.error} className="mb-4" />}

				{state?.success && (
					<GlassAlert
						type="success"
						title={`${state.importados} productos importados`}
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
