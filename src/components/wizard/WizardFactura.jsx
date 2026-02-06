'use client';

import { useFacturaWizard } from '@/hooks/useFacturaWizard';
import StepCliente from './StepCliente';
import StepDetalles from './StepDetalles';
import StepPagos from './StepPagos';
import StepResumen from './StepResumen';
import StepConfirmacion from './StepConfirmacion';
import GlassButton from '@/components/ui/GlassButton';
import GlassCard from '@/components/ui/GlassCard';
import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';

const PASOS = [
	{ titulo: 'Cliente', descripcion: 'Datos del comprador' },
	{ titulo: 'Detalles', descripcion: 'Productos o servicios' },
	{ titulo: 'Pagos', descripcion: 'Formas de pago' },
	{ titulo: 'Resumen', descripcion: 'Revisar factura' },
	{ titulo: 'Confirmar', descripcion: 'Enviar al SRI' },
];

export default function WizardFactura({ establecimientos, puntosEmision }) {
	const wizard = useFacturaWizard();
	const { paso, procesando, resultado } = wizard;

	const renderPaso = () => {
		switch (paso) {
			case 0:
				return (
					<StepCliente
						wizard={wizard}
						establecimientos={establecimientos}
						puntosEmision={puntosEmision}
					/>
				);
			case 1:
				return <StepDetalles wizard={wizard} />;
			case 2:
				return <StepPagos wizard={wizard} />;
			case 3:
				return <StepResumen wizard={wizard} />;
			case 4:
				return <StepConfirmacion wizard={wizard} />;
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Progress bar */}
			<GlassCard className="p-4" animate={false}>
				<div className="flex items-center justify-between mb-3">
					{PASOS.map((p, i) => (
						<div key={i} className="flex items-center flex-1">
							<div className="flex flex-col items-center">
								<div
									className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border transition-all duration-300 ${
										i <= paso
											? 'border-[var(--accent-primary)] text-[var(--btn-primary-text)]'
											: 'border-[var(--glass-border)] text-[var(--text-muted)]'
									}`}
									style={{
										background: i <= paso ? 'var(--accent-primary)' : 'var(--glass-bg)',
									}}
								>
									{i + 1}
								</div>
								<span className="text-[10px] mt-1 hidden sm:block" style={{ color: i <= paso ? 'var(--text-primary)' : 'var(--text-muted)' }}>
									{p.titulo}
								</span>
							</div>
							{i < PASOS.length - 1 && (
								<div
									className="flex-1 h-px mx-2"
									style={{
										background: i < paso ? 'var(--accent-primary)' : 'var(--glass-border)',
									}}
								/>
							)}
						</div>
					))}
				</div>
			</GlassCard>

			{/* Contenido del paso */}
			<GlassCard className="p-6">
				<div className="mb-4">
					<h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
						{PASOS[paso]?.titulo}
					</h2>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
						{PASOS[paso]?.descripcion}
					</p>
				</div>

				{renderPaso()}
			</GlassCard>

			{/* Navegación */}
			{!resultado && (
				<div className="flex items-center justify-between">
					<GlassButton
						variant="ghost"
						onClick={wizard.retroceder}
						disabled={paso === 0 || procesando}
						icon={ChevronLeft}
					>
						Anterior
					</GlassButton>

					{paso < 4 ? (
						<GlassButton
							onClick={wizard.avanzar}
							iconRight={ChevronRight}
						>
							Siguiente
						</GlassButton>
					) : (
						<GlassButton
							onClick={wizard.enviarFactura}
							loading={procesando}
							icon={procesando ? Loader2 : Send}
						>
							{procesando ? 'Procesando...' : 'Emitir Factura'}
						</GlassButton>
					)}
				</div>
			)}
		</div>
	);
}
