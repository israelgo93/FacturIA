/**
 * Definicion de referencia de planes (alineada a seed SQL y tabla planes).
 * Valores null = ilimitado en UI.
 */
export const PLAN_LIMITS = {
	starter: {
		comprobantes_mes: 50,
		usuarios: 1,
		establecimientos: 1,
		puntos_emision: 1,
		reportes_ia: false,
		rdep: false,
		precio_mensual: 9.99,
	},
	professional: {
		comprobantes_mes: 300,
		usuarios: 5,
		establecimientos: 3,
		puntos_emision: 5,
		reportes_ia: true,
		rdep: true,
		precio_mensual: 24.99,
	},
	enterprise: {
		comprobantes_mes: null,
		usuarios: null,
		establecimientos: null,
		puntos_emision: null,
		reportes_ia: true,
		rdep: true,
		precio_mensual: 49.99,
	},
};
