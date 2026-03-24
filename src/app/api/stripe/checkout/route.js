import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { crearCheckoutSession } from '@/lib/stripe/stripe-client';
import { getStripePriceId } from '@/lib/stripe/pricing';

export async function POST(req) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
	}

	const { planSlug } = await req.json();
	const stripePriceId = getStripePriceId(planSlug);
	if (!stripePriceId) {
		return NextResponse.json({ error: 'Plan no valido' }, { status: 400 });
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) {
		return NextResponse.json({ error: 'Empresa no configurada' }, { status: 400 });
	}

	const { data: plan } = await supabase
		.from('planes')
		.select('id')
		.eq('slug', planSlug)
		.maybeSingle();

	const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL;

	const session = await crearCheckoutSession({
		empresaId: empresa.id,
		planId: plan?.id || planSlug,
		stripePriceId,
		email: user.email,
		returnUrl: origin,
	});

	return NextResponse.json({ url: session.url });
}
