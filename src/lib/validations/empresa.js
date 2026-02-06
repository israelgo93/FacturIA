import { z } from 'zod';
import { validarRUC } from './common';

// Schema para crear/actualizar empresa
export const empresaSchema = z.object({
	ruc: z
		.string()
		.min(1, 'El RUC es requerido')
		.length(13, 'El RUC debe tener 13 dígitos')
		.regex(/^\d{13}$/, 'El RUC solo debe contener dígitos')
		.refine(validarRUC, 'El RUC no es válido (verificación Módulo 11)'),
	razon_social: z
		.string()
		.min(1, 'La razón social es requerida')
		.max(300, 'Máximo 300 caracteres'),
	nombre_comercial: z
		.string()
		.max(300, 'Máximo 300 caracteres')
		.optional()
		.or(z.literal('')),
	direccion_matriz: z
		.string()
		.min(1, 'La dirección es requerida')
		.max(300, 'Máximo 300 caracteres'),
	obligado_contabilidad: z
		.enum(['true', 'false'])
		.transform((val) => val === 'true'),
	contribuyente_especial: z
		.string()
		.max(20, 'Máximo 20 caracteres')
		.optional()
		.or(z.literal('')),
	regimen_fiscal: z
		.enum(['GENERAL', 'RIMPE_EMPRENDEDOR', 'RIMPE_NEGOCIO_POPULAR'], {
			message: 'Selecciona un régimen fiscal válido',
		}),
	agente_retencion: z
		.string()
		.max(20, 'Máximo 20 caracteres')
		.optional()
		.or(z.literal('')),
	ambiente: z
		.enum(['1', '2'])
		.transform(Number),
	email_notificaciones: z
		.string()
		.email('Email inválido')
		.optional()
		.or(z.literal('')),
	telefono: z
		.string()
		.max(20, 'Máximo 20 caracteres')
		.optional()
		.or(z.literal('')),
});

// Schema para establecimiento
export const establecimientoSchema = z.object({
	codigo: z
		.string()
		.min(1, 'El código es requerido')
		.length(3, 'El código debe tener 3 dígitos')
		.regex(/^\d{3}$/, 'Solo dígitos (ej: 001)'),
	direccion: z
		.string()
		.min(1, 'La dirección es requerida')
		.max(300, 'Máximo 300 caracteres'),
	nombre_comercial: z
		.string()
		.max(300, 'Máximo 300 caracteres')
		.optional()
		.or(z.literal('')),
});

// Schema para punto de emisión
export const puntoEmisionSchema = z.object({
	establecimiento_id: z
		.string()
		.min(1, 'Selecciona un establecimiento'),
	codigo: z
		.string()
		.min(1, 'El código es requerido')
		.length(3, 'El código debe tener 3 dígitos')
		.regex(/^\d{3}$/, 'Solo dígitos (ej: 001)'),
	descripcion: z
		.string()
		.max(300, 'Máximo 300 caracteres')
		.optional()
		.or(z.literal('')),
});
