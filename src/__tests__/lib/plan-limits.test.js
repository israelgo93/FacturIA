import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS } from '@/lib/suscripciones/plan-limits';

describe('PLAN_LIMITS', () => {
	it('gratuito tiene 100 documentos anuales', () => {
		expect(PLAN_LIMITS.free.comprobantes_anuales).toBe(100);
		expect(PLAN_LIMITS.free.precio_mensual).toBe(0);
	});

	it('starter y professional definen documentos anuales', () => {
		expect(PLAN_LIMITS.starter.comprobantes_anuales).toBe(500);
		expect(PLAN_LIMITS.professional.comprobantes_anuales).toBe(1000);
	});

	it('enterprise tiene limites nulos y pagos deshabilitados', () => {
		expect(PLAN_LIMITS.enterprise.comprobantes_anuales).toBeNull();
		expect(PLAN_LIMITS.enterprise.usuarios).toBeNull();
		expect(PLAN_LIMITS.enterprise.pagos_habilitados).toBe(false);
	});
});
