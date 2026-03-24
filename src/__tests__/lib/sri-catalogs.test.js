import { describe, it, expect } from 'vitest';
import { getLabelTipoIdProveedorATS } from '@/lib/utils/sri-catalogs';

describe('catalogos SRI', () => {
	it('resuelve etiqueta tipo identificacion proveedor ATS', () => {
		const label = getLabelTipoIdProveedorATS('01');
		expect(typeof label).toBe('string');
		expect(label.length).toBeGreaterThan(0);
	});
});
