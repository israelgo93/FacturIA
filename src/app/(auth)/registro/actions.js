'use server';

import { createClient } from '@/lib/supabase/server';
import { registroSchema } from '@/lib/validations/auth';

export async function signup(prevState, formData) {
	const parsed = registroSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
		confirmPassword: formData.get('confirmPassword'),
	});

	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signUp({
		email: parsed.data.email,
		password: parsed.data.password,
		options: {
			emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
		},
	});

	if (error) {
		if (error.message.includes('already registered')) {
			return { error: 'Este correo ya está registrado' };
		}
		return { error: 'Error al crear la cuenta. Intenta de nuevo.' };
	}

	return { success: 'Revisa tu correo electrónico para confirmar tu cuenta.' };
}
