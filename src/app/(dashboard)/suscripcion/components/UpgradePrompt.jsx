'use client';

import Link from 'next/link';
import { ArrowUpCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export default function UpgradePrompt({ feature, planRequerido = 'Professional' }) {
	return (
		<GlassCard className="p-8 text-center max-w-md mx-auto" hover={false}>
			<ArrowUpCircle className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
			<h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
				Funcion no disponible
			</h3>
			<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
				{feature} esta disponible en el plan {planRequerido} o superior.
				Actualiza tu suscripcion para acceder.
			</p>
			<Link href="/suscripcion">
				<GlassButton variant="primary">
					Ver planes
				</GlassButton>
			</Link>
		</GlassCard>
	);
}
