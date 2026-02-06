/**
 * Validaciones Zod para comprobantes adicionales - Fase 4
 * Nota de Crédito, Nota de Débito, Retención, Guía de Remisión, Liquidación de Compra
 */
import { z } from 'zod';
import { TIPOS_IDENTIFICACION, FORMAS_PAGO, TIPOS_DOC_SUSTENTO } from '@/lib/utils/sri-catalogs';

// =============================================
// Schemas Reutilizables
// =============================================

const tiposIdentificacionValidos = TIPOS_IDENTIFICACION.map((t) => t.value);
const formasPagoValidas = FORMAS_PAGO.map((f) => f.value);
const tiposDocSustentoValidos = TIPOS_DOC_SUSTENTO.map((t) => t.value);

const documentoSustentoSchema = z.object({
	tipo: z.string().refine((val) => tiposDocSustentoValidos.includes(val), {
		message: 'Tipo de documento sustento inválido',
	}),
	numero: z.string()
		.regex(/^\d{3}-\d{3}-\d{9}$/, 'Formato debe ser 001-001-000000001'),
	fecha: z.coerce.date(),
});

const impuestoDetalleSchema = z.object({
	codigo: z.string().min(1, 'Código impuesto requerido'),
	codigoPorcentaje: z.string().min(1, 'Código porcentaje requerido'),
	tarifa: z.coerce.number().min(0),
	baseImponible: z.coerce.number().min(0),
	valor: z.coerce.number().min(0),
});

const detalleSchema = z.object({
	codigoPrincipal: z.string().min(1, 'Código principal requerido'),
	codigoAdicional: z.string().optional(),
	descripcion: z.string().min(1, 'Descripción requerida'),
	cantidad: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
	precioUnitario: z.coerce.number().min(0, 'Precio unitario inválido'),
	descuento: z.coerce.number().min(0).default(0),
	precioTotalSinImpuesto: z.coerce.number().min(0),
	impuestos: z.array(impuestoDetalleSchema).min(1, 'Debe tener al menos un impuesto'),
});

const pagoSchema = z.object({
	formaPago: z.string().refine((val) => formasPagoValidas.includes(val), {
		message: 'Forma de pago inválida',
	}),
	total: z.coerce.number().positive('Total debe ser mayor a 0'),
	plazo: z.coerce.number().optional(),
	unidadTiempo: z.string().optional(),
});

// =============================================
// Nota de Crédito (codDoc: 04)
// =============================================

export const notaCreditoSchema = z.object({
	// Documento sustento
	docSustentoTipo: z.string().refine((val) => ['01', '03'].includes(val), {
		message: 'Documento sustento debe ser Factura (01) o Liquidación de Compra (03)',
	}),
	docSustentoNumero: z.string()
		.regex(/^\d{3}-\d{3}-\d{9}$/, 'Formato debe ser 001-001-000000001'),
	docSustentoFecha: z.coerce.date(),

	// Comprador (del documento original)
	tipoIdentificacionComprador: z.string().refine((val) => tiposIdentificacionValidos.includes(val), {
		message: 'Tipo de identificación inválido',
	}),
	identificacionComprador: z.string().min(1, 'Identificación requerida'),
	razonSocialComprador: z.string().min(1, 'Razón social requerida'),
	direccionComprador: z.string().optional(),
	emailComprador: z.string().email().optional().or(z.literal('')),

	// Motivo obligatorio
	motivoModificacion: z.string()
		.min(1, 'Motivo es requerido')
		.max(300, 'Motivo no puede exceder 300 caracteres'),

	// Detalles
	detalles: z.array(detalleSchema).min(1, 'Debe tener al menos un detalle'),

	// Info adicional
	infoAdicional: z.array(z.object({
		nombre: z.string().max(100),
		valor: z.string().max(300),
	})).optional(),
}).refine((data) => {
	// Validar que RUC tenga 13 dígitos si tipo es 04
	if (data.tipoIdentificacionComprador === '04') {
		return data.identificacionComprador.length === 13;
	}
	// Validar cédula tenga 10 dígitos si tipo es 05
	if (data.tipoIdentificacionComprador === '05') {
		return data.identificacionComprador.length === 10;
	}
	return true;
}, {
	message: 'La identificación no tiene la longitud correcta según el tipo',
	path: ['identificacionComprador'],
});

// =============================================
// Nota de Débito (codDoc: 05)
// =============================================

