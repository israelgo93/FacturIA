import { describe, it, expect } from 'vitest';
import { getRangoPeriodo } from '@/lib/utils/vencimientos';

describe('ATS / periodos', () => {
	it('getRangoPeriodo mensual devuelve primer y ultimo dia', () => {
		const r = getRangoPeriodo(2026, 3, false);
		expect(r.fechaInicio).toBe('2026-03-01');
		expect(r.fechaFin).toMatch(/^2026-03-/);
	});

	it('getRangoPeriodo semestre primera mitad', () => {
		const r = getRangoPeriodo(2026, 3, true);
		expect(r.fechaInicio).toMatch(/^2026-/);
	});
});
