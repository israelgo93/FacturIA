import { describe, it, expect } from 'vitest';
import { generarClaveAcceso } from '@/lib/sri/clave-acceso';
import {
	buildFacturaXML,
	buildLiquidacionCompraXML,
	buildNotaCreditoXML,
	buildNotaDebitoXML,
	buildRetencionXML,
	buildGuiaRemisionXML,
} from '@/lib/sri/xml-builder';

const emisor = {
	razonSocial: 'EMPRESA TEST SA',
	ruc: '1790012345001',
	direccion: 'Quito',
	obligadoContabilidad: true,
};

const estab = { codigo: '001', direccion: 'Quito' };
const pto = { codigo: '001' };

function clave(tipo) {
	return generarClaveAcceso({
		fechaEmision: '2026-01-15',
		tipoComprobante: tipo,
		ruc: emisor.ruc,
		ambiente: '1',
		establecimiento: '001',
		puntoEmision: '001',
		secuencial: '000000001',
		codigoNumerico: '12345678',
	});
}

describe('XML builders (smoke)', () => {
	it('01 factura contiene codDoc y version', () => {
		const xml = buildFacturaXML({
			ambiente: '1',
			tipoComprobante: '01',
			claveAcceso: clave('01'),
			secuencial: '000000001',
			fechaEmision: '2026-01-15',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			comprador: {
				tipoIdentificacion: '04',
				razonSocial: 'CONSUMIDOR FINAL',
				identificacion: '9999999999999',
			},
			totales: {
				totalSinImpuestos: 100,
				totalDescuento: 0,
				impuestos: [{ codigo: '2', codigoPorcentaje: '2', baseImponible: 100, valor: 12 }],
				propina: 0,
				importeTotal: 112,
			},
			detalles: [
				{
					codigoPrincipal: '001',
					descripcion: 'Producto',
					cantidad: 1,
					precioUnitario: 100,
					descuento: 0,
					precioTotalSinImpuesto: 100,
					impuestos: [
						{ codigo: '2', codigoPorcentaje: '2', tarifa: 12, baseImponible: 100, valor: 12 },
					],
				},
			],
		});
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<codDoc>01</codDoc>');
		expect(xml).toContain('version="1.1.0"');
	});

	it('03 liquidacion compra', () => {
		const xml = buildLiquidacionCompraXML({
			ambiente: '1',
			tipoComprobante: '03',
			claveAcceso: clave('03'),
			secuencial: '000000001',
			fechaEmision: '2026-01-15',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			proveedor: {
				tipoIdentificacion: '04',
				razonSocial: 'PROV',
				identificacion: '1710030225001',
			},
			totales: {
				totalSinImpuestos: 50,
				totalDescuento: 0,
				impuestos: [{ codigo: '2', codigoPorcentaje: '2', baseImponible: 50, valor: 6 }],
				importeTotal: 56,
			},
			pagos: [{ formaPago: '01', total: 56 }],
			detalles: [
				{
					codigoPrincipal: '001',
					descripcion: 'Bien',
					cantidad: 1,
					precioUnitario: 50,
					descuento: 0,
					precioTotalSinImpuesto: 50,
					impuestos: [
						{ codigo: '2', codigoPorcentaje: '2', tarifa: 12, baseImponible: 50, valor: 6 },
					],
				},
			],
		});
		expect(xml).toContain('<codDoc>03</codDoc>');
	});

	it('04 nota credito', () => {
		const xml = buildNotaCreditoXML({
			ambiente: '1',
			tipoComprobante: '04',
			claveAcceso: clave('04'),
			secuencial: '000000001',
			fechaEmision: '2026-01-15',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			comprador: { tipoIdentificacion: '04', razonSocial: 'C', identificacion: '9999999999999' },
			docSustento: { tipo: '01', numero: '001-001-000000001', fecha: '2026-01-10' },
			totales: {
				totalSinImpuestos: 10,
				valorModificacion: 10,
				impuestos: [{ codigo: '2', codigoPorcentaje: '2', baseImponible: 10, valor: 1.2 }],
			},
			motivo: 'Devolucion',
			detalles: [
				{
					codigoPrincipal: '001',
					descripcion: 'L',
					cantidad: 1,
					precioUnitario: 10,
					descuento: 0,
					precioTotalSinImpuesto: 10,
					impuestos: [
						{ codigo: '2', codigoPorcentaje: '2', tarifa: 12, baseImponible: 10, valor: 1.2 },
					],
				},
			],
		});
		expect(xml).toContain('<codDoc>04</codDoc>');
	});

	it('05 nota debito', () => {
		const xml = buildNotaDebitoXML({
			ambiente: '1',
			tipoComprobante: '05',
			claveAcceso: clave('05'),
			secuencial: '000000001',
			fechaEmision: '2026-01-15',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			comprador: { tipoIdentificacion: '04', razonSocial: 'C', identificacion: '9999999999999' },
			docSustento: { tipo: '01', numero: '001-001-000000001', fecha: '2026-01-10' },
			totales: {
				totalSinImpuestos: 10,
				impuestos: [{ codigo: '2', codigoPorcentaje: '2', tarifa: 12, baseImponible: 10, valor: 1.2 }],
				valorTotal: 11.2,
			},
			pagos: [{ formaPago: '01', total: 11.2 }],
			motivos: [{ razon: 'Interes', valor: 11.2 }],
		});
		expect(xml).toContain('<codDoc>05</codDoc>');
	});

	it('06 guia remision', () => {
		const xml = buildGuiaRemisionXML({
			ambiente: '1',
			tipoComprobante: '06',
			claveAcceso: clave('06'),
			secuencial: '000000001',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			dirPartida: 'Quito',
			transportista: {
				razonSocial: 'TRANS',
				tipoIdentificacion: '04',
				identificacion: '1710011122001',
			},
			fechaIniTransporte: '2026-01-15',
			fechaFinTransporte: '2026-01-15',
			placa: 'ABC1234',
			destinatarios: [
				{
					identificacion: '1710030225001',
					razonSocial: 'DEST',
					direccion: 'UIO',
					motivoTraslado: 'Venta',
					items: [{ descripcion: 'Caja', cantidad: 1 }],
				},
			],
		});
		expect(xml).toContain('<codDoc>06</codDoc>');
	});

	it('07 retencion', () => {
		const xml = buildRetencionXML({
			ambiente: '1',
			tipoComprobante: '07',
			claveAcceso: clave('07'),
			secuencial: '000000001',
			fechaEmision: '2026-01-15',
			emisor,
			establecimiento: estab,
			puntoEmision: pto,
			periodoFiscal: '01/2026',
			sujetoRetenido: {
				tipoIdentificacion: '04',
				razonSocial: 'SUJ',
				identificacion: '1710030225001',
			},
			documentosSustento: [
				{
					codSustento: '01',
					codDocSustento: '01',
					numDocSustento: '001001000000001',
					fechaEmision: '2026-01-10',
					numAutorizacion: '1234567890',
					totalSinImpuestos: 100,
					importeTotal: 112,
					impuestos: [
						{
							codigo: '2',
							codigoPorcentaje: '2',
							baseImponible: 100,
							valorImpuesto: 12,
						},
					],
					retenciones: [
						{
							codigoImpuesto: '1',
							codigoRetencion: '303',
							baseImponible: 100,
							porcentaje: 1,
							valorRetenido: 1,
						},
					],
					pagos: [{ formaPago: '01', total: 112 }],
				},
			],
		});
		expect(xml).toContain('<codDoc>07</codDoc>');
	});
});
