import Link from 'next/link';
import { Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export const metadata = {
	title: 'Pagos no disponibles — facturIA',
};

export default function SuscripcionSuccessPage() {
	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<GlassCard className="p-8 max-w-md text-center" hover={false}>
				<div
					className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
					style={{ background: 'var(--color-success-muted)' }}
				>
					<Clock className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
				</div>
				<h1 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
					Pagos disponibles muy pronto
				</h1>

				<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
					Stripe esta deshabilitado temporalmente. Por ahora solo esta disponible la capa gratuita.
				</p>

				<Link href="/suscripcion">
					<GlassButton className="w-full">
						Ver mi suscripcion
					</GlassButton>
				</Link>
			</GlassCard>
		</div>
	);
}
