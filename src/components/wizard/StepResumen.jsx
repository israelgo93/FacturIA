'use client';

import GlassCard from '@/components/ui/GlassCard';
import { FORMAS_PAGO, TIPOS_IDENTIFICACION, TARIFAS_IVA } from '@/lib/utils/sri-catalogs';
import { User, Package, CreditCard, FileText } from 'lucide-react';

export default function StepResumen({ wizard }) {
	const totales = wizard.getTotales();
	const tipoId = TIPOS_IDENTIFICACION.find((t) => t.value === wizard.cliente.tipoIdentificacionComprador);

	return (
		<div className="space-y-4">
			{/* Datos del comprador */}
			<div className="p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
				<div className="flex items-center gap-2 mb-3">
					<User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
					<span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
						Comprador
					</span>
				</div>
				<div className="space-y-1 text-sm">
					<p style={{ color: 'var(--text-primary)' }} className="font-medium">
						{wizard.cliente.razonSocialComprador}
					</p>
					<p style={{ color: 'var(--text-secondary)' }}>
						{tipoId?.label}: {wizard.cliente.identificacionComprador}
					</p>
					{wizard.cliente.direccionComprador && (
						<p style={{ color: 'var(--text-muted)' }}>{wizard.cliente.direccionComprador}</p>
					)}
					{wizard.cliente.emailComprador && (
						<p style={{ color: 'var(--text-muted)' }}>{wizard.cliente.emailComprador}</p>
					)}
				</div>
			</div>

			{/* Detalles */}
			<div className="p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
				<div className="flex items-center gap-2 mb-3">
					<Package className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
					<span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
						Detalle ({wizard.detalles.length} {wizard.detalles.length === 1 ? 'item' : 'items'})
					</span>
				</div>
				<div className="space-y-2">
					{wizard.detalles.map((det, i) => {
						const tarifaObj = TARIFAS_IVA.find((t) => t.value === det.impuestos?.[0]?.codigoPorcentaje);
						return (
							<div key={i} className="flex items-center justify-between text-sm">
								<div className="flex-1 min-w-0">
									<span style={{ color: 'var(--text-primary)' }}>{det.descripcion}</span>
									<span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
										{det.cantidad} x ${Number(det.precioUnitario).toFixed(2)}
										{tarifaObj ? ` (IVA ${tarifaObj.label})` : ''}
									</span>
								</div>
								<span className="font-mono ml-3" style={{ color: 'var(--text-primary)' }}>
									${Number(det.precioTotalSinImpuesto).toFixed(2)}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Pagos */}
			<div className="p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
				<div className="flex items-center gap-2 mb-3">
					<CreditCard className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
					<span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
						Formas de Pago
					</span>
				</div>
				{wizard.pagos.map((pago, i) => {
					const fp = FORMAS_PAGO.find((f) => f.value === pago.formaPago);
					return (
						<div key={i} className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
							<span>{fp?.label || pago.formaPago}</span>
							<span className="font-mono">${Number(pago.total).toFixed(2)}</span>
						</div>
					);
				})}
			</div>

			{/* Totales */}
			<div className="p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
				<div className="flex items-center gap-2 mb-3">
					<FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
					<span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
						Totales
					</span>
				</div>
				<div className="space-y-1.5 text-sm">
					<div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
						<span>Subtotal sin impuestos</span>
						<span className="font-mono">${totales.subtotalSinImpuestos.toFixed(2)}</span>
					</div>
					{totales.totalDescuento > 0 && (
						<div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
							<span>Descuento</span>
							<span className="font-mono">-${totales.totalDescuento.toFixed(2)}</span>
						</div>
					)}
					<div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
						<span>IVA</span>
						<span className="font-mono">${totales.totalIva.toFixed(2)}</span>
					</div>
					<div className="flex justify-between font-medium pt-2 border-t text-base" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
						<span>TOTAL</span>
						<span className="font-mono">${totales.importeTotal.toFixed(2)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
