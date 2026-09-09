/**
 * Traducción entre la vigencia fiscal informada por el SRI y el estado
 * canónico usado por FacturIA.
 */

export const ESTADOS_VIGENCIA_SRI = Object.freeze({
	AUTORIZADO: 'AUTORIZADO',
	NO_AUTORIZADO: 'NO AUTORIZADO',
	PENDIENTE_ANULAR: 'PENDIENTE DE ANULAR',
	ANULADO: 'ANULADO',
});

const ESTADO_INTERNO_POR_VIGENCIA = Object.freeze({
	[ESTADOS_VIGENCIA_SRI.AUTORIZADO]: 'AUT',
	[ESTADOS_VIGENCIA_SRI.NO_AUTORIZADO]: 'NAT',
	[ESTADOS_VIGENCIA_SRI.PENDIENTE_ANULAR]: 'PAN',
	[ESTADOS_VIGENCIA_SRI.ANULADO]: 'ANU',
});

export const ESTADOS_CONSULTABLES_SRI = Object.freeze([
	'sent',
	'PPR',
	'AUT',
	'NAT',
	'PAN',
	'ANU',
]);

/**
 * @param {string | null | undefined} estadoSRI
 * @returns {string | null}
 */
export function mapearVigenciaAEstadoInterno(estadoSRI) {
	if (!estadoSRI) return null;
	return ESTADO_INTERNO_POR_VIGENCIA[estadoSRI] || null;
}

/**
 * @param {string | null | undefined} estado
 * @returns {boolean}
 */
export function esEstadoConsultableSRI(estado) {
	return ESTADOS_CONSULTABLES_SRI.includes(estado);
}

/**
 * Los errores de consulta son inconclusos y nunca deben modificar el estado
 * canónico previamente conocido.
 * @param {Object} respuesta
 * @returns {boolean}
 */
export function esRespuestaVigenciaConcluyente(respuesta) {
	const estadoInterno = mapearVigenciaAEstadoInterno(respuesta?.estadoAutorizacion);
	if (!estadoInterno) return false;

	// El XSD declara estadoConsulta como opcional. Una vigencia oficial exacta
	// sigue siendo concluyente cuando ese campo no viene en la respuesta.
	return !['RECHAZADA', 'ERROR_CONEXION', 'RESPUESTA_INVALIDA'].includes(
		respuesta?.estadoConsulta,
	);
}
