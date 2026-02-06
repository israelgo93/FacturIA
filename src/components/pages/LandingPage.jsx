'use client';

import Link from 'next/link';
import {
	Zap, FileText, Shield, BarChart3, Brain,
	ArrowRight, Check, Sparkles, Clock, Globe,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LandingPage() {
	return (
		<div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
			{/* Header */}
			<header
				className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
				style={{
					background: 'var(--topbar-bg)',
					borderBottom: '1px solid var(--divider)',
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div style={{ background: 'var(--btn-primary-bg)', padding: '6px', borderRadius: '8px' }}>
							<Zap className="w-4 h-4" style={{ color: 'var(--btn-primary-text)' }} />
						</div>
						<span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-secondary)' }}>
							factur<span style={{ color: 'var(--text-primary)' }}>IA</span>
						</span>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Link
							href="/login"
							className="text-sm px-4 py-2 transition-colors duration-300"
							style={{ color: 'var(--text-muted)' }}
						>
							Iniciar Sesión
						</Link>
						<Link
							href="/registro"
							className="text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-300"
							style={{
								background: 'var(--btn-primary-bg)',
								color: 'var(--btn-primary-text)',
							}}
						>
							Registrarse
						</Link>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className="pt-36 pb-24 px-4">
				<div className="max-w-3xl mx-auto text-center">
					<div
						className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs tracking-wide mb-8"
						style={{
							background: 'var(--glass-bg)',
							border: '1px solid var(--glass-border)',
							color: 'var(--text-secondary)',
						}}
					>
						<Sparkles className="w-3.5 h-3.5" />
						Potenciado por Inteligencia Artificial
					</div>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-6">
						<span style={{ color: 'var(--text-primary)' }}>Facturación Electrónica</span>
						<br />
						<span style={{ color: 'var(--text-muted)' }}>con Inteligencia Artificial</span>
					</h1>
					<p className="text-base max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
						Emite comprobantes electrónicos autorizados por el SRI de Ecuador.
						La IA te asiste en cada paso: configuración, emisión y reportes tributarios.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<Link
							href="/registro"
							className="inline-flex items-center gap-2 px-7 py-3 font-medium text-sm rounded-xl transition-all duration-300"
							style={{
								background: 'var(--btn-primary-bg)',
								color: 'var(--btn-primary-text)',
								boxShadow: '0 0 30px var(--glass-hover)',
							}}
						>
							Empieza Gratis <ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							href="#features"
							className="inline-flex items-center gap-2 px-7 py-3 font-medium text-sm rounded-xl transition-all duration-300"
							style={{
								background: 'var(--glass-bg)',
								color: 'var(--text-secondary)',
								border: '1px solid var(--glass-border)',
							}}
						>
							Conocer más
						</Link>
					</div>
				</div>
			</section>

			{/* Features */}
			<section id="features" className="py-24 px-4">
				<div className="max-w-5xl mx-auto">
					<p className="text-xs uppercase tracking-widest text-center mb-3" style={{ color: 'var(--text-muted)' }}>Funcionalidades</p>
					<h2 className="text-2xl font-semibold text-center mb-16" style={{ color: 'var(--text-primary)' }}>Todo lo que necesitas</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{[
							{ icon: FileText, title: 'Comprobantes Electrónicos', desc: 'Facturas, notas de crédito/débito, retenciones, guías de remisión y liquidaciones.' },
							{ icon: Brain, title: 'IA Tributaria', desc: 'Asistente inteligente que conoce la normativa del SRI y te guía en cada paso.' },
							{ icon: BarChart3, title: 'Reportes Automáticos', desc: 'Genera ATS, RDEP y pre-llenado de formularios 103/104 con un clic.' },
							{ icon: Shield, title: 'Firma Electrónica', desc: 'Firma XAdES-BES con tu certificado .p12. Comunicación directa con el SRI.' },
							{ icon: Clock, title: 'Alertas Inteligentes', desc: 'Recordatorios de vencimientos, anomalías y sugerencias de optimización.' },
							{ icon: Globe, title: 'Desde Cualquier Lugar', desc: 'Aplicación web progresiva. Factura desde computador, tablet o celular.' },
						].map((feature, i) => (
							<div key={i} className="glass p-6 glass-hover transition-all duration-300">
								<div
									className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
									style={{ background: 'var(--glass-hover)' }}
								>
									<feature.icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
								</div>
								<h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
								<p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section id="pricing" className="py-24 px-4">
				<div className="max-w-4xl mx-auto">
					<p className="text-xs uppercase tracking-widest text-center mb-3" style={{ color: 'var(--text-muted)' }}>Precios</p>
					<h2 className="text-2xl font-semibold text-center mb-16" style={{ color: 'var(--text-primary)' }}>Planes simples y transparentes</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						{[
							{
								name: 'Starter', price: '$9.99', features: [
									'50 comprobantes/mes', '1 usuario', '1 establecimiento',
									'Generación ATS con IA', 'Dashboard básico', 'Soporte email',
								],
							},
							{
								name: 'Professional', price: '$24.99', popular: true, features: [
									'300 comprobantes/mes', '5 usuarios', '3 establecimientos',
									'Reportes IA avanzados', 'RDEP automático', 'Soporte email + chat',
								],
							},
							{
								name: 'Enterprise', price: '$49.99', features: [
									'Comprobantes ilimitados', 'Usuarios ilimitados', 'Establecimientos ilimitados',
									'API access', 'Multi-empresa', 'Soporte prioritario',
								],
							},
						].map((plan) => (
							<div
								key={plan.name}
								className="glass p-6 relative"
								style={plan.popular ? {
									borderColor: 'var(--glass-active)',
									background: 'var(--glass-hover)',
								} : {}}
							>
								{plan.popular && (
									<div
										className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full"
										style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
									>
										Popular
									</div>
								)}
								<h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{plan.name}</h3>
								<div className="mb-5">
									<span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
									<span className="text-xs" style={{ color: 'var(--text-muted)' }}>/mes</span>
								</div>
								<ul className="space-y-2.5 mb-6">
									{plan.features.map((f) => (
										<li key={f} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
											<Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
											{f}
										</li>
									))}
								</ul>
								<Link
									href="/registro"
									className="block text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
									style={plan.popular ? {
										background: 'var(--btn-primary-bg)',
										color: 'var(--btn-primary-text)',
									} : {
										background: 'var(--glass-bg)',
										color: 'var(--text-secondary)',
										border: '1px solid var(--glass-border)',
									}}
								>
									Comenzar
								</Link>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* How it works */}
			<section className="py-24 px-4">
				<div className="max-w-3xl mx-auto">
					<p className="text-xs uppercase tracking-widest text-center mb-3" style={{ color: 'var(--text-muted)' }}>Proceso</p>
					<h2 className="text-2xl font-semibold text-center mb-16" style={{ color: 'var(--text-primary)' }}>Cómo funciona</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{[
							{ step: '1', title: 'Regístrate', desc: 'Crea tu cuenta gratis en menos de un minuto' },
							{ step: '2', title: 'Configura', desc: 'La IA te guía para configurar tu empresa' },
							{ step: '3', title: 'Factura', desc: 'Emite comprobantes autorizados por el SRI' },
							{ step: '4', title: 'Reporta', desc: 'Genera ATS y reportes con un solo clic' },
						].map((item) => (
							<div key={item.step} className="text-center">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm mx-auto mb-4"
									style={{
										background: 'var(--glass-hover)',
										border: '1px solid var(--glass-active)',
										color: 'var(--text-secondary)',
									}}
								>
									{item.step}
								</div>
								<h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
								<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-10 px-4" style={{ borderTop: '1px solid var(--divider)' }}>
				<div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div style={{ background: 'var(--btn-primary-bg)', padding: '4px', borderRadius: '6px' }}>
							<Zap className="w-3 h-3" style={{ color: 'var(--btn-primary-text)' }} />
						</div>
						<span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--text-muted)' }}>facturIA</span>
					</div>
					<p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
						&copy; {new Date().getFullYear()} facturIA. Todos los derechos reservados.
					</p>
					<div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
						<a href="#" className="transition-colors duration-300 hover:opacity-70">Términos</a>
						<a href="#" className="transition-colors duration-300 hover:opacity-70">Privacidad</a>
						<a href="#" className="transition-colors duration-300 hover:opacity-70">Contacto</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
