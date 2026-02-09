import { describe, it, expect } from 'vitest';
import { buildRetencionXML } from '@/lib/sri/xml-builder';

const retencionBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '07',
	claveAcceso: '0602202607179001691900110010010000000011234567817',
	secuencial: '000000001',
	fechaEmision: new Date(2026, 1, 6),
	emisor: {
		ruc: '1790016919001',
		razonSocial: 'EMPRESA PRUEBA S.A.',
		nombreComercial: 'MI EMPRESA',
		direccion: 'Av. Principal 123, Quito',
		obligadoContabilidad: true,
		contribuyenteEspecial: null,
		agenteRetencion: '1',
	},
	establecimiento: { codigo: '001', direccion: 'Av. Principal 123' },
	puntoEmision: { codigo: '001' },
	sujetoRetenido: {
		tipoIdentificacion: '04',
		identificacion: '1792345678001',
		razonSocial: 'PROVEEDOR SERVICIOS S.A.',
	},
	periodoFiscal: '02/2026',
	documentosSustento: [
		{
			codSustento: '01',
			codDocSustento: '01',
			numDocSustento: '001-001-000000003',
			fechaEmision: new Date(2026, 1, 1),
			numAutorizacion: '0602202601179234567800110010010000000031234567811',
			totalSinImpuestos: 1000.00,
			importeTotal: 1150.00,
			impuestos: [
				{
					codigo: '2',
					codigoPorcentaje: '4',
					baseImponible: 1000.00,
					tarifa: 15,
					valorImpuesto: 150.00,
				},
			],
			retenciones: [
				{
					codigoImpuesto: '1',
					codigoRetencion: '303',
					baseImponible: 1000.00,
					porcentaje: 10,
					valorRetenido: 100.00,
				},
				{
					codigoImpuesto: '2',
					codigoRetencion: '2',
					baseImponible: 150.00,
					porcentaje: 30,
					valorRetenido: 45.00,
				},
			],
			pagos: [
				{ formaPago: '01', total: 1150.00 },
			],
		},
	],
	infoAdicional: [],
};

describe('buildRetencionXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz comprobanteRetencion con versión 2.0.0', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('version="2.0.0"');
		expect(xml).toContain('id="comprobante"');
		expect(xml).toContain('<comprobanteRetencion');
	});

	it('contiene la sección infoTributaria con codDoc 07', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<codDoc>07</codDoc>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
	});

	it('contiene datos del sujeto retenido', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<tipoIdentificacionSujetoRetenido>04</tipoIdentificacionSujetoRetenido>');
		expect(xml).toContain('<identificacionSujetoRetenido>1792345678001</identificacionSujetoRetenido>');
		expect(xml).toContain('<razonSocialSujetoRetenido>PROVEEDOR SERVICIOS S.A.</razonSocialSujetoRetenido>');
	});

	it('contiene periodo fiscal con formato correcto', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<periodoFiscal>02/2026</periodoFiscal>');
	});

	it('contiene documentos sustento con retenciones', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<docsSustento>');
		expect(xml).toContain('<docSustento>');
		expect(xml).toContain('<codDocSustento>01</codDocSustento>');
		expect(xml).toContain('<numDocSustento>001001000000003</numDocSustento>');
	});

	it('contiene retenciones individuales', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<retenciones>');
		expect(xml).toContain('<retencion>');
		expect(xml).toContain('<codigo>1</codigo>'); // Renta
		expect(xml).toContain('<codigoRetencion>303</codigoRetencion>');
		expect(xml).toContain('<porcentajeRetener>10.00</porcentajeRetener>');
		expect(xml).toContain('<valorRetenido>100.00</valorRetenido>');
	});

	it('contiene retención de IVA', () => {
		const xml = buildRetencionXML(retencionBase);
		expect(xml).toContain('<codigo>2</codigo>'); // IVA
		expect(xml).toContain('<codigoRetencion>2</codigoRetencion>');
		expect(xml).toContain('<porcentajeRetener>30.00</porcentajeRetener>');
		expect(xml).toContain('<valorRetenido>45.00</valorRetenido>');
	});
});
