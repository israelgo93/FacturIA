/**
 * Validaciones específicas para factura electrónica
 * Valida datos antes de generar XML para el SRI
 */
import { TARIFAS_IVA, FORMAS_PAGO, TIPOS_IDENTIFICACION, TIPOS_COMPROBANTE } from '@/lib/utils/sri-catalogs';

// ============================================================
// Validación estructural de cédula y RUC ecuatorianos
// ============================================================

/**
 * Valida una cédula ecuatoriana (10 dígitos, módulo 10)
 * @param {string} cedula
 * @returns {{ valid: boolean, error?: string }}
 */
export function validarCedulaEcuador(cedula) {
	if (!cedula || typeof cedula !== 'string') {
		return { valid: false, error: 'Cédula es requerida' };
	}
	if (!/^\d{10}$/.test(cedula)) {
		return { valid: false, error: 'Cédula debe tener exactamente 10 dígitos numéricos' };
	}

	const provincia = parseInt(cedula.substring(0, 2), 10);
	if (provincia < 1 || provincia > 24) {
		return { valid: false, error: `Código de provincia inválido: ${provincia}. Debe ser 01-24` };
	}

	const tercerDigito = parseInt(cedula[2], 10);
	if (tercerDigito > 5) {
		return { valid: false, error: `Tercer dígito inválido para cédula: ${tercerDigito}. Debe ser 0-5` };
	}

	// Algoritmo módulo 10
	const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
	let suma = 0;
	for (let i = 0; i < 9; i++) {
		let valor = parseInt(cedula[i], 10) * coeficientes[i];
		if (valor >= 10) valor -= 9;
		suma += valor;
	}
	const digitoVerificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);

	if (digitoVerificador !== parseInt(cedula[9], 10)) {
		return { valid: false, error: 'Dígito verificador de cédula incorrecto' };
	}

	return { valid: true };
}

/**
 * Valida un RUC ecuatoriano (13 dígitos)
 * Soporta: persona natural (3er dígito 0-5), sociedad privada (3er dígito 9),
 * entidad pública (3er dígito 6)
 * @param {string} ruc
 * @returns {{ valid: boolean, error?: string }}
 */
export function validarRucEcuador(ruc) {
	if (!ruc || typeof ruc !== 'string') {
		return { valid: false, error: 'RUC es requerido' };
	}
	if (!/^\d{13}$/.test(ruc)) {
		return { valid: false, error: 'RUC debe tener exactamente 13 dígitos numéricos' };
	}

	// Los últimos 3 dígitos deben ser 001 o mayor
	const sucursal = ruc.substring(10, 13);
	if (sucursal === '000') {
		return { valid: false, error: 'Los 3 últimos dígitos del RUC no pueden ser 000' };
	}

	const provincia = parseInt(ruc.substring(0, 2), 10);
	if (provincia < 1 || provincia > 24) {
		return { valid: false, error: `Código de provincia inválido: ${provincia}. Debe ser 01-24` };
	}

	const tercerDigito = parseInt(ruc[2], 10);

	// Persona natural: 3er dígito 0-5 → módulo 10 (igual que cédula)
	if (tercerDigito >= 0 && tercerDigito <= 5) {
		const validacionCedula = validarCedulaEcuador(ruc.substring(0, 10));
		if (!validacionCedula.valid) {
			return { valid: false, error: `RUC persona natural inválido: ${validacionCedula.error}` };
		}
		return { valid: true };
	}

	// Entidad pública: 3er dígito = 6 → módulo 11
	if (tercerDigito === 6) {
		const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
		let suma = 0;
		for (let i = 0; i < 8; i++) {
			suma += parseInt(ruc[i], 10) * coeficientes[i];
		}
		const residuo = suma % 11;
		const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

		if (digitoVerificador !== parseInt(ruc[8], 10)) {
			return { valid: false, error: 'Dígito verificador de RUC público incorrecto' };
		}
		return { valid: true };
	}

	// Sociedad privada: 3er dígito = 9 → módulo 11
	if (tercerDigito === 9) {
		const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
		let suma = 0;
		for (let i = 0; i < 9; i++) {
			suma += parseInt(ruc[i], 10) * coeficientes[i];
		}
		const residuo = suma % 11;
		const digitoVerificador = residuo === 0 ? 0 : 11 - residuo;

		if (digitoVerificador !== parseInt(ruc[9], 10)) {
			return { valid: false, error: 'Dígito verificador de RUC sociedad privada incorrecto' };
		}
		return { valid: true };
	}

	return { valid: false, error: `Tercer dígito inválido para RUC: ${tercerDigito}` };
}

