import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS } from '@/lib/suscripciones/plan-limits';

describe('PLAN_LIMITS', () => {
	it('starter tiene tope de comprobantes', () => {
		expect(PLAN_LIMITS.starter.comprobantes_mes).toBe(50);
	});

	it('enterprise tiene limites nulos', () => {
		expect(PLAN_LIMITS.enterprise.comprobantes_mes).toBeNull();
		expect(PLAN_LIMITS.enterprise.usuarios).toBeNull();
	});
});
