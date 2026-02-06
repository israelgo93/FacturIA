'use server';

import { createClient } from '@/lib/supabase/server';
import { empleadoSchema, ingresosAnualesSchema } from '@/lib/validations/empleado';
import { revalidatePath } from 'next/cache';

async function obtenerEmpresaId() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { error: 'Empresa no configurada' };
	return { empresaId: empresa.id, supabase, userId: user.id };
}

/**
 * Lista empleados con filtros
 */
export async function listarEmpleados({ busqueda = '', page = 1, perPage = 20 } = {}) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	let query = supabase
		.from('empleados')
		.select('*', { count: 'exact' })
		.eq('empresa_id', empresaId)
		.order('apellidos');

	if (busqueda) {
		query = query.or(`apellidos.ilike.%${busqueda}%,nombres.ilike.%${busqueda}%,identificacion.ilike.%${busqueda}%`);
	}

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;
	query = query.range(from, to);

	const { data, error, count } = await query;
	if (error) return { error: error.message };

	return {
		data: data || [],
		pagination: {
			page, perPage, total: count || 0,
			totalPages: Math.ceil((count || 0) / perPage),
		},
	};
}

/**
 * Crea un empleado
 */
export async function crearEmpleado(formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const parsed = empleadoSchema.safeParse(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const insertData = { ...parsed.data, empresa_id: empresaId };
	if (!insertData.fecha_salida) delete insertData.fecha_salida;

	const { data, error } = await supabase
		.from('empleados')
		.insert(insertData)
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return { error: 'Ya existe un empleado con esa identificación' };
		return { error: error.message };
	}

	revalidatePath('/empleados');
	return { data, success: true };
}

/**
 * Actualiza un empleado
 */
export async function actualizarEmpleado(id, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const parsed = empleadoSchema.safeParse(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { error } = await supabase
		.from('empleados')
		.update(parsed.data)
		.eq('id', id);

	if (error) return { error: error.message };

	revalidatePath('/empleados');
	return { success: true };
}

/**
 * Elimina un empleado
 */
export async function eliminarEmpleado(id) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { error } = await supabase
		.from('empleados')
		.delete()
		.eq('id', id);

	if (error) return { error: error.message };

	revalidatePath('/empleados');
	return { success: true };
}

/**
 * Guarda ingresos anuales de un empleado
 */
export async function guardarIngresosAnuales(empleadoId, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const parsed = ingresosAnualesSchema.safeParse(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('empleados_ingresos_anuales')
		.upsert(
			{ ...parsed.data, empleado_id: empleadoId, empresa_id: empresaId },
			{ onConflict: 'empleado_id,anio' }
		)
		.select()
		.single();

	if (error) return { error: error.message };

	return { data, success: true };
}

/**
 * Obtiene ingresos anuales de un empleado
 */
export async function obtenerIngresosAnuales(empleadoId, anio) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { data, error } = await supabase
		.from('empleados_ingresos_anuales')
		.select('*')
		.eq('empleado_id', empleadoId)
		.eq('anio', anio)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data };
}
