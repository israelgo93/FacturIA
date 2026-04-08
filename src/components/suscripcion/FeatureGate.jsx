'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

/**
 * Wrapper que bloquea la UI si la feature no esta disponible en el plan.
 * @param {{ allowed: boolean, children: React.ReactNode, featureName?: string, planRequerido?: string }} props
 */
export default function FeatureGate({ allowed, children, featureName, planRequerido = 'Professional' }) {
	if (allowed) return children;

	return (
		<GlassCard className="p-8 text-center" hover={false}>
			<Lock className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
			<p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
				{featureName || 'Esta funcion'} requiere un plan superior
			</p>
			<p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
				Disponible en plan {planRequerido} o superior
			</p>
			<Link
				href="/suscripcion"
				className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium transition-colors"
				style={{
					background: 'var(--btn-primary-bg)',
					color: 'var(--btn-primary-text)',
				}}
			>
				Ver planes
			</Link>
		</GlassCard>
	);
}