// ============================================================
// Validación de factura electrónica
// ============================================================

/**
 * Valida los datos completos de un comprobante antes de generar XML.
 * Soporta: Factura (01), Liquidación de Compra (03), Nota de Crédito (04),
 * Nota de Débito (05), Guía de Remisión (06), Retención (07).
 * @param {Object} datos - Datos del comprobante
 * @param {string} [tipoComprobante] - Código del tipo ('01','03','04','05','06','07'). Si no se pasa, se infiere de datos.tipoComprobante
 * @returns {{ valid: boolean, errores: string[] }}
 */
export function validarFactura(datos, tipoComprobante) {
	const tipo = tipoComprobante || datos.tipoComprobante || '01';
	const errores = [];

	// === Validar emisor (común a todos) ===
	validarEmisor(datos, errores);

	// === Validar ambiente (común a todos) ===
	if (!['1', '2'].includes(datos.ambiente)) {
		errores.push('Ambiente debe ser 1 (Pruebas) o 2 (Producción)');
	}

	// === Validación específica por tipo ===
	switch (tipo) {
		case '01': // Factura
		case '04': // Nota de Crédito
		case '05': // Nota de Débito
			validarSujetoComprador(datos, errores);
			break;
		case '03': // Liquidación de Compra — usa proveedor
			validarSujetoProveedor(datos, errores);
			break;
		case '06': // Guía de Remisión — usa transportista + destinatarios
			validarGuiaRemision(datos, errores);
			break;
		case '07': // Retención — usa sujetoRetenido + docsSustento
			validarRetencion(datos, errores);
			break;
		default:
			// Fallback: validar como factura para compatibilidad
			validarSujetoComprador(datos, errores);
			break;
	}

	// === Validar detalles y pagos (solo para tipos con detalles estándar) ===
	if (['01', '03', '04'].includes(tipo)) {
		validarDetalles(datos, errores);
	}
	if (['01', '03', '05'].includes(tipo)) {
		validarPagos(datos, errores);
	}

	// === Validar totales (para tipos que los usan) ===
	if (['01', '03', '04', '05'].includes(tipo)) {
		validarTotales(datos, errores);
	}

	// === Validaciones específicas adicionales ===
	if (tipo === '04') {
		// Nota de Crédito: doc sustento requerido
		if (!datos.docSustento?.tipo || !datos.docSustento?.numero || !datos.docSustento?.fecha) {
			errores.push('Nota de Crédito requiere documento sustento (tipo, número y fecha)');
		}
		if (!datos.motivo) {
			errores.push('Motivo de la nota de crédito es requerido');
		}
	}
	if (tipo === '05') {
		// Nota de Débito: doc sustento + motivos requeridos
		if (!datos.docSustento?.tipo || !datos.docSustento?.numero || !datos.docSustento?.fecha) {
			errores.push('Nota de Débito requiere documento sustento (tipo, número y fecha)');
		}
		if (!datos.motivos || datos.motivos.length === 0) {
			errores.push('Nota de Débito debe tener al menos un motivo');
		}
	}

	return {
		valid: errores.length === 0,
		errores,
	};
}

// ============================================================
// Funciones de validación por sección
// ============================================================

/**
 * Valida datos del emisor (común a todos los comprobantes)
 */
function validarEmisor(datos, errores) {
	if (!datos.emisor?.ruc) {
		errores.push('RUC del emisor es requerido');
	} else if (!/^\d{13}$/.test(datos.emisor.ruc)) {
		errores.push('RUC del emisor debe tener exactamente 13 dígitos numéricos');
	} else {
		const validacionRuc = validarRucEcuador(datos.emisor.ruc);
		if (!validacionRuc.valid) {
			console.warn(`[Validación] Advertencia RUC emisor: ${validacionRuc.error} — se permite porque ya está registrado ante el SRI`);
		}
	}
	if (!datos.emisor?.razonSocial) {
		errores.push('Razón social del emisor es requerida');
	}
	if (!datos.emisor?.direccion) {
		errores.push('Dirección matriz del emisor es requerida');
	}
}

/**
 * Valida sujeto tipo comprador (Factura 01, NC 04, ND 05)
 */
