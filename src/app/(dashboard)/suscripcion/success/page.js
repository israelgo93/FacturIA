import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { getStripe } from '@/lib/stripe/stripe-client';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';

export const metadata = {
	title: 'Pago exitoso — facturIA',
};

async function obtenerDetallesSesion(sessionId) {
	if (!sessionId) return null;
	try {
		const session = await getStripe().checkout.sessions.retrieve(sessionId, {
			expand: ['subscription', 'subscription.items.data.price.product'],
		});
		const subscription = session.subscription;
		const item = subscription?.items?.data?.[0];
		const product = item?.price?.product;
		const price = item?.price;

		return {
			planNombre: product?.name || 'Plan',
			planDescripcion: product?.description || '',
			monto: price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : null,
			moneda: price?.currency?.toUpperCase() || 'USD',
			intervalo: price?.recurring?.interval === 'month' ? 'mes' : 'anio',
			email: session.customer_email || session.customer_details?.email || '',
		};
	} catch {
		return null;
	}
}

export default async function SuscripcionSuccessPage({ searchParams }) {
	const params = await searchParams;
	const detalles = await obtenerDetallesSesion(params?.session_id);

	return (
		<div className="flex items-center justify-center min-h-[60vh]">
			<GlassCard className="p-8 max-w-md text-center" hover={false}>
				<div
					className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
					style={{ background: 'var(--color-success-muted)' }}
				>
					<CheckCircle className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
				</div>
				<h1 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
					Pago exitoso
				</h1>

				{detalles ? (
					<div className="space-y-3 mb-6">
						<div
							className="rounded-xl px-4 py-3 mx-auto"
							style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
						>
							<p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
								{detalles.planNombre}
							</p>
							{detalles.monto && (
								<p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
									${detalles.monto} / {detalles.intervalo}
								</p>
							)}
						</div>
						{detalles.planDescripcion && (
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
								{detalles.planDescripcion}
							</p>
						)}
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
							Tu suscripcion ha sido activada. Ya puedes disfrutar de todas las funciones de tu plan.
						</p>
					</div>
				) : (
					<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
						Tu suscripcion ha sido activada. Ya puedes disfrutar de todas las funciones de tu plan.
					</p>
				)}

				<Link href="/suscripcion">
					<GlassButton className="w-full">
						Ver mi suscripcion
					</GlassButton>
				</Link>
			</GlassCard>
		</div>
	);
}
