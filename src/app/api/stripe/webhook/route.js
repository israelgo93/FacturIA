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
	const stripe = getStripe();

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			const { empresaId } = session.metadata;
			if (!empresaId) break;

			const updateData = {
				stripe_customer_id: session.customer,
				stripe_subscription_id: session.subscription,
				estado: 'activa',
				fecha_inicio: new Date().toISOString(),
				trial_ends_at: null,
			};

			if (session.subscription) {
				try {
					const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
					const priceId = stripeSub.items?.data?.[0]?.price?.id || null;
					updateData.stripe_price_id = priceId;

					if (stripeSub.current_period_start) {
						updateData.current_period_start = new Date(stripeSub.current_period_start * 1000).toISOString();
					}
					if (stripeSub.current_period_end) {
						updateData.current_period_end = new Date(stripeSub.current_period_end * 1000).toISOString();
					}

					if (stripeSub.status === 'trialing') {
						updateData.estado = 'trial';
						if (stripeSub.trial_end) {
							updateData.trial_ends_at = new Date(stripeSub.trial_end * 1000).toISOString();
						}
					}

					if (priceId) {
						const { data: plan } = await supabase
							.from('planes')
							.select('id')
							.eq('stripe_price_id', priceId)
							.maybeSingle();
						if (plan) updateData.plan_id = plan.id;
					}
				} catch (err) {
					console.error('Error retrieving Stripe subscription:', err.message);
				}
			}

			await supabase.from('suscripciones').update(updateData).eq('empresa_id', empresaId);
			break;
		}

		case 'customer.subscription.updated': {
			const subscription = event.data.object;
			const { empresaId } = subscription.metadata;
			if (!empresaId) break;

			const priceId = subscription.items?.data?.[0]?.price?.id || null;
			let estado = 'suspendida';
			if (subscription.status === 'active') estado = 'activa';
			else if (subscription.status === 'trialing') estado = 'trial';

			const updateData = {
				estado,
				cancel_at_period_end: subscription.cancel_at_period_end,
				stripe_price_id: priceId,
			};

			if (subscription.current_period_start) {
				updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
			}
			if (subscription.current_period_end) {
				updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
			}
			if (subscription.trial_end && subscription.status === 'trialing') {
				updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
			}

			if (priceId) {
				const { data: plan } = await supabase
					.from('planes')
					.select('id')
					.eq('stripe_price_id', priceId)
					.maybeSingle();
				if (plan) updateData.plan_id = plan.id;
			}

			await supabase.from('suscripciones').update(updateData).eq('empresa_id', empresaId);
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