function validarSujetoComprador(datos, errores) {
	if (!datos.comprador?.tipoIdentificacion) {
		errores.push('Tipo de identificación del comprador es requerido');
	} else {
		const tipoValido = TIPOS_IDENTIFICACION.find(
			(t) => t.value === datos.comprador.tipoIdentificacion
		);
		if (!tipoValido) {
			errores.push(`Tipo de identificación inválido: ${datos.comprador.tipoIdentificacion}`);
		}
	}
	if (!datos.comprador?.identificacion) {
		errores.push('Identificación del comprador es requerida');
	}
	if (!datos.comprador?.razonSocial) {
		errores.push('Razón social del comprador es requerida');
	}

	// Validar RUC si tipo es 04
	if (datos.comprador?.tipoIdentificacion === '04' && datos.comprador.identificacion) {
		const validacionRuc = validarRucEcuador(datos.comprador.identificacion);
		if (!validacionRuc.valid) {
			errores.push(`RUC del comprador inválido: ${validacionRuc.error}`);
		}
	}
	// Validar cédula si tipo es 05
	if (datos.comprador?.tipoIdentificacion === '05' && datos.comprador.identificacion) {
		const validacionCedula = validarCedulaEcuador(datos.comprador.identificacion);
		if (!validacionCedula.valid) {
			errores.push(`Cédula del comprador inválida: ${validacionCedula.error}`);
		}
	}
}

/**
 * Valida sujeto tipo proveedor (Liquidación de Compra 03)
 */
function validarSujetoProveedor(datos, errores) {
	if (!datos.proveedor?.tipoIdentificacion) {
		errores.push('Tipo de identificación del proveedor es requerido');
	} else {
		const tipoValido = TIPOS_IDENTIFICACION.find(
			(t) => t.value === datos.proveedor.tipoIdentificacion
		);
		if (!tipoValido) {
			errores.push(`Tipo de identificación del proveedor inválido: ${datos.proveedor.tipoIdentificacion}`);
		}
	}
	if (!datos.proveedor?.identificacion) {
		errores.push('Identificación del proveedor es requerida');
	}
	if (!datos.proveedor?.razonSocial) {
		errores.push('Razón social del proveedor es requerida');
	}

	// Validar cédula si tipo es 05
	if (datos.proveedor?.tipoIdentificacion === '05' && datos.proveedor.identificacion) {
		const validacionCedula = validarCedulaEcuador(datos.proveedor.identificacion);
		if (!validacionCedula.valid) {
			errores.push(`Cédula del proveedor inválida: ${validacionCedula.error}`);
		}
	}
	// Validar RUC si tipo es 04
	if (datos.proveedor?.tipoIdentificacion === '04' && datos.proveedor.identificacion) {
		const validacionRuc = validarRucEcuador(datos.proveedor.identificacion);
		if (!validacionRuc.valid) {
			errores.push(`RUC del proveedor inválido: ${validacionRuc.error}`);
		}
	}
}

/**
 * Valida datos de Guía de Remisión (06)
 */
function validarGuiaRemision(datos, errores) {
	if (!datos.dirPartida) {
		errores.push('Dirección de partida es requerida');
	}
	if (!datos.transportista?.identificacion) {
		errores.push('Identificación del transportista es requerida');
	}
	if (!datos.transportista?.razonSocial) {
		errores.push('Razón social del transportista es requerida');
	}
	if (!datos.placa) {
		errores.push('Placa del vehículo es requerida');
	}
	if (!datos.fechaIniTransporte) {
		errores.push('Fecha de inicio de transporte es requerida');
	}
	if (!datos.fechaFinTransporte) {
		errores.push('Fecha de fin de transporte es requerida');
	}
	if (!datos.destinatarios || datos.destinatarios.length === 0) {
		errores.push('Guía de Remisión debe tener al menos un destinatario');
	}
}

/**
 * Valida datos de Retención (07)
 */
function validarRetencion(datos, errores) {
	if (!datos.sujetoRetenido?.identificacion) {
		errores.push('Identificación del sujeto retenido es requerida');
	}
	if (!datos.sujetoRetenido?.razonSocial) {
		errores.push('Razón social del sujeto retenido es requerida');
	}
	if (!datos.periodoFiscal) {
		errores.push('Período fiscal es requerido');
	}
	if (!datos.documentosSustento || datos.documentosSustento.length === 0) {
		errores.push('Retención debe tener al menos un documento sustento');
	} else {
		datos.documentosSustento.forEach((doc, i) => {
			if (!doc.codDocSustento || !doc.numDocSustento) {
				errores.push(`Doc sustento ${i + 1}: código y número son requeridos`);
			}
			if (!doc.retenciones || doc.retenciones.length === 0) {
				errores.push(`Doc sustento ${i + 1}: debe tener al menos una retención`);
			}
		});
	}
}

