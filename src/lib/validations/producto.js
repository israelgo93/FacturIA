import { z } from 'zod';

// Códigos IVA válidos según catálogo SRI
const CODIGOS_IVA_VALIDOS = ['0', '2', '3', '4', '5', '6', '7', '8', '10'];

export const productoSchema = z.object({
	codigo_principal: z
		.string()
		.min(1, 'El código es requerido')
		.max(25, 'Máximo 25 caracteres'),
	codigo_auxiliar: z
		.string()
		.max(25, 'Máximo 25 caracteres')
		.optional()
		.or(z.literal('')),
	nombre: z
		.string()
		.min(1, 'El nombre es requerido')
		.max(300, 'Máximo 300 caracteres'),
	descripcion: z
		.string()
		.max(500, 'Máximo 500 caracteres')
		.optional()
		.or(z.literal('')),
	precio_unitario: z
		.string()
		.min(1, 'El precio es requerido')
		.transform(Number)
		.refine((val) => !isNaN(val) && val >= 0, 'El precio debe ser un número positivo'),
	iva_codigo_porcentaje: z
		.enum(CODIGOS_IVA_VALIDOS, {
			message: 'Selecciona una tarifa IVA válida',
		}),
	ice_codigo: z
		.string()
		.max(10, 'Máximo 10 caracteres')
		.optional()
		.or(z.literal('')),
	ice_tarifa: z
		.string()
		.optional()
		.or(z.literal(''))
		.transform((val) => val ? Number(val) : null),
	categoria: z
		.string()
		.max(100, 'Máximo 100 caracteres')
		.optional()
		.or(z.literal('')),
});
