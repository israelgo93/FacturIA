import { describe, it, expect } from 'vitest';
import { resolveEstadoKey, ESTADOS } from '@/components/comprobantes/StatusBadge.jsx';

describe('StatusBadge helpers', () => {
	it('resuelve claves SRI y estados genericos', () => {
		expect(resolveEstadoKey('AUT')).toBe('AUT');
		expect(resolveEstadoKey('draft')).toBe('draft');
		expect(ESTADOS['activa']).toBeDefined();
	});
});
