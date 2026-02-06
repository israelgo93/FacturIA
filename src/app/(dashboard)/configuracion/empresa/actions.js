'use server';

import { createClient } from '@/lib/supabase/server';
import { empresaSchema } from '@/lib/validations/empresa';
import { revalidatePath } from 'next/cache';

export async function obtenerEmpresa() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data, error } = await supabase
		.from('empresas')
		.select('*')
		.eq('user_id', user.id)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data };
}

export async function crearEmpresa(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const parsed = empresaSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	// Verificar que no tenga ya una empresa
	const { data: existing } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (existing) {
		return { error: 'Ya tienes una empresa registrada' };
	}

	const { data, error } = await supabase
		.from('empresas')
		.insert({
			...parsed.data,
			user_id: user.id,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/configuracion');
	return { data, success: true };
}

export async function actualizarEmpresa(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const empresaId = raw.empresa_id;
	delete raw.empresa_id;

	const parsed = empresaSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('empresas')
		.update(parsed.data)
		.eq('id', empresaId)
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/configuracion');
	return { data, success: true };
}
