'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Crea una suscripcion trial automatica para una empresa nueva.
 * @param {string} empresaId
 * @returns {Promise<{ success: boolean, razon?: string, suscripcion_id?: string, plan?: string, trial_ends_at?: string, dias_restantes?: number }>}
 */
export async function crearTrialAutomatico(empresaId) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc('crear_suscripcion_trial', {
		p_empresa_id: empresaId,
	});

	if (error) return { success: false, razon: error.message };
	return data;
}

/**
 * Obtiene el estado actual del trial/suscripcion de una empresa.
 * @param {string} empresaId
 * @returns {Promise<{ tiene_suscripcion: boolean, estado?: string, plan?: string, trial_ends_at?: string, dias_restantes?: number, requiere_pago?: boolean } | null>}
 */
export async function obtenerEstadoTrial(empresaId) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc('verificar_estado_trial', {
		p_empresa_id: empresaId,
	});

	if (error) return null;
	return data;
}

/**
 * Calcula los dias restantes de un trial.
 * @param {string | null} trialEndsAt
 * @returns {number}
 */
export async function calcularDiasRestantes(trialEndsAt) {
	if (!trialEndsAt) return 0;
	const ahora = new Date();
	const fin = new Date(trialEndsAt);
	const diff = Math.ceil((fin - ahora) / (1000 * 60 * 60 * 24));
	return Math.max(0, diff);
}
