/**
 * Schemas de validación Zod para factura electrónica
 * Validación por paso del wizard + validación completa
 */
import { z } from 'zod';

// =========================================
// Paso 1: Cliente
// =========================================
export const clienteStepSchema = z.object({
	clienteId: z.string().uuid().optional().nullable(),
	tipoIdentificacionComprador: z.string().min(2, 'Tipo de identificación requerido'),
	identificacionComprador: z.string().min(1, 'Identificación requerida'),
	razonSocialComprador: z.string().min(1, 'Razón social requerida'),
	direccionComprador: z.string().optional().nullable(),
	emailComprador: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
	telefonoComprador: z.string().optional().nullable(),
});

// =========================================
// Paso 2: Detalles (productos/servicios)
// =========================================
const impuestoSchema = z.object({
	codigo: z.string().min(1),
	codigoPorcentaje: z.string().min(1),
	tarifa: z.number().min(0),
	baseImponible: z.number().min(0),
	valor: z.number().min(0),
});

const detalleSchema = z.object({
	productoId: z.string().uuid().optional().nullable(),
	codigoPrincipal: z.string().min(1, 'Código principal requerido'),
	descripcion: z.string().min(1, 'Descripción requerida'),
	cantidad: z.number().positive('Cantidad debe ser mayor a 0'),
	precioUnitario: z.number().min(0, 'Precio unitario inválido'),
	descuento: z.number().min(0).default(0),
	precioTotalSinImpuesto: z.number().min(0),
	impuestos: z.array(impuestoSchema).min(1, 'Al menos un impuesto requerido'),
});

export const detallesStepSchema = z.object({
	detalles: z.array(detalleSchema).min(1, 'Agregue al menos un producto o servicio'),
});

// =========================================
// Paso 3: Formas de pago
// =========================================
const pagoSchema = z.object({
	formaPago: z.string().min(2, 'Forma de pago requerida'),
	total: z.number().positive('Total debe ser mayor a 0'),
	plazo: z.number().int().min(0).optional().nullable(),
	unidadTiempo: z.string().default('dias'),
});

export const pagosStepSchema = z.object({
	pagos: z.array(pagoSchema).min(1, 'Agregue al menos una forma de pago'),
});

// =========================================
// Schema completo de factura (todos los pasos)
// =========================================
export const facturaSchema = z.object({
	establecimientoId: z.string().uuid('Seleccione un establecimiento'),
	puntoEmisionId: z.string().uuid('Seleccione un punto de emisión'),
	// Paso 1
	...clienteStepSchema.shape,
	// Paso 2
	...detallesStepSchema.shape,
	// Paso 3
	...pagosStepSchema.shape,
	// Adicionales
	observaciones: z.string().optional().nullable(),
	infoAdicional: z.array(z.object({
		nombre: z.string(),
		valor: z.string(),
	})).optional().default([]),
});
