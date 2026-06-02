'use client';

import { X, ArrowUpCircle } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';

export default function UpgradeModal({ open, onClose, feature, planRequerido = 'Professional' }) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			style={{ background: 'var(--modal-overlay)' }}
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-sm rounded-2xl p-6"
				style={{
					background: 'var(--sidebar-bg)',
					border: '1px solid var(--divider)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
					style={{ color: 'var(--text-muted)' }}
				>
					<X className="w-4 h-4" />
				</button>

				<ArrowUpCircle className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
				<h3 className="text-lg font-medium text-center mb-2" style={{ color: 'var(--text-primary)' }}>
					Plan disponible muy pronto
				</h3>
				<p className="text-sm text-center mb-6" style={{ color: 'var(--text-muted)' }}>
					{feature} estara disponible en el plan {planRequerido}. Por ahora solo esta activa la capa gratuita.
				</p>
				<div className="flex gap-2">
					<GlassButton variant="secondary" className="flex-1" onClick={onClose}>
						Entendido
					</GlassButton>
					<GlassButton variant="primary" className="flex-1" disabled>
						Muy pronto
					</GlassButton>
				</div>
			</div>
		</div>
	);
}
