'use client';

import { Users, Plus } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import EmptyState from '@/components/shared/EmptyState';

export default function ClientesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium text-white/90">Clientes</h1>
					<p className="text-white/25 text-xs mt-1">Gestiona tu cartera de clientes</p>
				</div>
				<GlassButton icon={Plus} size="sm">Nuevo Cliente</GlassButton>
			</div>
			<EmptyState
				icon={Users}
				title="Sin clientes"
				description="Agrega tu primer cliente para emitir comprobantes."
				actionLabel="Agregar Cliente"
			/>
		</div>
	);
}
