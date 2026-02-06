import { z } from 'zod';

/**
 * Valida un RUC ecuatoriano (13 dígitos)
 */
export function validarRUC(ruc) {
	if (!ruc || ruc.length !== 13) return false;
	if (!/^\d{13}$/.test(ruc)) return false;
	if (!ruc.endsWith('001')) return false;

	const provincia = parseInt(ruc.substring(0, 2), 10);
	if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

	// Validar dígito verificador (módulo 10 o 11 según tipo)
	const tercerDigito = parseInt(ruc[2], 10);

	if (tercerDigito < 6) {
		// Persona natural: módulo 10
		return validarModulo10(ruc.substring(0, 10));
	} else if (tercerDigito === 6) {
		// Entidad pública: módulo 11, coeficientes 3,2,7,6,5,4,3,2
		return validarModulo11Publico(ruc.substring(0, 9));
	} else if (tercerDigito === 9) {
		// Sociedad: módulo 11, coeficientes 4,3,2,7,6,5,4,3,2
		return validarModulo11Sociedad(ruc.substring(0, 10));
	}

	return false;
}

/**
 * Valida una cédula ecuatoriana (10 dígitos)
 */
export function validarCedula(cedula) {
	if (!cedula || cedula.length !== 10) return false;
	if (!/^\d{10}$/.test(cedula)) return false;

	const provincia = parseInt(cedula.substring(0, 2), 10);
	if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

	return validarModulo10(cedula);
}

function validarModulo10(digitos) {
	const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
	let suma = 0;

	for (let i = 0; i < 9; i++) {
		let valor = parseInt(digitos[i], 10) * coeficientes[i];
		if (valor >= 10) valor -= 9;
		suma += valor;
	}

	const residuo = suma % 10;
	const verificador = residuo === 0 ? 0 : 10 - residuo;
	return verificador === parseInt(digitos[9], 10);
}

function validarModulo11Publico(digitos) {
	const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
	let suma = 0;

	for (let i = 0; i < 8; i++) {
		suma += parseInt(digitos[i], 10) * coeficientes[i];
	}

	const residuo = suma % 11;
	const verificador = residuo === 0 ? 0 : 11 - residuo;
	return verificador === parseInt(digitos[8], 10);
}

function validarModulo11Sociedad(digitos) {
	const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
	let suma = 0;

	for (let i = 0; i < 9; i++) {
		suma += parseInt(digitos[i], 10) * coeficientes[i];
	}

	const residuo = suma % 11;
	const verificador = residuo === 0 ? 0 : 11 - residuo;
	return verificador === parseInt(digitos[9], 10);
}

/**
 * Validación de identificación según tipo
 */
export function validarIdentificacion(tipo, identificacion) {
	switch (tipo) {
		case '04': return validarRUC(identificacion);
		case '05': return validarCedula(identificacion);
		case '07': return identificacion === '9999999999999';
		case '06':
		case '08': return identificacion && identificacion.length >= 3;
		default: return false;
	}
}

// Schema Zod reutilizable para identificación
export const identificacionSchema = z.object({
	tipo_identificacion: z.string().min(1, 'El tipo de identificación es requerido'),
	identificacion: z.string().min(1, 'La identificación es requerida'),
}).refine(
	(data) => validarIdentificacion(data.tipo_identificacion, data.identificacion),
	{ message: 'La identificación no es válida', path: ['identificacion'] }
);
