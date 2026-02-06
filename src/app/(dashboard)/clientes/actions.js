'use server';

import { createClient } from '@/lib/supabase/server';
import { clienteSchema } from '@/lib/validations/cliente';
import { validarIdentificacion } from '@/lib/validations/common';
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

export async function listarClientes({ busqueda = '', page = 1, perPage = 20, filtroTipo = '', filtroActivo = '' } = {}) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	let query = supabase
		.from('clientes')
		.select('*', { count: 'exact' })
		.eq('empresa_id', empresaId)
		.order('razon_social');

	if (busqueda) {
		query = query.or(`razon_social.ilike.%${busqueda}%,identificacion.ilike.%${busqueda}%`);
	}
	if (filtroTipo) query = query.eq('tipo_identificacion', filtroTipo);
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

export async function crearCliente(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const raw = Object.fromEntries(formData);
	const parsed = clienteSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('clientes')
		.insert({ ...parsed.data, empresa_id: empresaId })
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return { error: 'Ya existe un cliente con esa identificación' };
		return { error: error.message };
	}

	revalidatePath('/clientes');
	return { data, success: true };
}

export async function actualizarCliente(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const raw = Object.fromEntries(formData);
	const id = raw.id;
	delete raw.id;

	const parsed = clienteSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data, error } = await supabase
		.from('clientes')
		.update(parsed.data)
		.eq('id', id)
		.select()
		.single();

	if (error) return { error: error.message };
	revalidatePath('/clientes');
	return { data, success: true };
}

export async function obtenerCliente(id) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { data, error } = await supabase
		.from('clientes')
		.select('*')
		.eq('id', id)
		.single();

	if (error) return { error: error.message };
	return { data };
}

export async function toggleCliente(id, activo) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { supabase } = result;

	const { error } = await supabase
		.from('clientes')
		.update({ activo })
		.eq('id', id);

	if (error) return { error: error.message };
	revalidatePath('/clientes');
	return { success: true };
}

export async function importarClientesCSV(prevState, formData) {
	const result = await obtenerEmpresaId();
	if (result.error) return result;
	const { empresaId, supabase } = result;

	const file = formData.get('archivo');
	if (!file || !(file instanceof File)) {
		return { error: 'Selecciona un archivo CSV' };
	}

	const text = await file.text();
	const lines = text.split('\n').filter((l) => l.trim());
	if (lines.length < 2) return { error: 'El archivo está vacío o no tiene datos' };

	const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
	const errores = [];
	const clientesValidos = [];

	for (let i = 1; i < lines.length; i++) {
		const values = lines[i].split(',').map((v) => v.trim());
		const row = {};
		headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

		const tipo = row.tipo_identificacion || row.tipo || '';
		const identificacion = row.identificacion || row.cedula || row.ruc || '';
		const razon_social = row.razon_social || row.nombre || '';

		if (!tipo || !identificacion || !razon_social) {
			errores.push({ fila: i + 1, error: 'Campos obligatorios faltantes' });
			continue;
		}

		if (!validarIdentificacion(tipo, identificacion)) {
			errores.push({ fila: i + 1, error: `Identificación inválida: ${identificacion}` });
			continue;
		}

		clientesValidos.push({
			empresa_id: empresaId,
			tipo_identificacion: tipo,
			identificacion,
			razon_social,
			direccion: row.direccion || '',
			email: row.email || '',
			telefono: row.telefono || '',
		});
	}

	if (clientesValidos.length > 0) {
		const { error } = await supabase
			.from('clientes')
			.upsert(clientesValidos, { onConflict: 'empresa_id,identificacion' });

		if (error) return { error: error.message };
	}

	revalidatePath('/clientes');
	return {
		success: true,
		importados: clientesValidos.length,
		errores,
	};
}
