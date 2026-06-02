import { NextResponse } from 'next/server';

export async function POST() {
	return NextResponse.json(
		{ received: false, error: 'Stripe esta deshabilitado temporalmente.' },
		{ status: 503 }
	);
}