/**
 * Valida detalles (para Factura, LC, NC)
 */
function validarDetalles(datos, errores) {
	if (!datos.detalles || datos.detalles.length === 0) {
		errores.push('El comprobante debe tener al menos un detalle');
	} else {
		datos.detalles.forEach((det, i) => {
			if (!det.codigoPrincipal) {
				errores.push(`Detalle ${i + 1}: código principal es requerido`);
			}
			if (!det.descripcion) {
				errores.push(`Detalle ${i + 1}: descripción es requerida`);
			}
			if (!det.cantidad || Number(det.cantidad) <= 0) {
				errores.push(`Detalle ${i + 1}: cantidad debe ser mayor a 0`);
			}
			if (det.precioUnitario === undefined || Number(det.precioUnitario) < 0) {
				errores.push(`Detalle ${i + 1}: precio unitario inválido`);
			}
			if (!det.impuestos || det.impuestos.length === 0) {
				errores.push(`Detalle ${i + 1}: debe tener al menos un impuesto`);
			} else {
				det.impuestos.forEach((imp) => {
					if (!imp.codigo || !imp.codigoPorcentaje) {
						errores.push(`Detalle ${i + 1}: impuesto con datos incompletos`);
					}
				});
			}
		});
	}
}

/**
 * Valida pagos (para Factura, LC, ND)
 */
function validarPagos(datos, errores) {
	if (!datos.pagos || datos.pagos.length === 0) {
		errores.push('El comprobante debe tener al menos una forma de pago');
	} else {
		datos.pagos.forEach((pago, i) => {
			const formaPagoValida = FORMAS_PAGO.find((fp) => fp.value === pago.formaPago);
			if (!formaPagoValida) {
				errores.push(`Pago ${i + 1}: forma de pago inválida: ${pago.formaPago}`);
			}
			if (!pago.total || Number(pago.total) <= 0) {
				errores.push(`Pago ${i + 1}: total debe ser mayor a 0`);
			}
		});
	}
}

/**
 * Valida totales (para Factura, LC, NC, ND)
 */
function validarTotales(datos, errores) {
	if (datos.totales) {
		const importeTotal = Number(datos.totales.importeTotal || datos.totales.valorModificacion || datos.totales.valorTotal || 0);
		if (importeTotal < 0) {
			errores.push('Importe total no puede ser negativo');
		}

		// Validar que la suma de pagos coincida con importe total (solo si hay pagos)
		if (datos.pagos && datos.pagos.length > 0) {
			const sumaPagos = datos.pagos.reduce((sum, p) => sum + Number(p.total), 0);
			const diff = Math.abs(sumaPagos - importeTotal);
			if (diff > 0.01) {
				errores.push(
					`Suma de pagos (${sumaPagos.toFixed(2)}) no coincide con importe total (${importeTotal.toFixed(2)})`
				);
			}
		}
	} else {
		errores.push('Totales son requeridos');
	}
}

/**
 * Calcula los totales de impuestos agrupados desde los detalles
 * @param {Array} detalles - Detalles con impuestos
 * @returns {Array} Impuestos agrupados por código+codigoPorcentaje
 */
export function calcularTotalesImpuestos(detalles) {
	const agrupados = {};

	for (const detalle of detalles) {
		for (const imp of (detalle.impuestos || [])) {
			const key = `${imp.codigo}-${imp.codigoPorcentaje}`;
			if (!agrupados[key]) {
				agrupados[key] = {
					codigo: imp.codigo,
					codigoPorcentaje: imp.codigoPorcentaje,
					baseImponible: 0,
					valor: 0,
				};
			}
			agrupados[key].baseImponible += Number(imp.baseImponible);
			agrupados[key].valor += Number(imp.valor);
		}
	}

	return Object.values(agrupados);
}

/**
 * Calcula el subtotal sin impuestos de un detalle
 * @param {number} cantidad
 * @param {number} precioUnitario
 * @param {number} descuento
 * @returns {number}
 */
export function calcularSubtotalDetalle(cantidad, precioUnitario, descuento = 0) {
	return Number(cantidad) * Number(precioUnitario) - Number(descuento);
}

/**
 * Calcula el valor del impuesto para un detalle
 * @param {number} baseImponible
 * @param {number} tarifa - Porcentaje (ej: 15, 12, 5, 0)
 * @returns {number}
 */
export function calcularValorImpuesto(baseImponible, tarifa) {
	return Number(baseImponible) * (Number(tarifa) / 100);
}
