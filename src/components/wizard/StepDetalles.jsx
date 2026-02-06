'use client';

import { useState } from 'react';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import GlassSelect from '@/components/ui/GlassSelect';
import { TARIFAS_IVA } from '@/lib/utils/sri-catalogs';
import { Plus, Trash2, Package, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calcularSubtotalDetalle, calcularValorImpuesto } from '@/lib/sri/validators';

export default function StepDetalles({ wizard }) {
	const [busqueda, setBusqueda] = useState('');
	const [productosBusqueda, setProductosBusqueda] = useState([]);

	const buscarProductos = async (termino) => {
		if (termino.length < 2) { setProductosBusqueda([]); return; }
		const supabase = createClient();
		const { data } = await supabase
			.from('productos')
			.select('id, codigo_principal, nombre, precio_unitario, iva_codigo_porcentaje')
			.or(`nombre.ilike.%${termino}%,codigo_principal.ilike.%${termino}%`)
			.eq('activo', true)
			.limit(8);
		setProductosBusqueda(data || []);
	};

	const agregarProducto = (prod) => {
		const tarifaObj = TARIFAS_IVA.find((t) => t.value === prod.iva_codigo_porcentaje);
		const tarifa = tarifaObj?.tarifa || 0;
		const precio = Number(prod.precio_unitario);
		const base = precio;
		const iva = calcularValorImpuesto(base, tarifa);

		wizard.agregarDetalle({
			productoId: prod.id,
			codigoPrincipal: prod.codigo_principal,
			descripcion: prod.nombre,
			cantidad: 1,
			precioUnitario: precio,
			descuento: 0,
			precioTotalSinImpuesto: base,
			impuestos: [{
				codigo: '2',
				codigoPorcentaje: prod.iva_codigo_porcentaje,
				tarifa,
				baseImponible: base,
				valor: Number(iva.toFixed(2)),
			}],
		});
		setBusqueda('');
		setProductosBusqueda([]);
	};

	const actualizarCantidad = (index, cantidad) => {
		const det = wizard.detalles[index];
		const cant = Number(cantidad) || 0;
		const base = calcularSubtotalDetalle(cant, det.precioUnitario, det.descuento);
		const impuestos = det.impuestos.map((imp) => ({
			...imp,
			baseImponible: base,
			valor: Number(calcularValorImpuesto(base, imp.tarifa).toFixed(2)),
		}));
		wizard.actualizarDetalle(index, { cantidad: cant, precioTotalSinImpuesto: base, impuestos });
	};

	const actualizarPrecio = (index, precio) => {
		const det = wizard.detalles[index];
		const pr = Number(precio) || 0;
		const base = calcularSubtotalDetalle(det.cantidad, pr, det.descuento);
		const impuestos = det.impuestos.map((imp) => ({
			...imp,
			baseImponible: base,
			valor: Number(calcularValorImpuesto(base, imp.tarifa).toFixed(2)),
		}));
		wizard.actualizarDetalle(index, { precioUnitario: pr, precioTotalSinImpuesto: base, impuestos });
	};

	const totales = wizard.getTotales();

	return (
		<div className="space-y-4">
			{/* Buscador de productos */}
			<div className="relative">
				<GlassInput
					icon={Search}
					placeholder="Buscar producto por nombre o código..."
					value={busqueda}
					onChange={(e) => { setBusqueda(e.target.value); buscarProductos(e.target.value); }}
				/>
				{productosBusqueda.length > 0 && (
					<div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden border" style={{ background: 'var(--modal-bg)', borderColor: 'var(--glass-border)' }}>
						{productosBusqueda.map((prod) => (
							<button
								key={prod.id}
								className="w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between"
								style={{ color: 'var(--text-primary)' }}
								onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
								onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
								onClick={() => agregarProducto(prod)}
							>
								<div className="flex items-center gap-3">
									<Package className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
									<div>
										<div className="font-medium">{prod.nombre}</div>
										<div className="text-xs" style={{ color: 'var(--text-muted)' }}>{prod.codigo_principal}</div>
									</div>
								</div>
								<span className="font-mono text-xs">${Number(prod.precio_unitario).toFixed(2)}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Lista de detalles */}
			{wizard.detalles.length === 0 ? (
				<div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
					<Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
					<p className="text-sm">Busque y agregue productos</p>
				</div>
			) : (
				<div className="space-y-3">
					{wizard.detalles.map((det, i) => (
						<div
							key={i}
							className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3"
							style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
						>
							<div className="flex-1 min-w-0">
								<div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
									{det.descripcion}
								</div>
								<div className="text-xs" style={{ color: 'var(--text-muted)' }}>{det.codigoPrincipal}</div>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="number"
									min="1"
									step="1"
									value={det.cantidad}
									onChange={(e) => actualizarCantidad(i, e.target.value)}
									className="w-16 px-2 py-1 text-sm text-center rounded-lg border"
									style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
								/>
								<span className="text-xs" style={{ color: 'var(--text-muted)' }}>x</span>
								<input
									type="number"
									min="0"
									step="0.01"
									value={det.precioUnitario}
									onChange={(e) => actualizarPrecio(i, e.target.value)}
									className="w-24 px-2 py-1 text-sm text-right rounded-lg border"
									style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
								/>
								<span className="text-sm font-mono w-20 text-right" style={{ color: 'var(--text-primary)' }}>
									${Number(det.precioTotalSinImpuesto).toFixed(2)}
								</span>
								<button
									onClick={() => wizard.eliminarDetalle(i)}
									className="p-1.5 rounded-lg transition-colors"
									style={{ color: 'var(--text-muted)' }}
									onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
									onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Totales */}
			{wizard.detalles.length > 0 && (
				<div className="pt-3 border-t space-y-1 text-sm" style={{ borderColor: 'var(--glass-border)' }}>
					<div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
						<span>Subtotal</span>
						<span className="font-mono">${totales.subtotalSinImpuestos.toFixed(2)}</span>
					</div>
					<div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
						<span>IVA</span>
						<span className="font-mono">${totales.totalIva.toFixed(2)}</span>
					</div>
					<div className="flex justify-between font-medium pt-1 border-t" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
						<span>Total</span>
						<span className="font-mono">${totales.importeTotal.toFixed(2)}</span>
					</div>
				</div>
			)}
		</div>
	);
}
