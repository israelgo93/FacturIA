import { describe, it, expect } from 'vitest';
import { buildNotaDebitoXML } from '@/lib/sri/xml-builder';

const notaDebitoBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '05',
	claveAcceso: '0602202605179001691900110010010000000011234567815',
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
		tipoIdentificacion: '04',
		identificacion: '1790016919001',
		razonSocial: 'CLIENTE EMPRESA S.A.',
		direccion: 'Calle Comercial 789',
	},
	docSustento: {
		tipo: '01',
		numero: '001-001-000000002',
		fecha: new Date(2026, 0, 20),
	},
	motivos: [
		{
			razon: 'Intereses por mora',
			valor: 25.00,
		},
		{
			razon: 'Gastos administrativos',
			valor: 10.00,
		},
	],
	totales: {
		totalSinImpuestos: 35.00,
		valorTotal: 40.25,
		impuestos: [
			{
				codigo: '2',
				codigoPorcentaje: '4',
				tarifa: 15,
				baseImponible: 35.00,
				valor: 5.25,
			},
		],
	},
	pagos: [
		{ formaPago: '01', total: 40.25 },
	],
	infoAdicional: [],
};

describe('buildNotaDebitoXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz notaDebito con versión 1.0.0', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('version="1.0.0"');
		expect(xml).toContain('id="comprobante"');
		expect(xml).toContain('<notaDebito');
	});

	it('contiene la sección infoTributaria con codDoc 05', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<codDoc>05</codDoc>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
	});

	it('contiene datos del documento modificado', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<codDocModificado>01</codDocModificado>');
		expect(xml).toContain('<numDocModificado>001-001-000000002</numDocModificado>');
		expect(xml).toContain('<fechaEmisionDocSustento>20/01/2026</fechaEmisionDocSustento>');
	});

	it('contiene sección de motivos en lugar de detalles', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<motivos>');
		expect(xml).toContain('<motivo>');
		expect(xml).toContain('<razon>Intereses por mora</razon>');
		expect(xml).toContain('<valor>25.00</valor>');
		expect(xml).toContain('<razon>Gastos administrativos</razon>');
		expect(xml).toContain('<valor>10.00</valor>');
	});

	it('contiene valorTotal en los totales', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<valorTotal>40.25</valorTotal>');
	});

	it('contiene pagos', () => {
		const xml = buildNotaDebitoXML(notaDebitoBase);
		expect(xml).toContain('<formaPago>01</formaPago>');
		expect(xml).toContain('<total>40.25</total>');
	});
});
