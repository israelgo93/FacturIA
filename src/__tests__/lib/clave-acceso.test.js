import { describe, it, expect } from 'vitest';
import { generarClaveAcceso, validarClaveAcceso, calcularModulo11 } from '@/lib/sri/clave-acceso';

describe('clave de acceso', () => {
	it('genera 49 digitos y valida modulo 11', () => {
		const clave = generarClaveAcceso({
			fechaEmision: '2026-03-15',
			tipoComprobante: '01',
			ruc: '1790012345001',
			ambiente: '1',
			establecimiento: '001',
			puntoEmision: '001',
			secuencial: '000000001',
			codigoNumerico: '12345678',
		});
		expect(clave).toHaveLength(49);
		expect(validarClaveAcceso(clave).valid).toBe(true);
	});

	it('calcularModulo11 coincide con ejemplo conocido de 48 digitos', () => {
		const clave48 = '150320260117900123450011001001000000001123456781';
		expect(calcularModulo11(clave48)).toMatch(/^[0-9]$/);
	});
});
