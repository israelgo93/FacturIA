/**
 * Validaciones específicas para factura electrónica
 * Valida datos antes de generar XML para el SRI
 */
import { TARIFAS_IVA, FORMAS_PAGO, TIPOS_IDENTIFICACION, TIPOS_COMPROBANTE } from '@/lib/utils/sri-catalogs';

/**
 * Valida los datos completos de una factura antes de generar XML
 * @param {Object} factura - Datos de la factura
 * @returns {{ valid: boolean, errores: string[] }}
 */
export function validarFactura(factura) {
	const errores = [];

	// Validar emisor
	if (!factura.emisor?.ruc || factura.emisor.ruc.length !== 13) {
		errores.push('RUC del emisor debe tener 13 dígitos');
	}
	if (!factura.emisor?.razonSocial) {
		errores.push('Razón social del emisor es requerida');
	}
	if (!factura.emisor?.direccion) {
		errores.push('Dirección matriz del emisor es requerida');
	}

	// Validar comprador
	if (!factura.comprador?.tipoIdentificacion) {
		errores.push('Tipo de identificación del comprador es requerido');
	} else {
		const tipoValido = TIPOS_IDENTIFICACION.find(
			(t) => t.value === factura.comprador.tipoIdentificacion
		);
		if (!tipoValido) {
			errores.push(`Tipo de identificación inválido: ${factura.comprador.tipoIdentificacion}`);
		}
	}
	if (!factura.comprador?.identificacion) {
		errores.push('Identificación del comprador es requerida');
	}
	if (!factura.comprador?.razonSocial) {
		errores.push('Razón social del comprador es requerida');
	}

	// Validar RUC del comprador si tipo es 04
	if (factura.comprador?.tipoIdentificacion === '04') {
		if (factura.comprador.identificacion?.length !== 13) {
			errores.push('RUC del comprador debe tener 13 dígitos');
		}
	}
	// Validar cédula si tipo es 05
	if (factura.comprador?.tipoIdentificacion === '05') {
		if (factura.comprador.identificacion?.length !== 10) {
			errores.push('Cédula del comprador debe tener 10 dígitos');
		}
	}

	// Validar detalles
	if (!factura.detalles || factura.detalles.length === 0) {
		errores.push('La factura debe tener al menos un detalle');
	} else {
		factura.detalles.forEach((det, i) => {
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

	// Validar pagos
	if (!factura.pagos || factura.pagos.length === 0) {
		errores.push('La factura debe tener al menos una forma de pago');
	} else {
		factura.pagos.forEach((pago, i) => {
			const formaPagoValida = FORMAS_PAGO.find((fp) => fp.value === pago.formaPago);
			if (!formaPagoValida) {
				errores.push(`Pago ${i + 1}: forma de pago inválida: ${pago.formaPago}`);
			}
			if (!pago.total || Number(pago.total) <= 0) {
				errores.push(`Pago ${i + 1}: total debe ser mayor a 0`);
			}
		});
	}

	// Validar totales
	if (factura.totales) {
		if (Number(factura.totales.importeTotal) < 0) {
			errores.push('Importe total no puede ser negativo');
		}

		// Validar que la suma de pagos coincida con importe total
		if (factura.pagos && factura.pagos.length > 0) {
			const sumaPagos = factura.pagos.reduce((sum, p) => sum + Number(p.total), 0);
			const diff = Math.abs(sumaPagos - Number(factura.totales.importeTotal));
			if (diff > 0.01) {
				errores.push(
					`Suma de pagos (${sumaPagos.toFixed(2)}) no coincide con importe total (${Number(factura.totales.importeTotal).toFixed(2)})`
				);
			}
		}
	} else {
		errores.push('Totales son requeridos');
	}

	// Validar ambiente
	if (!['1', '2'].includes(factura.ambiente)) {
		errores.push('Ambiente debe ser 1 (Pruebas) o 2 (Producción)');
	}

	return {
		valid: errores.length === 0,
		errores,
	};
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
