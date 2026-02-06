import { z } from 'zod';

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'El correo es requerido')
		.email('Correo electrónico inválido'),
	password: z
		.string()
		.min(1, 'La contraseña es requerida')
		.min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registroSchema = z.object({
	email: z
		.string()
		.min(1, 'El correo es requerido')
		.email('Correo electrónico inválido'),
	password: z
		.string()
		.min(1, 'La contraseña es requerida')
		.min(8, 'La contraseña debe tener al menos 8 caracteres')
		.regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
		.regex(/[0-9]/, 'Debe contener al menos un número'),
	confirmPassword: z
		.string()
		.min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
	message: 'Las contraseñas no coinciden',
	path: ['confirmPassword'],
});

export const recuperarSchema = z.object({
	email: z
		.string()
		.min(1, 'El correo es requerido')
		.email('Correo electrónico inválido'),
});