const motivoNDSchema = z.object({
	razon: z.string().min(1, 'Razón del cargo requerida').max(300),
	valor: z.coerce.number().positive('Valor debe ser mayor a 0'),
});

export const notaDebitoSchema = z.object({
	// Documento sustento
	docSustentoTipo: z.string().refine((val) => ['01', '03'].includes(val), {
		message: 'Documento sustento debe ser Factura (01) o Liquidación de Compra (03)',
	}),
	docSustentoNumero: z.string()
		.regex(/^\d{3}-\d{3}-\d{9}$/, 'Formato debe ser 001-001-000000001'),
	docSustentoFecha: z.coerce.date(),

	// Comprador
	tipoIdentificacionComprador: z.string().refine((val) => tiposIdentificacionValidos.includes(val), {
		message: 'Tipo de identificación inválido',
	}),
	identificacionComprador: z.string().min(1, 'Identificación requerida'),
	razonSocialComprador: z.string().min(1, 'Razón social requerida'),
	direccionComprador: z.string().optional(),
	emailComprador: z.string().email().optional().or(z.literal('')),

	// Motivos (cargos)
	motivos: z.array(motivoNDSchema).min(1, 'Debe tener al menos un motivo de cargo'),

	// Pagos
	pagos: z.array(pagoSchema).min(1, 'Debe tener al menos una forma de pago'),

	// Info adicional
	infoAdicional: z.array(z.object({
		nombre: z.string().max(100),
		valor: z.string().max(300),
	})).optional(),
});

// =============================================
// Comprobante de Retención (codDoc: 07)
// =============================================

const retencionDetalleSchema = z.object({
	codigoImpuesto: z.enum(['1', '2', '6'], {
		errorMap: () => ({ message: 'Código impuesto debe ser 1 (Renta), 2 (IVA) o 6 (ISD)' }),
	}),
	codigoRetencion: z.string().min(1, 'Código retención requerido'),
	baseImponible: z.coerce.number().positive('Base imponible debe ser mayor a 0'),
	porcentaje: z.coerce.number().min(0, 'Porcentaje inválido'),
	valorRetenido: z.coerce.number().min(0, 'Valor retenido inválido'),
});

const docSustentoRetencionSchema = z.object({
	codSustento: z.string().min(1, 'Código sustento requerido'),
	codDocSustento: z.string().refine((val) => tiposDocSustentoValidos.includes(val), {
		message: 'Tipo documento sustento inválido',
	}),
	numDocSustento: z.string()
		.regex(/^\d{3}-\d{3}-\d{9}$/, 'Formato debe ser 001-001-000000001'),
	fechaEmision: z.coerce.date(),
	fechaRegistroContable: z.coerce.date().optional(),
	numAutorizacion: z.string().min(10, 'Número de autorización requerido'),
	totalSinImpuestos: z.coerce.number().min(0),
	importeTotal: z.coerce.number().min(0),
	retenciones: z.array(retencionDetalleSchema).min(1, 'Debe tener al menos una retención'),
	pagos: z.array(pagoSchema).min(1, 'Debe tener al menos una forma de pago'),
});

export const retencionSchema = z.object({
	// Periodo fiscal
	periodoFiscal: z.string()
		.regex(/^\d{2}\/\d{4}$/, 'Formato debe ser mm/aaaa (ej: 02/2026)'),

	// Sujeto retenido
	tipoIdentificacionSujetoRetenido: z.string().refine((val) => tiposIdentificacionValidos.includes(val), {
		message: 'Tipo de identificación inválido',
	}),
	identificacionSujetoRetenido: z.string().min(1, 'Identificación requerida'),
	razonSocialSujetoRetenido: z.string().min(1, 'Razón social requerida'),
	tipoSujetoRetenido: z.enum(['01', '02']).optional(), // 01=Persona Natural, 02=Sociedad

	// Documentos sustento con retenciones
	documentosSustento: z.array(docSustentoRetencionSchema)
		.min(1, 'Debe tener al menos un documento sustento'),

	// Info adicional
	infoAdicional: z.array(z.object({
		nombre: z.string().max(100),
		valor: z.string().max(300),
	})).optional(),
});

// =============================================
// Guía de Remisión (codDoc: 06)
// =============================================

const itemGRSchema = z.object({
	codigoInterno: z.string().optional(),
	codigoAdicional: z.string().optional(),
	descripcion: z.string().min(1, 'Descripción requerida'),
	cantidad: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
});

