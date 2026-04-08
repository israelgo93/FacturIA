'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Verifica acceso completo a features segun plan activo de la empresa.
 * @param {string} empresaId
 * @returns {Promise<{ activa: boolean, plan?: string, estado?: string, razon?: string, requiere_pago?: boolean, features: Record<string, unknown> }>}
 */
export async function verificarAccesoCompleto(empresaId) {
	const supabase = await createClient();

	const { data: sub } = await supabase
		.from('suscripciones')
		.select(`
			estado, trial_ends_at,
			planes (
				nombre, limite_comprobantes_mes, limite_usuarios,
				limite_establecimientos, limite_puntos_emision,
				tiene_reportes_ia, tiene_rdep, tiene_api, tiene_multi_empresa
			)
		`)
		.eq('empresa_id', empresaId)
		.in('estado', ['activa', 'trial'])
		.maybeSingle();

	if (!sub) {
		return {
			activa: false,
			razon: 'Sin suscripcion activa',
			features: {},
		};
	}

	if (sub.estado === 'trial' && sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
		return {
			activa: false,
			razon: 'Trial expirado',
			requiere_pago: true,
			features: {},
		};
	}

	const plan = Array.isArray(sub.planes) ? sub.planes[0] : sub.planes;
	if (!plan) {
		return { activa: false, razon: 'Plan no encontrado', features: {} };
	}

	const [comprobantesRes, usuariosRes, establecimientosRes, puntosRes] = await Promise.all([
		supabase
			.from('comprobantes')
			.select('*', { count: 'exact', head: true })
			.eq('empresa_id', empresaId)
			.gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
		supabase
			.from('perfiles_empresa')
			.select('*', { count: 'exact', head: true })
			.eq('empresa_id', empresaId)
			.eq('activo', true),
		supabase
			.from('establecimientos')
			.select('*', { count: 'exact', head: true })
			.eq('empresa_id', empresaId),
		supabase
			.from('puntos_emision')
			.select('*', { count: 'exact', head: true })
			.eq('empresa_id', empresaId),
	]);

	const comprobantesUsados = comprobantesRes.count || 0;
	const usuariosActivos = usuariosRes.count || 0;
	const establecimientos = establecimientosRes.count || 0;
	const puntos = puntosRes.count || 0;

	return {
		activa: true,
		plan: plan.nombre,
		estado: sub.estado,
		features: {
			puede_emitir: plan.limite_comprobantes_mes === null || comprobantesUsados < plan.limite_comprobantes_mes,
			comprobantes: { usados: comprobantesUsados, limite: plan.limite_comprobantes_mes },
			puede_invitar: plan.limite_usuarios === null || usuariosActivos < plan.limite_usuarios,
			usuarios: { activos: usuariosActivos, limite: plan.limite_usuarios },
			puede_crear_establecimiento: plan.limite_establecimientos === null || establecimientos < plan.limite_establecimientos,
			establecimientos: { activos: establecimientos, limite: plan.limite_establecimientos },
			puede_crear_punto: plan.limite_puntos_emision === null || puntos < plan.limite_puntos_emision,
			puntos: { activos: puntos, limite: plan.limite_puntos_emision },
			reportes_ia: Boolean(plan.tiene_reportes_ia),
			rdep: Boolean(plan.tiene_rdep),
			api: Boolean(plan.tiene_api),
			multi_empresa: Boolean(plan.tiene_multi_empresa),
		},
	};
}
