'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { loginSchema } from '@/lib/validations/auth';

export async function login(prevState, formData) {
	const parsed = loginSchema.safeParse({
		email: formData.get('email'),
		password: formData.get('password'),
	});

	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	});

	if (error) {
		return { error: 'Correo o contraseña incorrectos' };
	}

	redirect('/');
}
