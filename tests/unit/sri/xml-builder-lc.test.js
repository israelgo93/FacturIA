import { describe, it, expect } from 'vitest';
import { buildLiquidacionCompraXML } from '@/lib/sri/xml-builder';

const liquidacionCompraBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '03',
	claveAcceso: '0602202603179001691900110010010000000011234567813',
	secuencial: '000000001',
	fechaEmision: new Date(2026, 1, 6),
	moneda: 'DOLAR',
	emisor: {
		ruc: '1790016919001',
		razonSocial: 'EMPRESA PRUEBA S.A.',
		nombreComercial: 'MI EMPRESA',
		direccion: 'Av. Principal 123, Quito',
		obligadoContabilidad: true,
		contribuyenteEspecial: null,
	},
	establecimiento: { codigo: '001', direccion: 'Av. Principal 123' },
	puntoEmision: { codigo: '001' },
	proveedor: {
		tipoIdentificacion: '05',
		identificacion: '1712345678',
		razonSocial: 'MARÍA CASTRO',
		direccion: 'Comunidad Rural, Imbabura',
	},
	detalles: [
		{
			codigoPrincipal: 'PROD001',
			descripcion: 'Productos agrícolas',
			cantidad: 100,
			precioUnitario: 2.50,
			descuento: 0,
			precioTotalSinImpuesto: 250.00,
			impuestos: [
				{
					codigo: '2',
					codigoPorcentaje: '0',
					tarifa: 0,
					baseImponible: 250.00,
					valor: 0,
				},
			],
		},
	],
	totales: {
		totalSinImpuestos: 250.00,
		totalDescuento: 0.00,
		importeTotal: 250.00,
		impuestos: [
			{
				codigo: '2',
				codigoPorcentaje: '0',
				baseImponible: 250.00,
				valor: 0,
			},
		],
	},
	pagos: [
		{ formaPago: '01', total: 250.00 },
	],
	infoAdicional: [],
};

describe('buildLiquidacionCompraXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz liquidacionCompra con versión 1.1.0', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('version="1.1.0"');
		expect(xml).toContain('id="comprobante"');
		expect(xml).toContain('<liquidacionCompra');
	});

	it('contiene la sección infoTributaria con codDoc 03', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<codDoc>03</codDoc>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
	});

	it('contiene datos del proveedor', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<tipoIdentificacionProveedor>05</tipoIdentificacionProveedor>');
		expect(xml).toContain('<identificacionProveedor>1712345678</identificacionProveedor>');
		expect(xml).toContain('<razonSocialProveedor>MARÍA CASTRO</razonSocialProveedor>');
		expect(xml).toContain('<direccionProveedor>Comunidad Rural, Imbabura</direccionProveedor>');
	});

	it('contiene detalles con formato correcto', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<codigoPrincipal>PROD001</codigoPrincipal>');
		expect(xml).toContain('<descripcion>Productos agrícolas</descripcion>');
		expect(xml).toContain('<cantidad>100.000000</cantidad>');
		expect(xml).toContain('<precioUnitario>2.500000</precioUnitario>');
		expect(xml).toContain('<precioTotalSinImpuesto>250.00</precioTotalSinImpuesto>');
	});

	it('contiene impuestos del detalle', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<codigo>2</codigo>');
		expect(xml).toContain('<codigoPorcentaje>0</codigoPorcentaje>');
		expect(xml).toContain('<tarifa>0.00</tarifa>');
	});

	it('contiene totales de la liquidación', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<totalSinImpuestos>250.00</totalSinImpuestos>');
		expect(xml).toContain('<importeTotal>250.00</importeTotal>');
		expect(xml).toContain('<moneda>DOLAR</moneda>');
	});

	it('contiene formas de pago', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		expect(xml).toContain('<formaPago>01</formaPago>');
		expect(xml).toContain('<total>250.00</total>');
	});

	it('maneja IVA 0% correctamente', () => {
		const xml = buildLiquidacionCompraXML(liquidacionCompraBase);
		// Productos agrícolas típicamente con IVA 0%
		expect(xml).toContain('<codigoPorcentaje>0</codigoPorcentaje>');
		expect(xml).toContain('<valor>0.00</valor>');
	});
});
