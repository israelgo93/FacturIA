'use server';

import { createClient } from '@/lib/supabase/server';
import { establecimientoSchema } from '@/lib/validations/empresa';
import { revalidatePath } from 'next/cache';

export async function listarEstablecimientos() {
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
		.from('establecimientos')
		.select('*')
		.eq('empresa_id', empresa.id)
		.order('codigo');

	if (error) return { error: error.message };
	return { data: data || [] };
}

export async function crearEstablecimiento(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const parsed = establecimientoSchema.safeParse(raw);
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
		.from('establecimientos')
		.insert({
			...parsed.data,
			empresa_id: empresa.id,
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return { error: 'Ya existe un establecimiento con ese código' };
		return { error: error.message };
	}

	revalidatePath('/configuracion/establecimientos');
	return { data, success: true };
}

export async function actualizarEstablecimiento(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const id = raw.id;
	delete raw.id;

	const parsed = establecimientoSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('establecimientos')
		.update(parsed.data)
		.eq('id', id)
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/configuracion/establecimientos');
	return { data, success: true };
}

export async function toggleEstablecimiento(id, activo) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { error } = await supabase
		.from('establecimientos')
		.update({ activo })
		.eq('id', id);

	if (error) return { error: error.message };
	revalidatePath('/configuracion/establecimientos');
	return { success: true };
}
