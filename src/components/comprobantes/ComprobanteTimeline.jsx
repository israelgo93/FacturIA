'use client';

import { CheckCircle, Circle, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const PASOS_TIMELINE = [
	{ estado: 'draft', label: 'Creado', descripcion: 'Borrador' },
	{ estado: 'signed', label: 'Firmado', descripcion: 'XML firmado con XAdES-BES' },
	{ estado: 'sent', label: 'Enviado', descripcion: 'Enviado al WS del SRI' },
	{ estado: 'AUT', label: 'Autorizado', descripcion: 'Autorizado por el SRI' },
];

const ORDEN_ESTADOS = { draft: 0, CREADO: 0, signed: 1, sent: 2, PPR: 2, AUT: 3, NAT: 3, DEV: 2, voided: -1 };

export default function ComprobanteTimeline({ estado, fechaAutorizacion }) {
	const pasoActual = ORDEN_ESTADOS[estado] ?? 0;
	const esError = estado === 'NAT' || estado === 'DEV';
	const esAnulado = estado === 'voided';

	if (esAnulado) {
		return (
			<GlassCard className="p-4" animate={false}>
				<div className="flex items-center gap-2">
					<Circle className="w-4 h-4" style={{ color: '#6b7280' }} />
					<span className="text-sm" style={{ color: '#6b7280' }}>Comprobante anulado</span>
				</div>
			</GlassCard>
		);
	}

	return (
		<GlassCard className="p-4" animate={false}>
			<div className="flex items-center gap-0">
				{PASOS_TIMELINE.map((paso, i) => {
					const completado = pasoActual > i;
					const actual = pasoActual === i;
					const errorEnPaso = esError && actual;

					return (
						<div key={i} className="flex items-center flex-1">
							<div className="flex flex-col items-center">
								{completado ? (
									<CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
								) : actual ? (
									<Clock className="w-5 h-5" style={{ color: errorEnPaso ? '#ef4444' : '#f59e0b' }} />
								) : (
									<Circle className="w-5 h-5" style={{ color: 'var(--text-disabled)' }} />
								)}
								<span className="text-[10px] mt-1 text-center" style={{
									color: completado ? '#10b981' : actual ? (errorEnPaso ? '#ef4444' : 'var(--text-primary)') : 'var(--text-disabled)',
								}}>
									{paso.label}
								</span>
							</div>
							{i < PASOS_TIMELINE.length - 1 && (
								<div className="flex-1 h-px mx-1" style={{
									background: completado ? '#10b981' : 'var(--glass-border)',
								}} />
							)}
						</div>
					);
				})}
			</div>
		</GlassCard>
	);
}
