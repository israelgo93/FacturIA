// =============================================
// Funciones de formateo para facturIA
// =============================================

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un valor como moneda USD
 * @param {number} value - Valor numérico
 * @returns {string} Valor formateado como $X,XXX.XX
 */
export function formatCurrency(value) {
	if (value == null || isNaN(value)) return '$0.00';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

/**
 * Formatea una fecha al formato ecuatoriano dd/mm/aaaa
 * @param {string|Date} date - Fecha
 * @returns {string} Fecha formateada
 */
export function formatDate(date) {
	if (!date) return '';
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'dd/MM/yyyy');
}

/**
 * Formatea una fecha con hora
 * @param {string|Date} date - Fecha con hora
 * @returns {string} Fecha y hora formateada
 */
export function formatDateTime(date) {
	if (!date) return '';
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

/**
 * Formatea una fecha relativa (hace X minutos, etc.)
 * @param {string|Date} date - Fecha
 * @returns {string} Texto relativo
 */
export function formatRelativeDate(date) {
	if (!date) return '';
	const d = typeof date === 'string' ? parseISO(date) : date;
	const now = new Date();
	const diffMs = now - d;
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMins < 1) return 'Ahora mismo';
	if (diffMins < 60) return `Hace ${diffMins} min`;
	if (diffHours < 24) return `Hace ${diffHours}h`;
	if (diffDays < 7) return `Hace ${diffDays}d`;
	return formatDate(d);
}

/**
 * Formatea un RUC o cédula con guiones
 * @param {string} id - Número de identificación
 * @returns {string} Identificación formateada
 */
export function formatIdentificacion(id) {
	if (!id) return '';
	if (id.length === 13) return `${id.slice(0, 4)}-${id.slice(4, 10)}-${id.slice(10)}`;
	if (id.length === 10) return `${id.slice(0, 4)}-${id.slice(4, 10)}`;
	return id;
}

/**
 * Formatea secuencial a 9 dígitos con ceros
 * @param {number|string} seq - Secuencial
 * @returns {string} Secuencial de 9 dígitos
 */
export function formatSecuencial(seq) {
	return String(seq).padStart(9, '0');
}

/**
 * Formatea serie del comprobante (estab-ptoEmi)
 * @param {string} estab - Código establecimiento (3 dígitos)
 * @param {string} ptoEmi - Código punto de emisión (3 dígitos)
 * @returns {string} Serie formateada 001-001
 */
export function formatSerie(estab, ptoEmi) {
	return `${String(estab).padStart(3, '0')}-${String(ptoEmi).padStart(3, '0')}`;
}

/**
 * Formatea número completo del comprobante
 * @param {string} estab - Código establecimiento
 * @param {string} ptoEmi - Código punto de emisión
 * @param {string|number} secuencial - Secuencial
 * @returns {string} Número formateado 001-001-000000001
 */
export function formatNumeroComprobante(estab, ptoEmi, secuencial) {
	return `${formatSerie(estab, ptoEmi)}-${formatSecuencial(secuencial)}`;
}