const destinatarioSchema = z.object({
	identificacion: z.string().min(1, 'Identificación destinatario requerida'),
	razonSocial: z.string().min(1, 'Razón social destinatario requerida'),
	direccion: z.string().min(1, 'Dirección destinatario requerida'),
	motivoTraslado: z.string().min(1, 'Motivo traslado requerido'),
	ruta: z.string().optional(),
	codDocSustento: z.string().optional(),
	numDocSustento: z.string().optional(),
	numAutDocSustento: z.string().optional(),
	fechaEmisionDocSustento: z.coerce.date().optional(),
	codEstabDestino: z.string().optional(),
	items: z.array(itemGRSchema).min(1, 'Debe tener al menos un item'),
});

const transportistaSchema = z.object({
	tipoIdentificacion: z.string().refine((val) => tiposIdentificacionValidos.includes(val), {
		message: 'Tipo de identificación inválido',
	}),
	identificacion: z.string().min(1, 'Identificación transportista requerida'),
	razonSocial: z.string().min(1, 'Razón social transportista requerida'),
});

export const guiaRemisionSchema = z.object({
	// Datos de transporte
	dirPartida: z.string().min(1, 'Dirección de partida requerida'),
	fechaIniTransporte: z.coerce.date(),
	fechaFinTransporte: z.coerce.date(),
	placa: z.string()
		.min(1, 'Placa requerida')
		.regex(/^[A-Z]{3}-\d{3,4}$/, 'Formato de placa inválido (ej: ABC-1234)'),

	// Transportista
	transportista: transportistaSchema,

	// Destinatarios
	destinatarios: z.array(destinatarioSchema)
		.min(1, 'Debe tener al menos un destinatario'),

	// Info adicional
	infoAdicional: z.array(z.object({
		nombre: z.string().max(100),
		valor: z.string().max(300),
	})).optional(),
}).refine((data) => {
	// Fecha fin debe ser >= fecha inicio
	return data.fechaFinTransporte >= data.fechaIniTransporte;
}, {
	message: 'La fecha fin de transporte debe ser igual o posterior a la fecha de inicio',
	path: ['fechaFinTransporte'],
});

// =============================================
// Liquidación de Compra (codDoc: 03)
// =============================================

export const liquidacionCompraSchema = z.object({
	// Proveedor
	tipoIdentificacionProveedor: z.string().refine((val) => tiposIdentificacionValidos.includes(val), {
		message: 'Tipo de identificación inválido',
	}),
	identificacionProveedor: z.string().min(1, 'Identificación proveedor requerida'),
	razonSocialProveedor: z.string().min(1, 'Razón social proveedor requerida'),
	direccionProveedor: z.string().optional(),

	// Detalles
	detalles: z.array(detalleSchema).min(1, 'Debe tener al menos un detalle'),

	// Pagos
	pagos: z.array(pagoSchema).min(1, 'Debe tener al menos una forma de pago'),

	// Info adicional
	infoAdicional: z.array(z.object({
		nombre: z.string().max(100),
		valor: z.string().max(300),
	})).optional(),
}).refine((data) => {
	// Liquidación de compra solo aplica para personas naturales (cédula o pasaporte)
	// NO debe ser RUC (04) ni consumidor final (07)
	return ['05', '06'].includes(data.tipoIdentificacionProveedor);
}, {
	message: 'Liquidación de compra solo aplica para personas naturales (cédula o pasaporte)',
	path: ['tipoIdentificacionProveedor'],
});

// =============================================
// Funciones de validación
// =============================================

/**
 * Valida datos de Nota de Crédito
 */
export function validarNotaCredito(data) {
	return notaCreditoSchema.safeParse(data);
}

/**
 * Valida datos de Nota de Débito
 */
export function validarNotaDebito(data) {
	return notaDebitoSchema.safeParse(data);
}

/**
 * Valida datos de Retención
 */
export function validarRetencion(data) {
	return retencionSchema.safeParse(data);
}

/**
 * Valida datos de Guía de Remisión
 */
export function validarGuiaRemision(data) {
	return guiaRemisionSchema.safeParse(data);
}

/**
 * Valida datos de Liquidación de Compra
 */
export function validarLiquidacionCompra(data) {
	return liquidacionCompraSchema.safeParse(data);
}
