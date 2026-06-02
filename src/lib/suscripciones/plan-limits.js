/**
 * Definicion de referencia de planes para UI.
 * Valores null = ilimitado en UI.
 */
export const PLAN_LIMITS = {
	free: {
		nombre: 'Gratuito',
		comprobantes_anuales: 100,
		usuarios: 1,
		establecimientos: 1,
		puntos_emision: 1,
		reportes_ia: false,
		rdep: false,
		precio_mensual: 0,
		precio_anual: 0,
		pagos_habilitados: true,
	},
	starter: {
		nombre: 'Starter',
		comprobantes_anuales: 500,
		usuarios: 1,
		establecimientos: 1,
		puntos_emision: 1,
		reportes_ia: false,
		rdep: false,
		precio_mensual: 9.99,
		precio_anual: 119.88,
		pagos_habilitados: false,
	},
	professional: {
		nombre: 'Professional',
		comprobantes_anuales: 1000,
		usuarios: 5,
		establecimientos: 3,
		puntos_emision: 5,
		reportes_ia: true,
		rdep: true,
		precio_mensual: 24.99,
		precio_anual: 299.88,
		pagos_habilitados: false,
	},
	enterprise: {
		nombre: 'Enterprise',
		comprobantes_anuales: null,
		usuarios: null,
		establecimientos: null,
		puntos_emision: null,
		reportes_ia: true,
		rdep: true,
		precio_mensual: 49.99,
		precio_anual: 599.88,
		pagos_habilitados: false,
	},
};
