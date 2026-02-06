'use server';

import { createClient } from '@/lib/supabase/server';
import { compraRecibidaSchema } from '@/lib/validations/compra-recibida';
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
 * Lista compras recibidas con filtros y paginación
 */
export async function listarCompras({ busqueda = '', page = 1, perPage = 20, mes = '', anio = '' } = {}) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	let query = supabase
		.from('compras_recibidas')
		.select('*, compras_recibidas_retenciones(*)', { count: 'exact' })
		.eq('empresa_id', empresaId)
		.order('fecha_emision', { ascending: false });

	if (busqueda) {
		query = query.or(`razon_social_proveedor.ilike.%${busqueda}%,identificacion_proveedor.ilike.%${busqueda}%`);
	}
	if (anio && mes) {
		const mesStr = String(mes).padStart(2, '0');
		const lastDay = new Date(parseInt(anio), parseInt(mes), 0).getDate();
		query = query
			.gte('fecha_emision', `${anio}-${mesStr}-01`)
			.lte('fecha_emision', `${anio}-${mesStr}-${lastDay}`);
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
 * Crea una compra recibida con sus retenciones
 */
export async function crearCompra(formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const parsed = compraRecibidaSchema.safeParse(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const retenciones = formData.retenciones || [];

	// Insertar compra
	const { data: compra, error } = await supabase
		.from('compras_recibidas')
		.insert({
			...parsed.data,
			empresa_id: empresaId,
			secuencial: parsed.data.secuencial.padStart(9, '0'),
		})
		.select()
		.single();

	if (error) return { error: error.message };

	// Insertar retenciones si hay
	if (retenciones.length > 0) {
		const retData = retenciones.map((r) => ({
			compra_id: compra.id,
			empresa_id: empresaId,
			tipo_retencion: r.tipo_retencion,
			codigo_retencion: r.codigo_retencion,
			base_imponible: parseFloat(r.base_imponible) || 0,
			porcentaje: parseFloat(r.porcentaje) || 0,
			valor_retenido: parseFloat(r.valor_retenido) || 0,
		}));

		const { error: retError } = await supabase
			.from('compras_recibidas_retenciones')
			.insert(retData);

		if (retError) {
			console.error('Error insertando retenciones:', retError);
		}
	}

	revalidatePath('/compras');
	return { data: compra, success: true };
}

/**
 * Actualiza una compra recibida
 */
export async function actualizarCompra(id, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const parsed = compraRecibidaSchema.safeParse(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { error } = await supabase
		.from('compras_recibidas')
		.update({
			...parsed.data,
			secuencial: parsed.data.secuencial.padStart(9, '0'),
		})
		.eq('id', id);

	if (error) return { error: error.message };

	revalidatePath('/compras');
	return { success: true };
}

/**
 * Elimina una compra recibida
 */
export async function eliminarCompra(id) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { error } = await supabase
		.from('compras_recibidas')
		.delete()
		.eq('id', id);

	if (error) return { error: error.message };

	revalidatePath('/compras');
	return { success: true };
}

/**
 * Obtiene una compra por ID
 */
export async function obtenerCompra(id) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { data, error } = await supabase
		.from('compras_recibidas')
		.select('*, compras_recibidas_retenciones(*)')
		.eq('id', id)
		.single();

	if (error) return { error: error.message };
	return { data };
}
