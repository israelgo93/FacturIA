import { describe, it, expect } from 'vitest';
import {
	validarFactura,
	calcularTotalesImpuestos,
	calcularSubtotalDetalle,
	calcularValorImpuesto,
} from '@/lib/sri/validators';

describe('validarFactura', () => {
	const facturaValida = {
		ambiente: '1',
		emisor: {
			ruc: '1790016919001',
			razonSocial: 'EMPRESA PRUEBA S.A.',
			direccion: 'Av. Principal 123',
		},
		comprador: {
			tipoIdentificacion: '05',
			identificacion: '0911686913',
			razonSocial: 'JUAN PEREZ',
		},
		detalles: [
			{
				codigoPrincipal: 'PROD001',
				descripcion: 'Producto',
				cantidad: 1,
				precioUnitario: 10,
				precioTotalSinImpuesto: 10,
				impuestos: [{ codigo: '2', codigoPorcentaje: '4', tarifa: 15, baseImponible: 10, valor: 1.50 }],
			},
		],
		pagos: [{ formaPago: '01', total: 11.50 }],
		totales: { importeTotal: 11.50 },
	};

	it('valida una factura correcta', () => {
		const result = validarFactura(facturaValida);
		expect(result.valid).toBe(true);
		expect(result.errores).toHaveLength(0);
	});

	it('detecta RUC inválido del emisor', () => {
		const factura = { ...facturaValida, emisor: { ...facturaValida.emisor, ruc: '123' } };
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
		expect(result.errores.some((e) => e.includes('RUC del emisor'))).toBe(true);
	});

	it('detecta comprador sin identificación', () => {
		const factura = {
			...facturaValida,
			comprador: { ...facturaValida.comprador, identificacion: '' },
		};
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
	});

	it('detecta factura sin detalles', () => {
		const factura = { ...facturaValida, detalles: [] };
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
		expect(result.errores.some((e) => e.includes('al menos un detalle'))).toBe(true);
	});

	it('detecta factura sin pagos', () => {
		const factura = { ...facturaValida, pagos: [] };
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
	});

	it('detecta RUC incorrecto del comprador (tipo 04)', () => {
		const factura = {
			...facturaValida,
			comprador: { tipoIdentificacion: '04', identificacion: '123456', razonSocial: 'Test' },
		};
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
		expect(result.errores.some((e) => e.includes('RUC del comprador'))).toBe(true);
	});

	it('valida cédula de 10 dígitos (tipo 05)', () => {
		const factura = {
			...facturaValida,
			comprador: { tipoIdentificacion: '05', identificacion: '17123', razonSocial: 'Test' },
		};
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
		expect(result.errores.some((e) => e.includes('Cédula del comprador'))).toBe(true);
	});

	it('detecta ambiente inválido', () => {
		const factura = { ...facturaValida, ambiente: '3' };
		const result = validarFactura(factura);
		expect(result.valid).toBe(false);
	});
});

describe('calcularTotalesImpuestos', () => {
	it('agrupa impuestos por código+codigoPorcentaje', () => {
		const detalles = [
			{
				impuestos: [
					{ codigo: '2', codigoPorcentaje: '4', baseImponible: 100, valor: 15 },
				],
			},
			{
				impuestos: [
					{ codigo: '2', codigoPorcentaje: '4', baseImponible: 50, valor: 7.50 },
				],
			},
		];

		const totales = calcularTotalesImpuestos(detalles);
		expect(totales).toHaveLength(1);
		expect(totales[0].baseImponible).toBe(150);
		expect(totales[0].valor).toBe(22.50);
	});

	it('separa impuestos con diferentes tarifas', () => {
		const detalles = [
			{
				impuestos: [
					{ codigo: '2', codigoPorcentaje: '4', baseImponible: 100, valor: 15 },
				],
			},
			{
				impuestos: [
					{ codigo: '2', codigoPorcentaje: '0', baseImponible: 50, valor: 0 },
				],
			},
		];

		const totales = calcularTotalesImpuestos(detalles);
		expect(totales).toHaveLength(2);
	});
});

describe('calcularSubtotalDetalle', () => {
	it('calcula subtotal simple', () => {
		expect(calcularSubtotalDetalle(2, 10, 0)).toBe(20);
	});

	it('aplica descuento correctamente', () => {
		expect(calcularSubtotalDetalle(2, 10, 5)).toBe(15);
	});
});

describe('calcularValorImpuesto', () => {
	it('calcula IVA 15%', () => {
		expect(calcularValorImpuesto(100, 15)).toBe(15);
	});

	it('calcula IVA 0%', () => {
		expect(calcularValorImpuesto(100, 0)).toBe(0);
	});

	it('calcula IVA 12%', () => {
		expect(calcularValorImpuesto(100, 12)).toBe(12);
	});
});
