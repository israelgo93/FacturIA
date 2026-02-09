import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import WizardFactura from '@/components/wizard/WizardFactura';

export default async function NuevaFacturaPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect('/login');

	// Obtener empresa
	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (!empresa) redirect('/onboarding');

	// Obtener establecimientos y puntos de emisión activos
	const { data: establecimientos } = await supabase
		.from('establecimientos')
		.select('id, codigo, direccion, nombre_comercial')
		.eq('empresa_id', empresa.id)
		.eq('activo', true)
		.order('codigo');

	const { data: puntosEmision } = await supabase
		.from('puntos_emision')
		.select('id, codigo, descripcion, establecimiento_id')
		.eq('empresa_id', empresa.id)
		.eq('activo', true)
		.order('codigo');

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			<div className="flex items-center gap-3">
				<Link
					href="/comprobantes"
					className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-300"
					style={{ color: 'var(--btn-ghost-text)' }}
				>
					<ArrowLeft className="w-4 h-4" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
						Nueva Factura
					</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
						Complete los datos para emitir una factura electrónica
					</p>
				</div>
			</div>

			<WizardFactura
				establecimientos={establecimientos || []}
				puntosEmision={puntosEmision || []}
			/>
		</div>
	);
}
