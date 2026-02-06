'use server';

import { createClient } from '@/lib/supabase/server';
import { puntoEmisionSchema } from '@/lib/validations/empresa';
import { revalidatePath } from 'next/cache';

export async function listarPuntosEmision() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { data: [] };

	const { data, error } = await supabase
		.from('puntos_emision')
		.select('*, establecimientos(codigo, direccion)')
		.eq('empresa_id', empresa.id)
		.order('codigo');

	if (error) return { error: error.message };
	return { data: data || [] };
}

export async function crearPuntoEmision(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const parsed = puntoEmisionSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (!empresa) return { error: 'Primero debes registrar tu empresa' };

	const { data, error } = await supabase
		.from('puntos_emision')
		.insert({
			...parsed.data,
			empresa_id: empresa.id,
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return { error: 'Ya existe un punto de emisión con ese código en el establecimiento' };
		return { error: error.message };
	}

	revalidatePath('/configuracion/puntos-emision');
	return { data, success: true };
}

export async function actualizarPuntoEmision(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const id = raw.id;
	delete raw.id;

	const parsed = puntoEmisionSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('puntos_emision')
		.update(parsed.data)
		.eq('id', id)
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/configuracion/puntos-emision');
	return { data, success: true };
}

export async function togglePuntoEmision(id, activo) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { error } = await supabase
		.from('puntos_emision')
		.update({ activo })
		.eq('id', id);

	if (error) return { error: error.message };
	revalidatePath('/configuracion/puntos-emision');
	return { success: true };
}
