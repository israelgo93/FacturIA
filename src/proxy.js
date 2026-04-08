import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function proxy(request) {
	let response = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => request.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value)
					);
					response = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options)
					);
				},
			},
		}
	);

	// Refrescar token de sesión
	const { data: { user } } = await supabase.auth.getUser();

	const { pathname } = request.nextUrl;

	const protectedPaths = [
		'/dashboard', '/comprobantes', '/clientes', '/productos',
		'/compras', '/empleados', '/reportes', '/configuracion',
		'/onboarding', '/asistente', '/equipo', '/suscripcion', '/admin',
	];
	const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

	if (!user && isProtectedRoute) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	if (user && pathname.startsWith('/admin')) {
		const { data: perfil } = await supabase
			.from('perfiles_empresa')
			.select('is_platform_admin')
			.eq('user_id', user.id)
			.eq('is_platform_admin', true)
			.maybeSingle();

		if (!perfil) {
			return NextResponse.redirect(new URL('/dashboard', request.url));
		}
	}

	const authPaths = ['/login', '/registro', '/recuperar'];
	if (user && authPaths.includes(pathname)) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return response;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|images|api|serwist).*)',
	],
};
