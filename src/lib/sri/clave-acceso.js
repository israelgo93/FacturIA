/**
 * Generador de Clave de Acceso para comprobantes electrónicos SRI
 * Ficha Técnica: Tabla 1 — Estructura Clave de Acceso
 * 
 * Estructura (49 dígitos):
 * [1-8]  Fecha emisión (ddmmaaaa)
 * [9-10] Tipo comprobante (01=Factura, 04=NC, etc.)
 * [11-23] RUC emisor (13 dígitos)
 * [24]   Ambiente (1=Pruebas, 2=Producción)
 * [25-27] Establecimiento (3 dígitos)
 * [28-30] Punto emisión (3 dígitos)
 * [31-39] Secuencial (9 dígitos)
 * [40-47] Código numérico aleatorio (8 dígitos)
 * [48]   Tipo emisión (1=Normal)
 * [49]   Dígito verificador (Módulo 11)
 */

/**
 * Genera los 49 dígitos de la clave de acceso
 * @param {Object} params
 * @param {Date|string} params.fechaEmision - Fecha de emisión
 * @param {string} params.tipoComprobante - Código tipo (01=Factura, 04=NC, etc.)
 * @param {string} params.ruc - RUC del emisor (13 dígitos)
 * @param {string} params.ambiente - 1=Pruebas, 2=Producción
 * @param {string} params.establecimiento - Código establecimiento (3 dígitos)
 * @param {string} params.puntoEmision - Código punto emisión (3 dígitos)
 * @param {string} params.secuencial - Secuencial (9 dígitos)
 * @param {string} [params.codigoNumerico] - Código numérico (8 dígitos, opcional)
 * @param {string} [params.tipoEmision='1'] - Tipo emisión (1=Normal)
 * @returns {string} Clave de acceso de 49 dígitos
 */
export function generarClaveAcceso({
	fechaEmision,
	tipoComprobante,
	ruc,
	ambiente,
	establecimiento,
	puntoEmision,
	secuencial,
	codigoNumerico,
	tipoEmision = '1',
}) {
	// Formatear fecha ddmmaaaa
	const fecha = formatearFecha(fechaEmision);

	// Generar código numérico aleatorio (8 dígitos) si no se proporciona
	const codNum = codigoNumerico || generarCodigoNumerico();

	// Construir los primeros 48 dígitos
	const clave48 = [
		fecha,            // 8 dígitos
		tipoComprobante,  // 2 dígitos
		ruc,              // 13 dígitos
		ambiente,         // 1 dígito
		establecimiento,  // 3 dígitos
		puntoEmision,     // 3 dígitos
		secuencial,       // 9 dígitos
		codNum,           // 8 dígitos
		tipoEmision,      // 1 dígito
	].join('');

	if (clave48.length !== 48) {
		throw new Error(
			`Clave debe tener 48 dígitos antes del verificador, tiene ${clave48.length}`
		);
	}

	// Validar que solo contenga dígitos
	if (!/^\d{48}$/.test(clave48)) {
		throw new Error('La clave de acceso solo debe contener dígitos numéricos');
	}

	// Calcular dígito verificador Módulo 11
	const digitoVerificador = calcularModulo11(clave48);

	return clave48 + digitoVerificador;
}

/**
 * Algoritmo Módulo 11 según Ficha Técnica SRI
 * Factores: 2,3,4,5,6,7 (cíclico de derecha a izquierda)
 * @param {string} cadena - Cadena numérica
 * @returns {string} Dígito verificador (0-9)
 */
export function calcularModulo11(cadena) {
	const factores = [2, 3, 4, 5, 6, 7];
	let suma = 0;

	// Recorrer de derecha a izquierda
	for (let i = cadena.length - 1, j = 0; i >= 0; i--, j++) {
		suma += parseInt(cadena[i], 10) * factores[j % 6];
	}

	const residuo = suma % 11;
	let digito = 11 - residuo;

	if (digito === 11) digito = 0;
	if (digito === 10) digito = 1;

	return digito.toString();
}

/**
 * Valida una clave de acceso existente
 * @param {string} clave - Clave de acceso a validar
 * @returns {{ valid: boolean, error?: string }}
 */
export function validarClaveAcceso(clave) {
	if (!/^\d{49}$/.test(clave)) {
		return { valid: false, error: 'Debe tener 49 dígitos numéricos' };
	}

	const clave48 = clave.substring(0, 48);
	const digitoEsperado = calcularModulo11(clave48);

	if (clave[48] !== digitoEsperado) {
		return {
			valid: false,
			error: `Dígito verificador inválido. Esperado: ${digitoEsperado}, Recibido: ${clave[48]}`,
		};
	}

	return { valid: true };
}

/**
 * Descompone una clave de acceso en sus partes
 * @param {string} clave - Clave de acceso de 49 dígitos
 * @returns {Object} Partes de la clave
 */
export function descomponerClaveAcceso(clave) {
	if (clave.length !== 49) return null;

	return {
		fechaEmision: clave.substring(0, 8),
		tipoComprobante: clave.substring(8, 10),
		ruc: clave.substring(10, 23),
		ambiente: clave.substring(23, 24),
		establecimiento: clave.substring(24, 27),
		puntoEmision: clave.substring(27, 30),
		secuencial: clave.substring(30, 39),
		codigoNumerico: clave.substring(39, 47),
		tipoEmision: clave.substring(47, 48),
		digitoVerificador: clave.substring(48, 49),
	};
}

/**
 * Formatea una fecha a ddmmaaaa
 * @param {Date|string} fecha
 * @returns {string} Fecha formateada
 */
function formatearFecha(fecha) {
	const d = new Date(fecha);
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const aaaa = String(d.getFullYear());
	return dd + mm + aaaa;
}

/**
 * Genera un código numérico aleatorio de 8 dígitos
 * @returns {string}
 */
function generarCodigoNumerico() {
	return String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
}
