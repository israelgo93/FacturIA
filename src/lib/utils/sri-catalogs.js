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

// Códigos IVA para uso en formularios (Tabla 17 SRI)
export const CODIGOS_IVA = TARIFAS_IVA.map((t) => ({
	codigo: t.value,
	tarifa: t.tarifa,
	label: t.label,
}));

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
// NOTA: Liquidación de Compra es código 03 según Ficha Técnica SRI v2.32
export const TIPOS_COMPROBANTE = [
	{ value: '01', label: 'Factura' },
	{ value: '03', label: 'Liquidación de Compra' },
	{ value: '04', label: 'Nota de Crédito' },
	{ value: '05', label: 'Nota de Débito' },
	{ value: '06', label: 'Guía de Remisión' },
	{ value: '07', label: 'Comprobante de Retención' },
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

// =============================================
// CATÁLOGOS FASE 4: Comprobantes Adicionales
// =============================================

// Códigos de Retención en la Fuente de Renta (código impuesto: 1)
// Basado en Tabla 21 del Catálogo ATS y Resolución NAC-DGERCGC15-00000284
export const CODIGOS_RETENCION_RENTA = [
	{ value: '303', label: 'Honorarios profesionales y demás pagos por servicios relacionados', porcentaje: 10 },
	{ value: '304', label: 'Servicios predomina el intelecto', porcentaje: 8 },
	{ value: '304A', label: 'Servicios predomina mano de obra', porcentaje: 2 },
	{ value: '304B', label: 'Servicios entre sociedades', porcentaje: 2 },
	{ value: '304C', label: 'Publicidad y comunicación', porcentaje: 1 },
	{ value: '304D', label: 'Transporte privado de pasajeros o servicio de transporte de carga', porcentaje: 1 },
	{ value: '304E', label: 'Transferencia de bienes muebles', porcentaje: 1 },
	{ value: '307', label: 'Servicios predomina mano de obra', porcentaje: 2 },
	{ value: '308', label: 'Servicios predomina intelecto', porcentaje: 2 },
	{ value: '309', label: 'Publicidad y comunicación', porcentaje: 1 },
	{ value: '310', label: 'Transporte privado pasajeros/carga', porcentaje: 1 },
	{ value: '312', label: 'Transferencia de bienes muebles de naturaleza corporal', porcentaje: 1 },
	{ value: '319', label: 'Arrendamiento mercantil', porcentaje: 1 },
	{ value: '320', label: 'Arrendamiento bienes inmuebles', porcentaje: 8 },
	{ value: '322', label: 'Seguros y reaseguros (10% del valor de primas)', porcentaje: 1 },
	{ value: '323', label: 'Rendimientos financieros', porcentaje: 2 },
	{ value: '325', label: 'Loterías, rifas, apuestas y similares', porcentaje: 15 },
	{ value: '327', label: 'Venta de combustibles a comercializadoras', porcentaje: 0.2 },
	{ value: '328', label: 'Venta de combustibles a distribuidoras', porcentaje: 0.3 },
	{ value: '332', label: 'Pagos de bienes o servicios no sujetos a retención', porcentaje: 0 },
	{ value: '340', label: 'Otras retenciones aplicables (1.75%)', porcentaje: 1.75 },
	{ value: '341', label: 'Otras retenciones aplicables (2.75%)', porcentaje: 2.75 },
	{ value: '343', label: 'Pagos al exterior - Sin convenio doble tributación', porcentaje: 25 },
	{ value: '344', label: 'Pagos al exterior - Países paraísos fiscales', porcentaje: 35 },
];

// Códigos de Retención IVA (código impuesto: 2) - Tabla 20
export const CODIGOS_RETENCION_IVA_COMPROBANTE = [
	{ value: '1', label: 'Retención IVA 10%', porcentaje: 10 },
	{ value: '2', label: 'Retención IVA 20%', porcentaje: 20 },
	{ value: '3', label: 'Retención IVA 30%', porcentaje: 30 },
	{ value: '4', label: 'Retención IVA 50%', porcentaje: 50 },
	{ value: '5', label: 'Retención IVA 70%', porcentaje: 70 },
	{ value: '6', label: 'Retención IVA 100%', porcentaje: 100 },
	{ value: '7', label: 'Retención en cero', porcentaje: 0 },
	{ value: '9', label: 'No aplica retención', porcentaje: 0 },
	{ value: '10', label: 'IVA Presuntivo 12%', porcentaje: 12 },
];

// Códigos de Retención ISD (código impuesto: 6)
export const CODIGOS_RETENCION_ISD = [
	{ value: '4580', label: 'Impuesto a la Salida de Divisas', porcentaje: 5 },
];

// Tipos de documento sustento para retenciones (Tabla 4 Catálogo ATS)
export const TIPOS_DOC_SUSTENTO = [
	{ value: '01', label: 'Factura' },
	{ value: '02', label: 'Nota de Venta - RISE' },
	{ value: '03', label: 'Liquidación de Compra de Bienes y Prestación de Servicios' },
	{ value: '04', label: 'Nota de Crédito' },
	{ value: '05', label: 'Nota de Débito' },
	{ value: '06', label: 'Guía de Remisión' },
	{ value: '07', label: 'Comprobante de Retención' },
	{ value: '08', label: 'Boletos o entradas espectáculos públicos' },
	{ value: '09', label: 'Tiquetes o vales emitidos por máquinas registradoras' },
	{ value: '11', label: 'Pasajes expedidos por empresas de aviación' },
	{ value: '12', label: 'Documentos emitidos por instituciones financieras' },
	{ value: '15', label: 'Comprobante de venta emitido en el exterior' },
	{ value: '16', label: 'Formulario Único de Exportación (FUE)' },
	{ value: '18', label: 'Documentos autorizados DAU' },
	{ value: '19', label: 'Comprobantes de pago cuota RISE' },
	{ value: '20', label: 'Documentos Cartagena y otros convenios' },
	{ value: '21', label: 'Carta de porte aéreo' },
	{ value: '41', label: 'Comprobante de venta emitido por reembolso' },
	{ value: '42', label: 'Documento de sociedad residente o EP' },
	{ value: '43', label: 'Liquidación para explotación y exploración de hidrocarburos' },
	{ value: '44', label: 'Comprobante de contribuciones y aportes' },
	{ value: '45', label: 'Liquidación de compra títulos valores' },
	{ value: '47', label: 'Nota de crédito del proveedor' },
	{ value: '48', label: 'Nota de débito del proveedor' },
];

// Motivos de traslado para Guía de Remisión
export const MOTIVOS_TRASLADO = [
	{ value: '01', label: 'Venta' },
	{ value: '02', label: 'Venta con entrega posterior' },
	{ value: '03', label: 'Compra' },
	{ value: '04', label: 'Devolución en compra' },
	{ value: '05', label: 'Devolución en venta' },
	{ value: '06', label: 'Traslado entre establecimientos de la misma empresa' },
	{ value: '07', label: 'Traslado por emisión itinerante' },
	{ value: '08', label: 'Exportación' },
	{ value: '09', label: 'Importación' },
	{ value: '10', label: 'Transformación' },
	{ value: '11', label: 'Zona primaria' },
	{ value: '12', label: 'Otros' },
];

/**
 * Obtiene la descripción de un código de retención de renta
 * @param {string} codigo - Código de retención
 * @returns {{ label: string, porcentaje: number } | null}
 */
export function getRetencionRenta(codigo) {
	return CODIGOS_RETENCION_RENTA.find((r) => r.value === codigo) || null;
}

/**
 * Obtiene la descripción de un código de retención IVA
 * @param {string} codigo - Código de retención
 * @returns {{ label: string, porcentaje: number } | null}
 */
export function getRetencionIVA(codigo) {
	return CODIGOS_RETENCION_IVA_COMPROBANTE.find((r) => r.value === codigo) || null;
}

/**
 * Obtiene la etiqueta de un tipo de documento sustento
 * @param {string} codigo - Código tipo documento
 * @returns {string}
 */
export function getLabelTipoDocSustento(codigo) {
	const tipo = TIPOS_DOC_SUSTENTO.find((t) => t.value === codigo);
	return tipo ? tipo.label : codigo;
}

/**
 * Obtiene la etiqueta de un tipo de comprobante
 * @param {string} codigo - Código tipo comprobante
 * @returns {string}
 */
export function getLabelTipoComprobante(codigo) {
	const tipo = TIPOS_COMPROBANTE.find((t) => t.value === codigo);
	return tipo ? tipo.label : codigo;
}

// =============================================
// CATÁLOGOS FASE 5: ATS — Tablas del Catálogo ATS del SRI
// =============================================

// Tabla 2 ATS: Tipo de identificación del proveedor (compras)
export const TIPO_ID_PROVEEDOR_ATS = [
	{ value: '01', label: 'RUC' },
	{ value: '02', label: 'Cédula' },
	{ value: '03', label: 'Pasaporte' },
];

// Tabla 4 ATS: Tipo de comprobante para compras
export const TIPO_COMPROBANTE_ATS = [
	{ value: '01', label: 'Factura' },
	{ value: '02', label: 'Nota de Venta - RISE' },
	{ value: '03', label: 'Liquidación de Compra' },
	{ value: '04', label: 'Nota de Crédito' },
	{ value: '05', label: 'Nota de Débito' },
	{ value: '09', label: 'Tiquete de máquina registradora' },
	{ value: '11', label: 'Pasajes expedidos por transporte' },
	{ value: '12', label: 'Inst. del Estado / servicio público' },
	{ value: '15', label: 'Comprobante de venta Inst. Financieras' },
	{ value: '16', label: 'DAU / DAV' },
	{ value: '18', label: 'Documentos autorizados SRI' },
	{ value: '19', label: 'Comprobante de pago cuotas / aportes' },
	{ value: '20', label: 'Documentos del Estado (agua, luz, teléfono)' },
	{ value: '21', label: 'Carta de porte aéreo' },
	{ value: '41', label: 'Comprobante de venta con reembolso' },
	{ value: '43', label: 'Liquidación compra de bienes muebles usados' },
	{ value: '45', label: 'Liquidación por prestaciones seguros' },
	{ value: '47', label: 'Nota de crédito por reembolso' },
	{ value: '48', label: 'Nota de débito por reembolso' },
];

// Tabla 5 ATS: Código de sustento tributario (completa)
export const COD_SUSTENTO_ATS = [
	{ value: '01', label: 'Crédito Trib. IVA - adq. bienes/servicios diferente de activos fijos' },
	{ value: '02', label: 'Costo/Gasto IVA - adq. locales bienes que NO serán comercializados' },
	{ value: '03', label: 'Activos fijos (crédito tributario / costo)' },
	{ value: '04', label: 'Gasto - adq. servicios' },
	{ value: '05', label: 'Gasto - adq. bienes muebles que serán comercializados' },
	{ value: '06', label: 'Reembolso como intermediario' },
	{ value: '07', label: 'Sustento de retención presuntiva' },
	{ value: '08', label: 'Adquisiciones a contribuyentes RISE' },
	{ value: '09', label: 'DAU / DAV' },
	{ value: '10', label: 'Reembolso como mandante / constituente' },
	{ value: '11', label: 'Gasto con retención en la fuente sin aplicar resolución contable' },
	{ value: '12', label: 'Impuestos y retenciones presuntivos' },
	{ value: '14', label: 'Pagos con convenio de doble tributación' },
	{ value: '15', label: 'Pagos sin convenio de doble tributación' },
];

// Tabla 13 ATS: Forma de pago
export const FORMA_PAGO_ATS = [
	{ value: '01', label: 'Sin utilización del sistema financiero' },
	{ value: '02', label: 'Cheque propio' },
	{ value: '03', label: 'Cheque de terceros' },
	{ value: '04', label: 'Cheque certificado' },
	{ value: '05', label: 'Cheque de gerencia' },
	{ value: '06', label: 'Débito de cuenta' },
	{ value: '07', label: 'Transferencia de fondos' },
	{ value: '08', label: 'Nota de crédito bancaria' },
	{ value: '09', label: 'Tarjeta prepago' },
	{ value: '10', label: 'Pago con tarjeta de crédito no bancaria' },
	{ value: '15', label: 'Compensación de deudas' },
	{ value: '16', label: 'Tarjeta de débito' },
	{ value: '17', label: 'Dinero electrónico' },
	{ value: '18', label: 'Tarjeta prepago' },
	{ value: '19', label: 'Tarjeta de crédito' },
	{ value: '20', label: 'Otros con utilización del sistema financiero' },
	{ value: '21', label: 'Endoso de títulos' },
];

// Tipo identificación ventas ATS
export const TIPO_ID_CLIENTE_VENTAS_ATS = [
	{ value: '04', label: 'RUC' },
	{ value: '05', label: 'Cédula' },
	{ value: '06', label: 'Pasaporte' },
	{ value: '07', label: 'Consumidor Final' },
	{ value: '08', label: 'Identificación del exterior' },
	{ value: '09', label: 'Placa' },
];

/**
 * Obtiene la etiqueta de un tipo de ID proveedor ATS
 * @param {string} codigo
 * @returns {string}
 */
export function getLabelTipoIdProveedorATS(codigo) {
	const tipo = TIPO_ID_PROVEEDOR_ATS.find((t) => t.value === codigo);
	return tipo ? tipo.label : codigo;
}

/**
 * Obtiene la etiqueta de un código de sustento ATS
 * @param {string} codigo
 * @returns {string}
 */
export function getLabelCodSustentoATS(codigo) {
	const cs = COD_SUSTENTO_ATS.find((c) => c.value === codigo);
	return cs ? cs.label : codigo;
}

/**
 * Obtiene la etiqueta de una forma de pago ATS
 * @param {string} codigo
 * @returns {string}
 */
export function getLabelFormaPagoATS(codigo) {
	const fp = FORMA_PAGO_ATS.find((f) => f.value === codigo);
	return fp ? fp.label : codigo;
}
