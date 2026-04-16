import { createClient } from '@/lib/supabase/server';
import { diasParaVencimiento } from '@/lib/utils/vencimientos';
import { ahoraEcuador } from '@/lib/utils/formatters';

/**
 * Crea notificacion si no existe una igual reciente (mismo tipo + titulo, 24h).
 */
async function insertarSiNuevo(supabase, empresaId, payload) {
	const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const { data: existentes } = await supabase
		.from('notificaciones')
		.select('id')
		.eq('empresa_id', empresaId)
		.eq('tipo', payload.tipo)
		.eq('titulo', payload.titulo)
		.gte('created_at', desde)
		.limit(1);

	if (existentes?.length) {
		return { skipped: true };
	}

	return supabase.from('notificaciones').insert({
		empresa_id: empresaId,
		tipo: payload.tipo,
		titulo: payload.titulo,
		mensaje: payload.mensaje,
		accion_url: payload.accion_url || null,
		metadata: payload.metadata || {},
	});
}

/**
 * Registra alertas automaticas: vencimiento tributario (IVA mes anterior), limite plan, certificado.
 * @param {string} empresaId
 * @param {string} ruc
 */
export async function sincronizarAlertasAutomaticas(empresaId, ruc) {
	const supabase = await createClient();
	const hoy = ahoraEcuador();
	const mesAnterior = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
	const anioMes = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();

	if (ruc && ruc.length >= 9) {
		const periodo = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
		const mesPeriodo = periodo.getMonth() + 1;
		const anioPeriodo = periodo.getFullYear();
		const dias = diasParaVencimiento(ruc, anioPeriodo, mesPeriodo);
		if (dias >= 0 && dias <= 5) {
			await insertarSiNuevo(supabase, empresaId, {
				tipo: 'vencimiento_tributario',
				titulo: 'Vencimiento declaracion IVA',
				mensaje: `Quedan ${dias} dia(s) para el vencimiento segun tu noveno digito del RUC (periodo ${mesPeriodo}/${anioPeriodo}).`,
				accion_url: '/reportes/iva',
				metadata: { dias, periodo: `${anioPeriodo}-${mesPeriodo}` },
			});
		}
	}

	const { data: limite } = await supabase.rpc('verificar_limite_plan', {
		p_empresa_id: empresaId,
	});

	if (limite?.permitido && limite.limite != null && limite.usados != null) {
		const ratio = limite.usados / limite.limite;
		if (ratio >= 0.95) {
			await insertarSiNuevo(supabase, empresaId, {
				tipo: 'limite_plan',
				titulo: 'Limite de comprobantes casi alcanzado',
				mensaje: `Has usado ${limite.usados} de ${limite.limite} comprobantes este mes (${(ratio * 100).toFixed(0)}%).`,
				accion_url: '/suscripcion',
				metadata: { usados: limite.usados, limite: limite.limite },
			});
		} else if (ratio >= 0.8) {
			await insertarSiNuevo(supabase, empresaId, {
				tipo: 'limite_plan',
				titulo: 'Alto uso del plan',
				mensaje: `Has usado el ${(ratio * 100).toFixed(0)}% del limite mensual de comprobantes.`,
				accion_url: '/suscripcion',
				metadata: { usados: limite.usados, limite: limite.limite },
			});
		}
	}

	const { data: cert } = await supabase
		.from('certificados')
		.select('fecha_expiracion')
		.eq('empresa_id', empresaId)
		.eq('activo', true)
		.order('fecha_expiracion', { ascending: true })
		.limit(1)
		.maybeSingle();

	if (cert?.fecha_expiracion) {
		const exp = new Date(cert.fecha_expiracion);
		const diasCert = Math.ceil((exp - hoy) / (1000 * 60 * 60 * 24));
		if (diasCert >= 0 && diasCert <= 30) {
			await insertarSiNuevo(supabase, empresaId, {
				tipo: 'certificado_expira',
				titulo: 'Certificado digital proximo a vencer',
				mensaje: `Tu certificado .p12 vence en ${diasCert} dia(s). Renueva en configuracion.`,
				accion_url: '/configuracion/certificado',
				metadata: { dias: diasCert },
			});
		}
	}
}
