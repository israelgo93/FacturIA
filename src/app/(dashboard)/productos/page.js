'use client';

import { Package, Plus } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';
import EmptyState from '@/components/shared/EmptyState';

export default function ProductosPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium text-white/90">Productos</h1>
					<p className="text-white/25 text-xs mt-1">Catálogo de productos y servicios</p>
				</div>
				<GlassButton icon={Plus} size="sm">Nuevo Producto</GlassButton>
			</div>
			<EmptyState
				icon={Package}
				title="Sin productos"
				description="Crea tu catálogo con configuración de impuestos."
				actionLabel="Agregar Producto"
			/>
		</div>
	);
}
