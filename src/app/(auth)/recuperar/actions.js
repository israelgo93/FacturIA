'use server';

import { createClient } from '@/lib/supabase/server';
import { recuperarSchema } from '@/lib/validations/auth';

export async function resetPassword(prevState, formData) {
	const parsed = recuperarSchema.safeParse({
		email: formData.get('email'),
	});

	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
		redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/configuracion`,
	});

	if (error) {
		return { error: 'Error al enviar el correo. Intenta de nuevo.' };
	}

	return { success: 'Revisa tu correo electrónico para restablecer tu contraseña.' };
}
