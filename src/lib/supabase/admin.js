import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service_role para operaciones server-side
 * que necesitan bypass de RLS (ej: descargar certificados para firmar).
 * 
 * IMPORTANTE: Solo usar en contextos server-side (Server Actions, API Routes).
 * Nunca exponer al cliente.
 */
let adminClient = null;

export function createAdminClient() {
	if (adminClient) return adminClient;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		throw new Error(
			'Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas para el admin client'
		);
	}

	adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	return adminClient;
}
