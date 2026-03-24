'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sincronizarAlertasAutomaticas } from '@/lib/notificaciones/notification-engine';

const idSchema = z.string().uuid();

export async function listarNotificaciones({ limite = 20 } = {}) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id, ruc')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	await sincronizarAlertasAutomaticas(empresa.id, empresa.ruc || '');

	const { data, error } = await supabase
		.from('notificaciones')
		.select('*')
		.eq('empresa_id', empresa.id)
		.order('created_at', { ascending: false })
		.limit(limite);

	if (error) return { error: error.message };
	return { data: data || [] };
}

export async function contarNotificacionesNoLeidas() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { count: 0 };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { count: 0 };

	const { count, error } = await supabase
		.from('notificaciones')
		.select('*', { count: 'exact', head: true })
		.eq('empresa_id', empresa.id)
		.eq('leida', false);

	if (error) return { count: 0 };
	return { count: count || 0 };
}

export async function marcarNotificacionLeida(formData) {
	const id = idSchema.safeParse(formData.get('id'));
	if (!id.success) return { error: 'ID invalido' };

	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { error } = await supabase
		.from('notificaciones')
		.update({ leida: true })
		.eq('id', id.data)
		.eq('empresa_id', empresa.id);

	if (error) return { error: error.message };
	return { success: true };
}

export async function marcarTodasLeidas() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };

	const { error } = await supabase
		.from('notificaciones')
		.update({ leida: true })
		.eq('empresa_id', empresa.id)
		.eq('leida', false);

	if (error) return { error: error.message };
	return { success: true };
}
