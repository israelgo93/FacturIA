import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/empresa/config
 * Retorna establecimientos y puntos de emisión de la empresa del usuario autenticado
 */
export async function GET() {
	try {
		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
		}

		// Obtener empresa del usuario
		const { data: empresa } = await supabase
			.from('empresas')
			.select('id')
			.eq('user_id', user.id)
			.single();

		if (!empresa) {
			return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
		}

		// Obtener establecimientos activos con puntos de emisión anidados
		const { data: establecimientos } = await supabase
			.from('establecimientos')
			.select(`
				id, codigo, direccion, nombre_comercial,
				puntos_emision:puntos_emision(id, codigo, descripcion)
			`)
			.eq('empresa_id', empresa.id)
			.eq('activo', true)
			.order('codigo');

		return NextResponse.json({
			establecimientos: establecimientos || [],
		});
	} catch (error) {
		console.error('Error en /api/empresa/config:', error);
		return NextResponse.json({ error: 'Error interno' }, { status: 500 });
	}
}
