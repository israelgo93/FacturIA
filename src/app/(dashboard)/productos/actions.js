'use server';

import { createClient } from '@/lib/supabase/server';
import { productoSchema } from '@/lib/validations/producto';
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
	return { empresaId: empresa.id, supabase };
}

export async function listarProductos({ busqueda = '', page = 1, perPage = 20, filtroCategoria = '', filtroActivo = '' } = {}) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	let query = supabase
		.from('productos')
		.select('*', { count: 'exact' })
		.eq('empresa_id', empresaId)
		.order('nombre');

	if (busqueda) {
		query = query.or(`nombre.ilike.%${busqueda}%,codigo_principal.ilike.%${busqueda}%`);
	}
	if (filtroCategoria) query = query.eq('categoria', filtroCategoria);
	if (filtroActivo === 'true') query = query.eq('activo', true);
	if (filtroActivo === 'false') query = query.eq('activo', false);

	const from = (page - 1) * perPage;
	const to = from + perPage - 1;
	query = query.range(from, to);

	const { data, error, count } = await query;
	if (error) return { error: error.message };

	return {
		data: data || [],
		pagination: {
			page,
			perPage,
			total: count || 0,
			totalPages: Math.ceil((count || 0) / perPage),
			from: from + 1,
			to: Math.min(to + 1, count || 0),
		},
	};
}

export async function crearProducto(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const raw = Object.fromEntries(formData);
	const parsed = productoSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	// Determinar código IVA base según porcentaje
	const ivaMap = { '0': '2', '2': '2', '3': '2', '4': '2', '5': '2', '6': '2', '7': '2', '8': '2', '10': '2' };

	const { data, error } = await supabase
		.from('productos')
		.insert({
			...parsed.data,
			empresa_id: empresaId,
			iva_codigo: ivaMap[parsed.data.iva_codigo_porcentaje] || '2',
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return { error: 'Ya existe un producto con ese código' };
		return { error: error.message };
	}

	revalidatePath('/productos');
	return { data, success: true };
}

export async function actualizarProducto(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const raw = Object.fromEntries(formData);
	const id = raw.id;
	delete raw.id;

	const parsed = productoSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const ivaMap = { '0': '2', '2': '2', '3': '2', '4': '2', '5': '2', '6': '2', '7': '2', '8': '2', '10': '2' };

	const { data, error } = await supabase
		.from('productos')
		.update({
			...parsed.data,
			iva_codigo: ivaMap[parsed.data.iva_codigo_porcentaje] || '2',
		})
		.eq('id', id)
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/productos');
	return { data, success: true };
}

export async function obtenerProducto(id) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { data, error } = await supabase
		.from('productos')
		.select('*')
		.eq('id', id)
		.single();

	if (error) return { error: error.message };
	return { data };
}

export async function toggleProducto(id, activo) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { error } = await supabase
		.from('productos')
		.update({ activo })
		.eq('id', id);

	if (error) return { error: error.message };
	revalidatePath('/productos');
	return { success: true };
}

export async function importarProductosCSV(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const file = formData.get('archivo');
	if (!file || !(file instanceof File)) {
		return { error: 'Selecciona un archivo CSV' };
	}

	const text = await file.text();
	const lines = text.split('\n').filter((l) => l.trim());
	if (lines.length < 2) return { error: 'El archivo está vacío' };

	const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
	const errores = [];
	const productosValidos = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map((v) => v.trim());
		const row = {};
		headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

		const codigo = row.codigo_principal || row.codigo || '';
		const nombre = row.nombre || '';
		const precio = row.precio_unitario || row.precio || '0';
		const iva = row.iva_codigo_porcentaje || row.iva || '2';

		if (!codigo || !nombre) {
			errores.push({ fila: i + 1, error: 'Código y nombre son obligatorios' });
			continue;
		}

		productosValidos.push({
			empresa_id: empresaId,
			codigo_principal: codigo,
			nombre,
			descripcion: row.descripcion || '',
			precio_unitario: parseFloat(precio) || 0,
			iva_codigo: '2',
			iva_codigo_porcentaje: iva,
			categoria: row.categoria || '',
		});
	}

	if (productosValidos.length > 0) {
		const { error } = await supabase
			.from('productos')
			.upsert(productosValidos, { onConflict: 'empresa_id,codigo_principal' });

		if (error) return { error: error.message };
	}

	revalidatePath('/productos');
	return { success: true, importados: productosValidos.length, errores };
}
