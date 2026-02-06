import { describe, it, expect } from 'vitest';
import { buildNotaCreditoXML } from '@/lib/sri/xml-builder';

const notaCreditoBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '04',
	claveAcceso: '0602202604179001691900110010010000000011234567814',
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
	comprador: {
		tipoIdentificacion: '05',
		identificacion: '1712345678',
		razonSocial: 'JUAN PEREZ',
		direccion: 'Calle Secundaria 456',
	},
	docSustento: {
		tipo: '01',
		numero: '001-001-000000001',
		fecha: new Date(2026, 0, 15),
	},
	motivo: 'DEVOLUCIÓN PARCIAL DE MERCADERÍA',
	detalles: [
		{
			codigoPrincipal: 'PROD001',
			descripcion: 'Producto devuelto',
			cantidad: 1,
			precioUnitario: 10.50,
			descuento: 0,
			precioTotalSinImpuesto: 10.50,
			impuestos: [
				{
					codigo: '2',
					codigoPorcentaje: '4',
					tarifa: 15,
					baseImponible: 10.50,
					valor: 1.58,
				},
			],
		},
	],
	totales: {
		totalSinImpuestos: 10.50,
		valorModificacion: 12.08,
		impuestos: [
			{
				codigo: '2',
				codigoPorcentaje: '4',
				baseImponible: 10.50,
				valor: 1.58,
			},
		],
	},
	infoAdicional: [],
};

describe('buildNotaCreditoXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz notaCredito con versión 1.1.0', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('version="1.1.0"');
		expect(xml).toContain('id="comprobante"');
		expect(xml).toContain('<notaCredito');
	});

	it('contiene la sección infoTributaria con codDoc 04', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<tipoEmision>1</tipoEmision>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
		expect(xml).toContain('<codDoc>04</codDoc>');
	});

	it('contiene datos del documento modificado', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<codDocModificado>01</codDocModificado>');
		expect(xml).toContain('<numDocModificado>001-001-000000001</numDocModificado>');
		expect(xml).toContain('<fechaEmisionDocSustento>15/01/2026</fechaEmisionDocSustento>');
	});

	it('contiene el motivo de la nota de crédito', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<motivo>DEVOLUCIÓN PARCIAL DE MERCADERÍA</motivo>');
	});

	it('contiene valorModificacion en los totales', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<valorModificacion>12.08</valorModificacion>');
	});

	it('contiene detalles con formato correcto', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<codigoInterno>PROD001</codigoInterno>');
		expect(xml).toContain('<descripcion>Producto devuelto</descripcion>');
		expect(xml).toContain('<cantidad>1.000000</cantidad>');
	});

	it('contiene datos del comprador', () => {
		const xml = buildNotaCreditoXML(notaCreditoBase);
		expect(xml).toContain('<tipoIdentificacionComprador>05</tipoIdentificacionComprador>');
		expect(xml).toContain('<identificacionComprador>1712345678</identificacionComprador>');
		expect(xml).toContain('<razonSocialComprador>JUAN PEREZ</razonSocialComprador>');
	});
});
