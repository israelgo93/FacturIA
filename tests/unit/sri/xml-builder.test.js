import { describe, it, expect } from 'vitest';
import { buildFacturaXML } from '@/lib/sri/xml-builder';

const facturaBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '01',
	claveAcceso: '0602202601179001691900110010010000000011234567819',
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
		contribuyenteRimpe: null,
		agenteRetencion: null,
	},
	establecimiento: { codigo: '001', direccion: 'Av. Principal 123' },
	puntoEmision: { codigo: '001' },
	comprador: {
		tipoIdentificacion: '05',
		identificacion: '1712345678',
		razonSocial: 'JUAN PEREZ',
		direccion: 'Calle Secundaria 456',
	},
	detalles: [
		{
			codigoPrincipal: 'PROD001',
			descripcion: 'Producto de prueba',
			cantidad: 2,
			precioUnitario: 10.50,
			descuento: 0,
			precioTotalSinImpuesto: 21.00,
			impuestos: [
				{
					codigo: '2',
					codigoPorcentaje: '4',
					tarifa: 15,
					baseImponible: 21.00,
					valor: 3.15,
				},
			],
		},
	],
	totales: {
		totalSinImpuestos: 21.00,
		totalDescuento: 0.00,
		propina: 0,
		importeTotal: 24.15,
		impuestos: [
			{
				codigo: '2',
				codigoPorcentaje: '4',
				baseImponible: 21.00,
				valor: 3.15,
			},
		],
	},
	pagos: [
		{ formaPago: '01', total: 24.15 },
	],
	infoAdicional: [],
};

describe('buildFacturaXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz factura con versión 1.1.0', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('version="1.1.0"');
		expect(xml).toContain('id="comprobante"');
	});

	it('contiene la sección infoTributaria con datos del emisor', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<tipoEmision>1</tipoEmision>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
		expect(xml).toContain('<razonSocial>EMPRESA PRUEBA S.A.</razonSocial>');
		expect(xml).toContain('<codDoc>01</codDoc>');
		expect(xml).toContain('<estab>001</estab>');
		expect(xml).toContain('<ptoEmi>001</ptoEmi>');
		expect(xml).toContain('<secuencial>000000001</secuencial>');
	});

	it('contiene la sección infoFactura con datos del comprador', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<fechaEmision>06/02/2026</fechaEmision>');
		expect(xml).toContain('<obligadoContabilidad>SI</obligadoContabilidad>');
		expect(xml).toContain('<tipoIdentificacionComprador>05</tipoIdentificacionComprador>');
		expect(xml).toContain('<identificacionComprador>1712345678</identificacionComprador>');
		expect(xml).toContain('<razonSocialComprador>JUAN PEREZ</razonSocialComprador>');
	});

	it('contiene detalles con formato decimal correcto', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<codigoPrincipal>PROD001</codigoPrincipal>');
		expect(xml).toContain('<descripcion>Producto de prueba</descripcion>');
		expect(xml).toContain('<cantidad>2.000000</cantidad>');
		expect(xml).toContain('<precioUnitario>10.500000</precioUnitario>');
		expect(xml).toContain('<precioTotalSinImpuesto>21.00</precioTotalSinImpuesto>');
	});

	it('contiene impuestos del detalle', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<codigo>2</codigo>');
		expect(xml).toContain('<codigoPorcentaje>4</codigoPorcentaje>');
		expect(xml).toContain('<tarifa>15.00</tarifa>');
		expect(xml).toContain('<baseImponible>21.00</baseImponible>');
		expect(xml).toContain('<valor>3.15</valor>');
	});

	it('contiene totales de la factura', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<totalSinImpuestos>21.00</totalSinImpuestos>');
		expect(xml).toContain('<totalDescuento>0.00</totalDescuento>');
		expect(xml).toContain('<importeTotal>24.15</importeTotal>');
		expect(xml).toContain('<moneda>DOLAR</moneda>');
	});

	it('contiene formas de pago', () => {
		const xml = buildFacturaXML(facturaBase);
		expect(xml).toContain('<formaPago>01</formaPago>');
		expect(xml).toContain('<total>24.15</total>');
	});

	it('maneja info adicional correctamente', () => {
		const facturaConInfo = {
			...facturaBase,
			infoAdicional: [
				{ nombre: 'Email', valor: 'test@test.com' },
				{ nombre: 'Teléfono', valor: '0991234567' },
			],
		};
		const xml = buildFacturaXML(facturaConInfo);
		expect(xml).toContain('nombre="Email"');
		expect(xml).toContain('test@test.com');
	});

	it('omite campos opcionales cuando son null', () => {
		const facturaMinima = {
			...facturaBase,
			emisor: {
				...facturaBase.emisor,
				nombreComercial: null,
				contribuyenteEspecial: null,
				contribuyenteRimpe: null,
				agenteRetencion: null,
			},
			comprador: {
				...facturaBase.comprador,
				direccion: null,
			},
			infoAdicional: [],
		};
		const xml = buildFacturaXML(facturaMinima);
		expect(xml).not.toContain('<nombreComercial>');
		expect(xml).not.toContain('<contribuyenteEspecial>');
		expect(xml).not.toContain('<direccionComprador>');
	});
});
