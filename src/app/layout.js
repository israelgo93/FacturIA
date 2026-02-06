import '@/styles/globals.css';
import { Toaster } from 'sonner';

export const metadata = {
	title: 'facturIA — Facturación Electrónica con IA',
	description: 'Plataforma SaaS de facturación electrónica para Ecuador con Inteligencia Artificial. Emite comprobantes autorizados por el SRI.',
	keywords: 'facturación electrónica, Ecuador, SRI, IA, comprobantes electrónicos',
};

export default function RootLayout({ children }) {
	return (
		<html lang="es">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
					rel="stylesheet"
				/>
			</head>
			<body className="antialiased">
				{children}
				<Toaster
					position="top-right"
					richColors
					theme="dark"
					toastOptions={{
						style: {
							background: 'rgba(255, 255, 255, 0.08)',
							backdropFilter: 'blur(16px)',
							border: '1px solid rgba(255, 255, 255, 0.15)',
							color: 'white',
						},
					}}
				/>
			</body>
		</html>
	);
}
