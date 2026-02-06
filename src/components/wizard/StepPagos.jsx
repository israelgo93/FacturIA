'use client';

import GlassSelect from '@/components/ui/GlassSelect';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import { FORMAS_PAGO } from '@/lib/utils/sri-catalogs';
import { Plus, Trash2, CreditCard } from 'lucide-react';

export default function StepPagos({ wizard }) {
	const totales = wizard.getTotales();

	const actualizarPago = (index, campo, valor) => {
		const pagosActualizados = wizard.pagos.map((p, i) =>
			i === index ? { ...p, [campo]: valor } : p
		);
		wizard.setPagos(pagosActualizados);
	};

	const agregarPago = () => {
		wizard.agregarPago({ formaPago: '01', total: 0, plazo: null, unidadTiempo: 'dias' });
	};

	// Establecer total automáticamente si solo hay un pago
	if (wizard.pagos.length === 1 && wizard.pagos[0].total !== totales.importeTotal) {
		wizard.setPagos([{ ...wizard.pagos[0], total: totales.importeTotal }]);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
					<CreditCard className="w-4 h-4" />
					<span className="text-sm">Total a pagar: <strong className="font-mono">${totales.importeTotal.toFixed(2)}</strong></span>
				</div>
				<GlassButton variant="ghost" size="sm" icon={Plus} onClick={agregarPago}>
					Agregar
				</GlassButton>
			</div>

			{wizard.pagos.map((pago, i) => (
				<div
					key={i}
					className="p-4 rounded-xl border space-y-3"
					style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}
				>
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
							Pago {i + 1}
						</span>
						{wizard.pagos.length > 1 && (
							<button
								onClick={() => wizard.eliminarPago(i)}
								className="p-1 rounded-lg transition-colors"
								style={{ color: 'var(--text-muted)' }}
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<GlassSelect
							label="Forma de pago"
							value={pago.formaPago}
							onChange={(e) => actualizarPago(i, 'formaPago', e.target.value)}
						>
							{FORMAS_PAGO.map((fp) => (
								<option key={fp.value} value={fp.value}>{fp.label}</option>
							))}
						</GlassSelect>

						<GlassInput
							label="Total"
							type="number"
							min="0"
							step="0.01"
							value={pago.total}
							onChange={(e) => actualizarPago(i, 'total', Number(e.target.value))}
						/>

						<GlassInput
							label="Plazo (días)"
							type="number"
							min="0"
							placeholder="0"
							value={pago.plazo || ''}
							onChange={(e) => actualizarPago(i, 'plazo', e.target.value ? Number(e.target.value) : null)}
						/>
					</div>
				</div>
			))}
		</div>
	);
}
