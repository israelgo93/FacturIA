/**
 * Gestor de secuenciales para comprobantes electrónicos
 * Usa función SQL atómica next_secuencial() para evitar
 * condiciones de carrera en secuenciales concurrentes.
 */
import { createClient } from '@/lib/supabase/server';

/**
 * Obtiene el siguiente secuencial atómicamente
 * @param {Object} params
 * @param {string} params.empresaId - UUID de la empresa
 * @param {string} params.establecimientoId - UUID del establecimiento
 * @param {string} params.puntoEmisionId - UUID del punto de emisión
 * @param {string} params.tipoComprobante - Código tipo (01, 04, 05, etc.)
 * @returns {Promise<string>} Secuencial formateado (9 dígitos con ceros)
 */
export async function obtenerSiguienteSecuencial({
	empresaId,
	establecimientoId,
	puntoEmisionId,
	tipoComprobante,
}) {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc('next_secuencial', {
		p_empresa_id: empresaId,
		p_establecimiento_id: establecimientoId,
		p_punto_emision_id: puntoEmisionId,
		p_tipo_comprobante: tipoComprobante,
	});

	if (error) {
		throw new Error(`Error al obtener secuencial: ${error.message}`);
	}

	return data;
}

/**
 * Genera el número completo del comprobante (estab-ptoEmi-secuencial)
 * @param {string} establecimiento - Código establecimiento (3 dígitos)
 * @param {string} puntoEmision - Código punto emisión (3 dígitos)
 * @param {string} secuencial - Secuencial (9 dígitos)
 * @returns {string} Número completo (ej: 001-001-000000001)
 */
export function generarNumeroCompleto(establecimiento, puntoEmision, secuencial) {
	const estab = String(establecimiento).padStart(3, '0');
	const ptoEmi = String(puntoEmision).padStart(3, '0');
	const sec = String(secuencial).padStart(9, '0');
	return `${estab}-${ptoEmi}-${sec}`;
}
