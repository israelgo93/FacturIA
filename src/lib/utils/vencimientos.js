/**
 * Calendario de vencimientos tributarios Ecuador
 * Según noveno dígito del RUC
 */

const DIAS_POR_DIGITO = {
	1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
	6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
};

/**
 * Calcula la fecha de vencimiento de una declaración
 * @param {string} ruc - RUC de la empresa (13 dígitos)
 * @param {number} anio - Año fiscal
 * @param {number} mes - Mes del período (1-12)
 * @returns {Date} Fecha de vencimiento
 */
export function calcularVencimiento(ruc, anio, mes) {
	const novenoDigito = parseInt(ruc[8]);
	const dia = DIAS_POR_DIGITO[novenoDigito] || 28;

	let mesSiguiente = mes + 1;
	let anioVencimiento = anio;
	if (mesSiguiente > 12) {
		mesSiguiente = 1;
		anioVencimiento++;
	}

	return new Date(anioVencimiento, mesSiguiente - 1, dia);
}

/**
 * Calcula los días restantes hasta el vencimiento
 * @param {string} ruc
 * @param {number} anio
 * @param {number} mes
 * @returns {number} Días restantes (negativo si ya venció)
 */
export function diasParaVencimiento(ruc, anio, mes) {
	const vencimiento = calcularVencimiento(ruc, anio, mes);
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
	return diff;
}

/**
 * Formatea la fecha de vencimiento en texto legible
 * @param {string} ruc
 * @param {number} anio
 * @param {number} mes
 * @returns {{ fecha: string, dias: number, estado: string }}
 */
export function infoVencimiento(ruc, anio, mes) {
	const vencimiento = calcularVencimiento(ruc, anio, mes);
	const dias = diasParaVencimiento(ruc, anio, mes);
	const fecha = vencimiento.toLocaleDateString('es-EC', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});

	let estado = 'normal';
	if (dias < 0) estado = 'vencido';
	else if (dias <= 5) estado = 'urgente';
	else if (dias <= 10) estado = 'proximo';

	return { fecha, dias, estado };
}

/**
 * Obtiene el rango de fechas de un período
 * @param {number} anio
 * @param {number} mes - Mes (1-12)
 * @param {boolean} esSemestral
 * @returns {{ fechaInicio: string, fechaFin: string }}
 */
export function getRangoPeriodo(anio, mes, esSemestral = false) {
	if (esSemestral) {
		if (mes <= 6) {
			return {
				fechaInicio: `${anio}-01-01`,
				fechaFin: `${anio}-06-30`,
			};
		}
		return {
			fechaInicio: `${anio}-07-01`,
			fechaFin: `${anio}-12-31`,
		};
	}

	const mesStr = String(mes).padStart(2, '0');
	const lastDay = new Date(anio, mes, 0).getDate();
	return {
		fechaInicio: `${anio}-${mesStr}-01`,
		fechaFin: `${anio}-${mesStr}-${lastDay}`,
	};
}

/**
 * Determina la periodicidad del ATS según régimen
 * @param {string} regimenFiscal
 * @returns {'MENSUAL' | 'SEMESTRAL'}
 */
export function getPeriodicidadATS(regimenFiscal) {
	if (regimenFiscal === 'RIMPE_EMPRENDEDOR') return 'SEMESTRAL';
	return 'MENSUAL';
}
