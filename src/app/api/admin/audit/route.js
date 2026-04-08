import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificarSuperAdmin } from '@/lib/auth/superadmin-guard';

export async function GET(request) {
	const { isSuperAdmin } = await verificarSuperAdmin();
	if (!isSuperAdmin) {
		return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
	}

	const { searchParams } = new URL(request.url);
	const limit = parseInt(searchParams.get('limit') || '50', 10);
	const offset = parseInt(searchParams.get('offset') || '0', 10);

	const supabase = await createClient();
	const { data, error, count } = await supabase
		.from('admin_audit_log')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json({ logs: data || [], total: count || 0 });
}
