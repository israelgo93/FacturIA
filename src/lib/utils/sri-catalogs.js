// =============================================
// Catálogos del SRI Ecuador para facturIA
// =============================================

// Tipos de identificación (Tabla 6)
export const TIPOS_IDENTIFICACION = [
	{ value: '04', label: 'RUC' },
	{ value: '05', label: 'Cédula' },
	{ value: '06', label: 'Pasaporte' },
	{ value: '07', label: 'Consumidor Final' },
	{ value: '08', label: 'Identificación del Exterior' },
];

// Formas de pago (Tabla 24 / Catálogo ATS)
export const FORMAS_PAGO = [
	{ value: '01', label: 'Sin utilización del sistema financiero' },
	{ value: '15', label: 'Compensación de deudas' },
	{ value: '16', label: 'Tarjeta de débito' },
	{ value: '17', label: 'Dinero electrónico' },
	{ value: '18', label: 'Tarjeta prepago' },
	{ value: '19', label: 'Tarjeta de crédito' },
	{ value: '20', label: 'Otros con utilización del sistema financiero' },
	{ value: '21', label: 'Endoso de títulos' },
];

// Tarifas IVA (Tabla 17)
export const TARIFAS_IVA = [
	{ value: '0', label: '0%', tarifa: 0 },
	{ value: '2', label: '12%', tarifa: 12 },
	{ value: '3', label: '14%', tarifa: 14 },
	{ value: '4', label: '15%', tarifa: 15 },
	{ value: '5', label: '5%', tarifa: 5 },
	{ value: '6', label: 'No objeto de IVA', tarifa: 0 },
	{ value: '7', label: 'Exento de IVA', tarifa: 0 },
	{ value: '8', label: 'IVA diferenciado', tarifa: 0 },
	{ value: '10', label: '13%', tarifa: 13 },
];

// Retención IVA (Tabla 20)
export const RETENCIONES_IVA = [
	{ value: '9', label: '10% IVA', porcentaje: 10 },
	{ value: '10', label: '20% IVA', porcentaje: 20 },
	{ value: '1', label: '30% IVA', porcentaje: 30 },
	{ value: '11', label: '50% IVA', porcentaje: 50 },
	{ value: '2', label: '70% IVA', porcentaje: 70 },
	{ value: '3', label: '100% IVA', porcentaje: 100 },
	{ value: '7', label: '0% IVA (cero)', porcentaje: 0 },
	{ value: '8', label: '0% IVA (no procede)', porcentaje: 0 },
];

// Tipos de comprobante (Tabla 3/4)
export const TIPOS_COMPROBANTE = [
	{ value: '01', label: 'Factura' },
	{ value: '04', label: 'Nota de Crédito' },
	{ value: '05', label: 'Nota de Débito' },
	{ value: '06', label: 'Guía de Remisión' },
	{ value: '07', label: 'Comprobante de Retención' },
	{ value: '08', label: 'Liquidación de Compra' },
];

// Códigos de impuesto
export const CODIGOS_IMPUESTO = [
	{ value: '1', label: 'Renta' },
	{ value: '2', label: 'IVA' },
	{ value: '3', label: 'ICE' },
	{ value: '5', label: 'IRBPNR' },
	{ value: '6', label: 'ISD' },
];

// Códigos de sustento tributario (Tabla 5 Catálogo ATS)
export const CODIGOS_SUSTENTO = [
	{ value: '01', label: 'Crédito Tributario para IVA' },
	{ value: '02', label: 'Costo o Gasto para IR / Crédito Tributario IVA' },
	{ value: '03', label: 'Activo Fijo / Crédito Tributario IVA' },
	{ value: '04', label: 'Activo Fijo / Costo o Gasto para IR' },
	{ value: '05', label: 'Liquidación Gastos de Viaje, hospedaje y alimentación' },
	{ value: '06', label: 'Inventario / Crédito Tributario IVA' },
	{ value: '07', label: 'Inventario / Costo o Gasto para IR' },
	{ value: '08', label: 'Valor pagado para solicitar Reembolso de Gasto' },
	{ value: '09', label: 'Reembolso por Siniestros' },
	{ value: '10', label: 'Distribución de Dividendos' },
	{ value: '00', label: 'Casos especiales' },
];

// Regímenes fiscales
export const REGIMENES_FISCALES = [
	{ value: 'GENERAL', label: 'Régimen General' },
	{ value: 'RIMPE_EMPRENDEDOR', label: 'RIMPE Emprendedor' },
	{ value: 'RIMPE_NEGOCIO_POPULAR', label: 'RIMPE Negocio Popular' },
];

/**
 * Obtiene la tarifa IVA numérica por código
 * @param {string} codigo - Código de tarifa IVA
 * @returns {number} Porcentaje de tarifa
 */
export function getTarifaIVA(codigo) {
	const tarifa = TARIFAS_IVA.find((t) => t.value === codigo);
	return tarifa ? tarifa.tarifa : 0;
}

/**
 * Obtiene la etiqueta de un tipo de identificación
 * @param {string} codigo - Código tipo identificación
 * @returns {string} Etiqueta descriptiva
 */
export function getLabelTipoIdentificacion(codigo) {
	const tipo = TIPOS_IDENTIFICACION.find((t) => t.value === codigo);
	return tipo ? tipo.label : codigo;
}
