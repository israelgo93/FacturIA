import { z } from 'zod';
import { validarIdentificacion } from './common';

export const clienteSchema = z.object({
	tipo_identificacion: z
		.enum(['04', '05', '06', '07', '08'], {
			message: 'Selecciona un tipo de identificación',
		}),
	identificacion: z
		.string()
		.min(1, 'La identificación es requerida')
		.max(20, 'Máximo 20 caracteres'),
	razon_social: z
		.string()
		.min(1, 'La razón social es requerida')
		.max(300, 'Máximo 300 caracteres'),
	direccion: z
		.string()
		.max(300, 'Máximo 300 caracteres')
		.optional()
		.or(z.literal('')),
	email: z
		.string()
		.email('Email inválido')
		.optional()
		.or(z.literal('')),
	telefono: z
		.string()
		.max(20, 'Máximo 20 caracteres')
		.optional()
		.or(z.literal('')),
}).refine(
	(data) => validarIdentificacion(data.tipo_identificacion, data.identificacion),
	{ message: 'La identificación no es válida para el tipo seleccionado', path: ['identificacion'] }
);
