'use server';

import { createClient } from '@/lib/supabase/server';
import { empresaSchema, establecimientoSchema, puntoEmisionSchema } from '@/lib/validations/empresa';
import { encrypt } from '@/lib/crypto/aes';
import { parseCertificate } from '@/lib/sri/certificate-parser';
import { revalidatePath } from 'next/cache';

export async function guardarEmpresaOnboarding(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const parsed = empresaSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	// Upsert empresa
	const { data: existing } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	let empresa;
	if (existing) {
		const { data, error } = await supabase
			.from('empresas')
			.update({ ...parsed.data, onboarding_paso: 1 })
			.eq('id', existing.id)
			.select()
			.single();
		if (error) return { error: error.message };
		empresa = data;
	} else {
		const { data, error } = await supabase
			.from('empresas')
			.insert({ ...parsed.data, user_id: user.id, onboarding_paso: 1 })
			.select()
			.single();
		if (error) return { error: error.message };
		empresa = data;
	}

	return { success: true, data: empresa };
}

export async function guardarEstablecimientoOnboarding(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);
	const parsed = establecimientoSchema.safeParse(raw);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (!empresa) return { error: 'Empresa no encontrada' };

	// Verificar si ya existe el establecimiento 001
	const { data: existing } = await supabase
		.from('establecimientos')
		.select('id')
		.eq('empresa_id', empresa.id)
		.eq('codigo', parsed.data.codigo)
		.maybeSingle();

	let establecimiento;
	if (existing) {
		const { data, error } = await supabase
			.from('establecimientos')
			.update(parsed.data)
			.eq('id', existing.id)
			.select()
			.single();
		if (error) return { error: error.message };
		establecimiento = data;
	} else {
		const { data, error } = await supabase
			.from('establecimientos')
			.insert({ ...parsed.data, empresa_id: empresa.id })
			.select()
			.single();
		if (error) return { error: error.message };
		establecimiento = data;
	}

	// Actualizar paso onboarding
	await supabase.from('empresas').update({ onboarding_paso: 2 }).eq('id', empresa.id);

	return { success: true, data: establecimiento };
}

export async function guardarPuntoEmisionOnboarding(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const raw = Object.fromEntries(formData);

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (!empresa) return { error: 'Empresa no encontrada' };

	// Obtener el primer establecimiento
	const { data: establecimiento } = await supabase
		.from('establecimientos')
		.select('id')
		.eq('empresa_id', empresa.id)
		.order('codigo')
		.limit(1)
		.single();

	if (!establecimiento) return { error: 'Primero crea un establecimiento' };

	const codigo = raw.codigo || '001';
	const descripcion = raw.descripcion || '';

	// Verificar si ya existe
	const { data: existing } = await supabase
		.from('puntos_emision')
		.select('id')
		.eq('establecimiento_id', establecimiento.id)
		.eq('codigo', codigo)
		.maybeSingle();

	let punto;
	if (existing) {
		const { data, error } = await supabase
			.from('puntos_emision')
			.update({ codigo, descripcion })
			.eq('id', existing.id)
			.select()
			.single();
		if (error) return { error: error.message };
		punto = data;
	} else {
		const { data, error } = await supabase
			.from('puntos_emision')
			.insert({
				establecimiento_id: establecimiento.id,
				empresa_id: empresa.id,
				codigo,
				descripcion,
			})
			.select()
			.single();
		if (error) return { error: error.message };
		punto = data;
	}

	// Actualizar paso onboarding
	await supabase.from('empresas').update({ onboarding_paso: 3 }).eq('id', empresa.id);

	return { success: true, data: punto };
}

export async function completarOnboarding() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { error } = await supabase
		.from('empresas')
		.update({ onboarding_completado: true, onboarding_paso: 5 })
		.eq('user_id', user.id);

	if (error) return { error: error.message };
	revalidatePath('/');
	return { success: true };
}

export async function obtenerDatosOnboarding() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('*')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { data: { paso: 0 } };

	const { data: establecimientos } = await supabase
		.from('establecimientos')
		.select('*')
		.eq('empresa_id', empresa.id)
		.order('codigo');

	const { data: puntos } = await supabase
		.from('puntos_emision')
		.select('*')
		.eq('empresa_id', empresa.id)
		.order('codigo');

	const { data: certificado } = await supabase
		.from('certificados')
		.select('id, nombre_archivo, emitido_por, fecha_expiracion, activo')
		.eq('empresa_id', empresa.id)
		.eq('activo', true)
		.maybeSingle();

	return {
		data: {
			empresa,
			establecimientos: establecimientos || [],
			puntos: puntos || [],
			certificado,
			paso: empresa.onboarding_paso || 0,
		},
	};
}
