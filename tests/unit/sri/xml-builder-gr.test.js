import { describe, it, expect } from 'vitest';
import { buildGuiaRemisionXML } from '@/lib/sri/xml-builder';

const guiaRemisionBase = {
	ambiente: '1',
	tipoEmision: '1',
	tipoComprobante: '06',
	claveAcceso: '0602202606179001691900110010010000000011234567816',
	secuencial: '000000001',
	fechaEmision: new Date(2026, 1, 6),
	emisor: {
		ruc: '1790016919001',
		razonSocial: 'EMPRESA PRUEBA S.A.',
		nombreComercial: 'MI EMPRESA',
		direccion: 'Av. Principal 123, Quito',
		obligadoContabilidad: true,
		contribuyenteEspecial: null,
	},
	establecimiento: { codigo: '001', direccion: 'Bodega Central, Quito' },
	puntoEmision: { codigo: '001' },
	dirPartida: 'Av. Principal 123, Quito',
	transportista: {
		tipoIdentificacion: '04',
		identificacion: '1793456789001',
		razonSocial: 'TRANSPORTES RÁPIDOS S.A.',
	},
	placa: 'ABC-1234',
	fechaIniTransporte: new Date(2026, 1, 6),
	fechaFinTransporte: new Date(2026, 1, 7),
	destinatarios: [
		{
			identificacion: '1794567890001',
			razonSocial: 'DISTRIBUIDORA NORTE S.A.',
			direccion: 'Calle Norte 456, Ibarra',
			motivoTraslado: '01',
			codDocSustento: '01',
			numDocSustento: '001-001-000000004',
			fechaEmisionDocSustento: new Date(2026, 1, 5),
			items: [
				{
					codigoInterno: 'PROD001',
					descripcion: 'Producto para transporte',
					cantidad: 50,
				},
				{
					codigoInterno: 'PROD002',
					descripcion: 'Otro producto',
					cantidad: 30,
				},
			],
		},
	],
	infoAdicional: [],
};

describe('buildGuiaRemisionXML', () => {
	it('genera un XML válido con declaración XML', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
	});

	it('contiene el tag raíz guiaRemision con versión 1.0.0', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('version="1.0.0"');
		expect(xml).toContain('id="comprobante"');
		expect(xml).toContain('<guiaRemision');
	});

	it('contiene la sección infoTributaria con codDoc 06', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<ambiente>1</ambiente>');
		expect(xml).toContain('<codDoc>06</codDoc>');
		expect(xml).toContain('<ruc>1790016919001</ruc>');
	});

	it('contiene dirección de partida', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<dirPartida>Av. Principal 123, Quito</dirPartida>');
	});

	it('contiene datos del transportista', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<razonSocialTransportista>TRANSPORTES RÁPIDOS S.A.</razonSocialTransportista>');
		expect(xml).toContain('<tipoIdentificacionTransportista>04</tipoIdentificacionTransportista>');
		expect(xml).toContain('<rucTransportista>1793456789001</rucTransportista>');
		expect(xml).toContain('<placa>ABC-1234</placa>');
	});

	it('contiene fechas de transporte', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<fechaIniTransporte>06/02/2026</fechaIniTransporte>');
		expect(xml).toContain('<fechaFinTransporte>07/02/2026</fechaFinTransporte>');
	});

	it('contiene sección de destinatarios', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<destinatarios>');
		expect(xml).toContain('<destinatario>');
		expect(xml).toContain('<identificacionDestinatario>1794567890001</identificacionDestinatario>');
		expect(xml).toContain('<razonSocialDestinatario>DISTRIBUIDORA NORTE S.A.</razonSocialDestinatario>');
		expect(xml).toContain('<dirDestinatario>Calle Norte 456, Ibarra</dirDestinatario>');
	});

	it('contiene motivo de traslado', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<motivoTraslado>01</motivoTraslado>');
	});

	it('contiene documento sustento del destinatario', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<codDocSustento>01</codDocSustento>');
		expect(xml).toContain('<numDocSustento>001-001-000000004</numDocSustento>');
	});

	it('contiene detalles de los productos a transportar', () => {
		const xml = buildGuiaRemisionXML(guiaRemisionBase);
		expect(xml).toContain('<detalles>');
		expect(xml).toContain('<detalle>');
		expect(xml).toContain('<codigoInterno>PROD001</codigoInterno>');
		expect(xml).toContain('<descripcion>Producto para transporte</descripcion>');
		expect(xml).toContain('<cantidad>50.000000</cantidad>');
	});
});
