import { NextResponse } from 'next/server';

export async function POST() {
	return NextResponse.json(
		{ error: 'Los pagos estan deshabilitados temporalmente. Los planes pagos estaran disponibles muy pronto.' },
		{ status: 503 }
	);
}
