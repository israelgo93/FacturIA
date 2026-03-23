import '@/styles/globals.css';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/providers/ThemeProvider';
import { SerwistProvider } from './serwist-provider';

export const metadata = {
	title: 'facturIA — Facturación Electrónica con IA',
	description: 'Plataforma SaaS de facturación electrónica para Ecuador con Inteligencia Artificial. Emite comprobantes autorizados por el SRI.',
	keywords: 'facturación electrónica, Ecuador, SRI, IA, comprobantes electrónicos',
	manifest: '/manifest.json',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'facturIA',
	},
	icons: {
		icon: [
			{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
			{ url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
		],
		apple: [
			{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
		],
	},
	other: {
		'mobile-web-app-capable': 'yes',
	},
};

export const viewport = {
	themeColor: '#09090b',
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	viewportFit: 'cover',
};

export default function RootLayout({ children }) {
	return (
		<html lang="es" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="antialiased">
				<SerwistProvider swUrl="/serwist/sw.js">
					<ThemeProvider>
						{children}
						<Toaster
							position="top-right"
							richColors
							theme="dark"
							toastOptions={{
								style: {
									background: 'var(--glass-bg)',
									backdropFilter: 'blur(16px)',
									border: '1px solid var(--glass-border)',
									color: 'var(--text-primary)',
								},
							}}
						/>
					</ThemeProvider>
				</SerwistProvider>
			</body>
		</html>
	);
}
