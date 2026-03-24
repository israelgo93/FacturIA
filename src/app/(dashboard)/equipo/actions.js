'use server';

import { createClient } from '@/lib/supabase/server';
import { verificarPermiso } from '@/lib/auth/permisos';

async function obtenerContextoEquipo() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: perfil } = await supabase
		.from('perfiles_empresa')
		.select('empresa_id, rol')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!perfil) return { error: 'Sin acceso a empresa' };
	if (!verificarPermiso(perfil.rol, 'equipo')) {
		return { error: 'Sin permisos para gestionar equipo' };
	}

	return { supabase, user, empresaId: perfil.empresa_id, rol: perfil.rol };
}

export async function obtenerMiembros() {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	const { data, error } = await ctx.supabase
		.from('perfiles_empresa')
		.select('id, user_id, rol, activo, created_at')
		.eq('empresa_id', ctx.empresaId)
		.order('created_at', { ascending: true });

	if (error) return { error: error.message };
	return { data };
}

export async function obtenerInvitaciones() {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	const { data, error } = await ctx.supabase
		.from('invitaciones')
		.select('id, email, rol, estado, expires_at, created_at')
		.eq('empresa_id', ctx.empresaId)
		.order('created_at', { ascending: false });

	if (error) return { error: error.message };
	return { data };
}

export async function invitarMiembro(email, rol) {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	if (!['admin', 'contador', 'emisor', 'visor'].includes(rol)) {
		return { error: 'Rol no valido' };
	}

	const { data: existente } = await ctx.supabase
		.from('invitaciones')
		.select('id')
		.eq('empresa_id', ctx.empresaId)
		.eq('email', email)
		.eq('estado', 'pendiente')
		.maybeSingle();

	if (existente) return { error: 'Ya existe una invitacion pendiente para este email' };

	const { data, error } = await ctx.supabase
		.from('invitaciones')
		.insert({
			empresa_id: ctx.empresaId,
			email,
			rol,
			invitado_por: ctx.user.id,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	return { data };
}

export async function revocarInvitacion(invitacionId) {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	const { error } = await ctx.supabase
		.from('invitaciones')
		.update({ estado: 'revocada' })
		.eq('id', invitacionId)
		.eq('empresa_id', ctx.empresaId);

	if (error) return { error: error.message };
	return { success: true };
}

export async function cambiarRolMiembro(perfilId, nuevoRol) {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	if (ctx.rol !== 'propietario') {
		return { error: 'Solo el propietario puede cambiar roles' };
	}

	if (!['admin', 'contador', 'emisor', 'visor'].includes(nuevoRol)) {
		return { error: 'Rol no valido' };
	}

	const { error } = await ctx.supabase
		.from('perfiles_empresa')
		.update({ rol: nuevoRol })
		.eq('id', perfilId)
		.eq('empresa_id', ctx.empresaId)
		.neq('rol', 'propietario');

	if (error) return { error: error.message };
	return { success: true };
}

export async function desactivarMiembro(perfilId) {
	const ctx = await obtenerContextoEquipo();
	if (ctx.error) return ctx;

	const { error } = await ctx.supabase
		.from('perfiles_empresa')
		.update({ activo: false })
		.eq('id', perfilId)
		.eq('empresa_id', ctx.empresaId)
		.neq('rol', 'propietario');

	if (error) return { error: error.message };
	return { success: true };
}
