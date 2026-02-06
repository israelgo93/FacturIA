import { z } from 'zod';

export const empleadoSchema = z.object({
	tipo_identificacion: z.enum(['C', 'R', 'P'], {
		message: 'Selecciona un tipo de identificación',
	}),
	identificacion: z
		.string()
		.min(1, 'La identificación es requerida')
		.max(20, 'Máximo 20 caracteres'),
	apellidos: z
		.string()
		.min(1, 'Los apellidos son requeridos')
		.max(200, 'Máximo 200 caracteres'),
	nombres: z
		.string()
		.min(1, 'Los nombres son requeridos')
		.max(200, 'Máximo 200 caracteres'),
	fecha_ingreso: z
		.string()
		.min(1, 'La fecha de ingreso es requerida'),
	fecha_salida: z
		.string()
		.optional()
		.or(z.literal('')),
	cargo: z
		.string()
		.max(200)
		.optional()
		.or(z.literal('')),
	tipo_contrato: z
		.string()
		.max(2)
		.optional()
		.or(z.literal('')),
	sueldo_mensual: z.coerce.number().min(0).default(0),
});

export const ingresosAnualesSchema = z.object({
	anio: z.coerce.number().int().min(2020).max(2030),
	sueldo_salario: z.coerce.number().min(0).default(0),
	sobresueldos: z.coerce.number().min(0).default(0),
	participacion_utilidades: z.coerce.number().min(0).default(0),
	ingresos_gravados: z.coerce.number().min(0).default(0),
	decimo_tercero: z.coerce.number().min(0).default(0),
	decimo_cuarto: z.coerce.number().min(0).default(0),
	fondos_reserva: z.coerce.number().min(0).default(0),
	otros_ingresos_gravados: z.coerce.number().min(0).default(0),
	ingresos_gravados_empleador: z.coerce.number().min(0).default(0),
	aporte_iess_personal: z.coerce.number().min(0).default(0),
	impuesto_renta_causado: z.coerce.number().min(0).default(0),
	valor_retenido: z.coerce.number().min(0).default(0),
	gastos_vivienda: z.coerce.number().min(0).default(0),
	gastos_salud: z.coerce.number().min(0).default(0),
	gastos_educacion: z.coerce.number().min(0).default(0),
	gastos_alimentacion: z.coerce.number().min(0).default(0),
	gastos_vestimenta: z.coerce.number().min(0).default(0),
	gastos_turismo: z.coerce.number().min(0).default(0),
	sistema_salario_neto: z.coerce.boolean().default(false),
});
