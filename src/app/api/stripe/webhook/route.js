import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-client';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req) {
	const body = await req.text();
	const sig = req.headers.get('stripe-signature');

	let event;
	try {
		event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Stripe webhook signature verification failed:', err.message);
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
	}

	const supabase = createAdminClient();

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			const { empresaId } = session.metadata;
			if (!empresaId) break;

			await supabase.from('suscripciones').update({
				stripe_customer_id: session.customer,
				stripe_subscription_id: session.subscription,
				estado: 'activa',
				fecha_inicio: new Date().toISOString(),
			}).eq('empresa_id', empresaId);
			break;
		}

		case 'customer.subscription.updated': {
			const subscription = event.data.object;
			const { empresaId } = subscription.metadata;
			if (!empresaId) break;

			await supabase.from('suscripciones').update({
				estado: subscription.status === 'active' ? 'activa' : 'suspendida',
				current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
				current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
				cancel_at_period_end: subscription.cancel_at_period_end,
			}).eq('empresa_id', empresaId);
			break;
		}

		case 'customer.subscription.deleted': {
			const subscription = event.data.object;
			const { empresaId } = subscription.metadata;
			if (!empresaId) break;

			await supabase.from('suscripciones').update({
				estado: 'cancelada',
			}).eq('empresa_id', empresaId);
			break;
		}

		default:
			break;
	}

	return NextResponse.json({ received: true });
}
