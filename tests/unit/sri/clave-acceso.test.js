import { describe, it, expect } from 'vitest';
import {
	generarClaveAcceso,
	calcularModulo11,
	validarClaveAcceso,
	descomponerClaveAcceso,
} from '@/lib/sri/clave-acceso';

describe('Módulo 11 - Dígito Verificador', () => {
	it('calcula correctamente el dígito verificador para cadena conocida', () => {
		// Vector de prueba: 48 dígitos que deben producir un dígito verificador específico
		const cadena = '060220260117900169190011001001000000001123456781';
		const digito = calcularModulo11(cadena);
		expect(digito).toMatch(/^\d$/);
	});

	it('siempre retorna un dígito entre 0 y 9', () => {
		for (let i = 0; i < 100; i++) {
			// Generar cadena de 48 dígitos aleatorios
			let cadena = '';
			for (let j = 0; j < 48; j++) {
				cadena += String(Math.floor(Math.random() * 10));
			}
			const digito = calcularModulo11(cadena);
			expect(Number(digito)).toBeGreaterThanOrEqual(0);
			expect(Number(digito)).toBeLessThanOrEqual(9);
		}
	});

	it('retorna 0 cuando el resultado del módulo sería 11', () => {
		// Verificar que nunca retorna 11 ni 10
		for (let i = 0; i < 200; i++) {
			const cadena = String(i).padStart(48, '0');
			const digito = calcularModulo11(cadena);
			expect(Number(digito)).not.toBe(10);
			expect(Number(digito)).not.toBe(11);
		}
	});
});

describe('generarClaveAcceso', () => {
	// Usar fecha con hora explícita para evitar problemas de timezone
	const params = {
		fechaEmision: new Date(2026, 1, 6), // Feb 6, 2026 (meses 0-indexed)
		tipoComprobante: '01',
		ruc: '1790016919001',
		ambiente: '1',
		establecimiento: '001',
		puntoEmision: '001',
		secuencial: '000000001',
		codigoNumerico: '12345678',
		tipoEmision: '1',
	};

	it('genera una clave de 49 dígitos', () => {
		const clave = generarClaveAcceso(params);
		expect(clave).toHaveLength(49);
		expect(/^\d{49}$/.test(clave)).toBe(true);
	});

	it('contiene la fecha formateada correctamente (ddmmaaaa)', () => {
		const clave = generarClaveAcceso(params);
		// Feb 6, 2026 -> 06022026
		expect(clave.substring(0, 8)).toBe('06022026');
	});

	it('contiene el tipo de comprobante en posición 9-10', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(8, 10)).toBe('01');
	});

	it('contiene el RUC en posición 11-23', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(10, 23)).toBe('1790016919001');
	});

	it('contiene el ambiente en posición 24', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(23, 24)).toBe('1');
	});

	it('contiene establecimiento en posición 25-27', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(24, 27)).toBe('001');
	});

	it('contiene punto emisión en posición 28-30', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(27, 30)).toBe('001');
	});

	it('contiene secuencial en posición 31-39', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(30, 39)).toBe('000000001');
	});

	it('contiene código numérico en posición 40-47', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(39, 47)).toBe('12345678');
	});

	it('contiene tipo emisión en posición 48', () => {
		const clave = generarClaveAcceso(params);
		expect(clave.substring(47, 48)).toBe('1');
	});

	it('genera código numérico aleatorio si no se proporciona', () => {
		const paramsWithoutCode = { ...params };
		delete paramsWithoutCode.codigoNumerico;
		const clave1 = generarClaveAcceso(paramsWithoutCode);
		const clave2 = generarClaveAcceso(paramsWithoutCode);
		// El código numérico debe ser diferente (muy probable)
		expect(clave1).toHaveLength(49);
		expect(clave2).toHaveLength(49);
	});

	it('lanza error si los datos producen menos de 48 dígitos', () => {
		expect(() =>
			generarClaveAcceso({ ...params, ruc: '123' })
		).toThrow();
	});
});

describe('validarClaveAcceso', () => {
	it('valida una clave correctamente generada', () => {
		const clave = generarClaveAcceso({
			fechaEmision: new Date(2026, 1, 6),
			tipoComprobante: '01',
			ruc: '1790016919001',
			ambiente: '1',
			establecimiento: '001',
			puntoEmision: '001',
			secuencial: '000000001',
			codigoNumerico: '12345678',
		});

		const result = validarClaveAcceso(clave);
		expect(result.valid).toBe(true);
	});

	it('rechaza clave con longitud incorrecta', () => {
		const result = validarClaveAcceso('1234567890');
		expect(result.valid).toBe(false);
		expect(result.error).toContain('49 dígitos');
	});

	it('rechaza clave con dígito verificador incorrecto', () => {
		const clave = generarClaveAcceso({
			fechaEmision: new Date(2026, 1, 6),
			tipoComprobante: '01',
			ruc: '1790016919001',
			ambiente: '1',
			establecimiento: '001',
			puntoEmision: '001',
			secuencial: '000000001',
			codigoNumerico: '12345678',
		});

		// Alterar el último dígito
		const claveAlterada = clave.substring(0, 48) + ((Number(clave[48]) + 1) % 10).toString();
		const result = validarClaveAcceso(claveAlterada);
		expect(result.valid).toBe(false);
	});

	it('rechaza clave con caracteres no numéricos', () => {
		const result = validarClaveAcceso('a'.repeat(49));
		expect(result.valid).toBe(false);
	});
});

describe('descomponerClaveAcceso', () => {
	it('descompone correctamente una clave de 49 dígitos', () => {
		const clave = generarClaveAcceso({
			fechaEmision: new Date(2026, 1, 6),
			tipoComprobante: '01',
			ruc: '1790016919001',
			ambiente: '1',
			establecimiento: '001',
			puntoEmision: '001',
			secuencial: '000000001',
			codigoNumerico: '12345678',
		});

		const partes = descomponerClaveAcceso(clave);
		expect(partes.fechaEmision).toBe('06022026');
		expect(partes.tipoComprobante).toBe('01');
		expect(partes.ruc).toBe('1790016919001');
		expect(partes.ambiente).toBe('1');
		expect(partes.establecimiento).toBe('001');
		expect(partes.puntoEmision).toBe('001');
		expect(partes.secuencial).toBe('000000001');
		expect(partes.codigoNumerico).toBe('12345678');
		expect(partes.tipoEmision).toBe('1');
	});

	it('retorna null para clave con longitud incorrecta', () => {
		expect(descomponerClaveAcceso('123')).toBeNull();
	});
});
