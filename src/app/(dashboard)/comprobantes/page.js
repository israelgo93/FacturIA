'use client';

import { FileText, Plus } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import EmptyState from '@/components/shared/EmptyState';

export default function ComprobantesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium text-white/90">Comprobantes</h1>
					<p className="text-white/25 text-xs mt-1">Gestiona tus comprobantes electrónicos</p>
				</div>
				<GlassButton icon={Plus} size="sm">Nueva Factura</GlassButton>
			</div>
			<EmptyState
				icon={FileText}
				title="Sin comprobantes"
				description="Aún no has emitido ningún comprobante electrónico."
				actionLabel="Crear Factura"
			/>
		</div>
	);
}
