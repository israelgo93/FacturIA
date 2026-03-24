import Stripe from 'stripe';

let _stripe = null;

export function getStripe() {
	if (!_stripe) {
		if (!process.env.STRIPE_SECRET_KEY) {
			throw new Error('STRIPE_SECRET_KEY no configurada');
		}
		_stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
			apiVersion: '2024-12-18.acacia',
		});
	}
	return _stripe;
}

export async function crearCheckoutSession({ empresaId, planId, stripePriceId, email, returnUrl }) {
	const session = await getStripe().checkout.sessions.create({
		mode: 'subscription',
		payment_method_types: ['card'],
		customer_email: email,
		line_items: [{ price: stripePriceId, quantity: 1 }],
		success_url: `${returnUrl}/suscripcion/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${returnUrl}/suscripcion`,
		metadata: { empresaId, planId },
		subscription_data: {
			metadata: { empresaId, planId },
		},
	});
	return session;
}

export async function crearBillingPortal({ stripeCustomerId, returnUrl }) {
	const session = await getStripe().billingPortal.sessions.create({
		customer: stripeCustomerId,
		return_url: `${returnUrl}/suscripcion`,
	});
	return session;
}
