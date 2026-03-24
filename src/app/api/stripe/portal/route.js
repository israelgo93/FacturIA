import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crearBillingPortal } from '@/lib/stripe/stripe-client';

export async function POST(req) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) {
		return NextResponse.json({ error: 'Empresa no configurada' }, { status: 400 });
	}

	const { data: suscripcion } = await supabase
		.from('suscripciones')
		.select('stripe_customer_id')
		.eq('empresa_id', empresa.id)
		.maybeSingle();

	if (!suscripcion?.stripe_customer_id) {
		return NextResponse.json({ error: 'Sin suscripcion Stripe activa' }, { status: 400 });
	}

	const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

	const session = await crearBillingPortal({
		stripeCustomerId: suscripcion.stripe_customer_id,
		returnUrl: origin,
	});

	return NextResponse.json({ url: session.url });
}
