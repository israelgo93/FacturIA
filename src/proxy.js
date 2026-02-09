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

	// Rutas que requieren autenticación
	const protectedPaths = ['/comprobantes', '/clientes', '/productos', '/reportes', '/configuracion', '/onboarding'];
	const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

	// Redirigir a login si no está autenticado en rutas protegidas
	if (!user && isProtectedRoute) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	// Redirigir usuarios autenticados fuera de páginas de auth
	const authPaths = ['/login', '/registro', '/recuperar'];
	if (user && authPaths.includes(pathname)) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return response;
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|images|api).*)',
	],
};
