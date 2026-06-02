import { NextResponse } from 'next/server';

export async function POST() {
	return NextResponse.json(
		{ error: 'El portal de facturacion esta deshabilitado temporalmente.' },
		{ status: 503 }
	);
}
