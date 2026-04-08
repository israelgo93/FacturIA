'use client';

import Link from 'next/link';
import { Clock, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function TrialBanner({ diasRestantes, planNombre }) {
	if (diasRestantes === null || diasRestantes === undefined) return null;

	const esUrgente = diasRestantes <= 3;
	const expirado = diasRestantes <= 0;

	return (
		<GlassCard
			className="p-4"
			hover={false}
			animate={false}
			style={{
				borderColor: expirado
					? 'var(--glass-active)'
					: esUrgente
						? 'var(--glass-active)'
						: 'var(--glass-border)',
			}}
		>
			<div className="flex items-center justify-between gap-3 flex-wrap">
				<div className="flex items-center gap-2">
					{esUrgente ? (
						<AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
					) : (
						<Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
					)}
					<p className="text-sm" style={{ color: 'var(--text-primary)' }}>
						{expirado
							? 'Tu periodo de prueba ha expirado'
							: `Te quedan ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''} de tu trial ${planNombre || ''}`
						}
					</p>
				</div>
				<Link
					href="/suscripcion"
					className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
					style={{
						background: 'var(--btn-primary-bg)',
						color: 'var(--btn-primary-text)',
					}}
				>
					{expirado ? 'Elegir plan' : 'Ver planes'}
				</Link>
			</div>
		</GlassCard>
	);
}
