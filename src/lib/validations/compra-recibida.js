import { z } from 'zod';

export const compraRecibidaSchema = z.object({
	tipo_id_proveedor: z.enum(['01', '02', '03'], {
		message: 'Selecciona un tipo de identificación',
	}),
	identificacion_proveedor: z
		.string()
		.min(1, 'La identificación es requerida')
		.max(20, 'Máximo 20 caracteres'),
	razon_social_proveedor: z
		.string()
		.min(1, 'La razón social es requerida')
		.max(300, 'Máximo 300 caracteres'),
	tipo_comprobante: z
		.string()
		.min(1, 'Selecciona un tipo de comprobante')
		.max(3),
	cod_sustento: z
		.string()
		.min(1, 'Selecciona un código de sustento')
		.max(2),
	establecimiento: z
		.string()
		.length(3, 'Debe tener 3 dígitos')
		.regex(/^\d{3}$/, 'Solo dígitos'),
	punto_emision: z
		.string()
		.length(3, 'Debe tener 3 dígitos')
		.regex(/^\d{3}$/, 'Solo dígitos'),
	secuencial: z
		.string()
		.min(1, 'El secuencial es requerido')
		.max(9, 'Máximo 9 dígitos')
		.regex(/^\d+$/, 'Solo dígitos'),
	fecha_emision: z
		.string()
		.min(1, 'La fecha de emisión es requerida'),
	fecha_registro: z
		.string()
		.min(1, 'La fecha de registro es requerida'),
	autorizacion: z
		.string()
		.max(49, 'Máximo 49 caracteres')
		.optional()
		.or(z.literal('')),
	base_no_grava_iva: z.coerce.number().min(0).default(0),
	base_imponible_0: z.coerce.number().min(0).default(0),
	base_imponible_iva: z.coerce.number().min(0).default(0),
	base_imp_exenta: z.coerce.number().min(0).default(0),
	monto_iva: z.coerce.number().min(0).default(0),
	monto_ice: z.coerce.number().min(0).default(0),
	forma_pago: z
		.string()
		.max(2)
		.optional()
		.or(z.literal('')),
	pago_loc_ext: z.enum(['01', '02']).default('01'),
	parte_relacionada: z.enum(['SI', 'NO']).default('NO'),
	observaciones: z
		.string()
		.max(500)
		.optional()
		.or(z.literal('')),
});

export const retencionCompraSchema = z.object({
	tipo_retencion: z.enum(['1', '2', '6'], {
		message: 'Selecciona un tipo de retención',
	}),
	codigo_retencion: z
		.string()
		.min(1, 'El código es requerido')
		.max(5),
	base_imponible: z.coerce.number().min(0.01, 'La base imponible debe ser mayor a 0'),
	porcentaje: z.coerce.number().min(0),
	valor_retenido: z.coerce.number().min(0),
});
