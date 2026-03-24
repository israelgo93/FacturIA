import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) {
		return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
	}

	const { token } = await req.json();
	if (!token) {
		return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
	}

	const { data: invitacion } = await supabase
		.from('invitaciones')
		.select('*')
		.eq('token', token)
		.eq('estado', 'pendiente')
		.maybeSingle();

	if (!invitacion) {
		return NextResponse.json({ error: 'Invitacion no encontrada o expirada' }, { status: 404 });
	}

	if (new Date(invitacion.expires_at) < new Date()) {
		await supabase
			.from('invitaciones')
			.update({ estado: 'expirada' })
			.eq('id', invitacion.id);
		return NextResponse.json({ error: 'Invitacion expirada' }, { status: 410 });
	}

	const { error: perfilError } = await supabase
		.from('perfiles_empresa')
		.insert({
			user_id: user.id,
			empresa_id: invitacion.empresa_id,
			rol: invitacion.rol,
		});

	if (perfilError) {
		if (perfilError.code === '23505') {
			return NextResponse.json({ error: 'Ya eres miembro de esta empresa' }, { status: 409 });
		}
		return NextResponse.json({ error: perfilError.message }, { status: 500 });
	}

	await supabase
		.from('invitaciones')
		.update({ estado: 'aceptada', aceptado_por: user.id })
		.eq('id', invitacion.id);

	return NextResponse.json({ success: true, empresaId: invitacion.empresa_id });
}
