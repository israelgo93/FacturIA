'use server';

import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto/aes';
import { parseCertificate } from '@/lib/sri/certificate-parser';
import { revalidatePath } from 'next/cache';

export async function obtenerCertificado() {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.maybeSingle();

	if (!empresa) return { data: null };

	const { data, error } = await supabase
		.from('certificados')
		.select('id, nombre_archivo, emitido_por, fecha_emision, fecha_expiracion, activo, created_at')
		.eq('empresa_id', empresa.id)
		.eq('activo', true)
		.maybeSingle();

	if (error) return { error: error.message };
	return { data };
}

export async function subirCertificado(prevState, formData) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { data: empresa } = await supabase
		.from('empresas')
		.select('id')
		.eq('user_id', user.id)
		.single();

	if (!empresa) return { error: 'Primero debes registrar tu empresa' };

	const file = formData.get('certificado');
	const password = formData.get('password');

	if (!file || !(file instanceof File)) {
		return { error: 'Selecciona un archivo .p12' };
	}

	if (!password || password.length < 1) {
		return { error: 'La contraseña es requerida' };
	}

	// Validar extensión
	if (!file.name.endsWith('.p12') && !file.name.endsWith('.pfx')) {
		return { error: 'El archivo debe tener extensión .p12 o .pfx' };
	}

	// Validar tamaño (máx 5MB)
	if (file.size > 5 * 1024 * 1024) {
		return { error: 'El archivo no puede superar 5MB' };
	}

	try {
		// Leer y parsear el certificado
		const buffer = await file.arrayBuffer();
		const parseResult = parseCertificate(buffer, password);

		if (!parseResult.success) {
			return { error: parseResult.error };
		}

		const metadata = parseResult.data;

		// Verificar si el certificado ya venció
		if (new Date(metadata.valido_hasta) < new Date()) {
			return { error: 'El certificado ya está vencido' };
		}

		// Desactivar certificados anteriores
		await supabase
			.from('certificados')
			.update({ activo: false })
			.eq('empresa_id', empresa.id)
			.eq('activo', true);

		// Subir archivo a Storage
		const storagePath = `${empresa.id}/${Date.now()}_${file.name}`;
		const { error: uploadError } = await supabase.storage
			.from('certificados')
			.upload(storagePath, buffer, {
				contentType: 'application/x-pkcs12',
				upsert: false,
			});

		if (uploadError) {
			return { error: `Error al subir archivo: ${uploadError.message}` };
		}

		// Cifrar la contraseña
		const passwordEncrypted = encrypt(password);

		// Guardar registro en BD
		const { data, error: dbError } = await supabase
			.from('certificados')
			.insert({
				empresa_id: empresa.id,
				nombre_archivo: file.name,
				storage_path: storagePath,
				password_encrypted: passwordEncrypted,
				emitido_por: metadata.emisor,
				fecha_emision: metadata.valido_desde,
				fecha_expiracion: metadata.valido_hasta,
				activo: true,
			})
			.select()
			.single();

		if (dbError) return { error: dbError.message };

		revalidatePath('/configuracion/certificado');
		return {
			success: true,
			data: {
				...data,
				propietario: metadata.propietario,
			},
		};
	} catch (err) {
		return { error: 'Error procesando el certificado' };
	}
}

export async function eliminarCertificado(id) {
	const supabase = await createClient();
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) return { error: 'No autenticado' };

	const { error } = await supabase
		.from('certificados')
		.update({ activo: false })
		.eq('id', id);

	if (error) return { error: error.message };
	revalidatePath('/configuracion/certificado');
	return { success: true };
}
