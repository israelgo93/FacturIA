import { describe, expect, it } from 'vitest';
import {
	esEstadoConsultableSRI,
	esRespuestaVigenciaConcluyente,
	mapearVigenciaAEstadoInterno,
} from '@/lib/sri/estado-comprobante';
import {
	consultarEstadoComprobante,
	normalizarRespuestaConsultaEstado,
} from '@/lib/sri/soap-client';

describe('estado fiscal de comprobantes', () => {
	it.each([
		['AUTORIZADO', 'AUT'],
		['NO AUTORIZADO', 'NAT'],
		['PENDIENTE DE ANULAR', 'PAN'],
		['ANULADO', 'ANU'],
	])('mapea %s a %s', (estadoSRI, esperado) => {
		expect(mapearVigenciaAEstadoInterno(estadoSRI)).toBe(esperado);
	});

	it('no inventa un estado interno para respuestas desconocidas', () => {
		expect(mapearVigenciaAEstadoInterno('RECHAZADA')).toBeNull();
		expect(esRespuestaVigenciaConcluyente({ estadoConsulta: 'RECHAZADA', estadoAutorizacion: 'ANULADO' })).toBe(false);
	});

	it('solo permite consultar comprobantes que ya fueron enviados', () => {
		expect(esEstadoConsultableSRI('AUT')).toBe(true);
		expect(esEstadoConsultableSRI('PPR')).toBe(true);
		expect(esEstadoConsultableSRI('draft')).toBe(false);
		expect(esEstadoConsultableSRI('DESC')).toBe(false);
	});

	it('normaliza una respuesta exitosa del WSDL ConsultaComprobante', () => {
		const respuesta = normalizarRespuestaConsultaEstado({
			EstadoAutorizacionComprobante: {
				estadoConsulta: 'RECIBIDA',
				estadoAutorizacion: 'PENDIENTE DE ANULAR',
				claveAcceso: '1'.repeat(49),
				tipoComprobante: '01',
				rucEmisor: '0999999999001',
				fechaAutorizacion: '2026-09-07T10:00:00-05:00',
				mensajes: {
					mensaje: { identificador: '1', tipo: 'INFORMACION', mensaje: 'Consulta correcta' },
				},
			},
		});

		expect(respuesta.estadoAutorizacion).toBe('PENDIENTE DE ANULAR');
		expect(respuesta.mensajes).toEqual([
			{ tipo: 'INFORMACION', codigo: '1', mensaje: 'Consulta correcta', informacionAdicional: undefined },
		]);
		expect(esRespuestaVigenciaConcluyente(respuesta)).toBe(true);
	});

	it('considera inconclusa una respuesta sin cuerpo', () => {
		const respuesta = normalizarRespuestaConsultaEstado({});
		expect(respuesta.estadoConsulta).toBe('RESPUESTA_INVALIDA');
		expect(respuesta.estadoAutorizacion).toBeNull();
	});

	it('acepta una vigencia oficial cuando estadoConsulta opcional no viene', () => {
		expect(esRespuestaVigenciaConcluyente({
			estadoConsulta: null,
			estadoAutorizacion: 'ANULADO',
		})).toBe(true);
	});

	it('rechaza una clave inválida sin llamar a la red', async () => {
		const respuesta = await consultarEstadoComprobante('123', '1');
		expect(respuesta.codigo).toBe('CLAVE_ACCESO_INVALIDA');
		expect(respuesta.estadoAutorizacion).toBeNull();
	});
});
