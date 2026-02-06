import Link from 'next/link';
import {
	Zap, FileText, Shield, BarChart3, Brain,
	ArrowRight, Check, Sparkles, Clock, Globe,
} from 'lucide-react';

export default function LandingPage() {
	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-2xl border-b border-white/[0.05]">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<div className="bg-white p-1.5 rounded-lg">
							<Zap className="w-4 h-4 text-black" />
						</div>
						<span className="text-lg font-semibold tracking-tight text-white/90">
							factur<span className="text-white">IA</span>
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href="/login"
							className="text-sm text-white/40 hover:text-white/70 transition-colors duration-300 px-4 py-2"
						>
							Iniciar Sesión
						</Link>
						<Link
							href="/registro"
							className="text-sm font-medium text-black bg-white hover:bg-white/90 px-4 py-2 rounded-xl transition-colors duration-300"
						>
							Registrarse
						</Link>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className="pt-36 pb-24 px-4">
				<div className="max-w-3xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs tracking-wide mb-8">
						<Sparkles className="w-3.5 h-3.5" />
						Potenciado por Inteligencia Artificial
					</div>
					<h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white/95 leading-[1.1] tracking-tight mb-6">
						Facturación Electrónica
						<br />
						<span className="text-white/40">
							con Inteligencia Artificial
						</span>
					</h1>
					<p className="text-base text-white/30 max-w-xl mx-auto mb-10 leading-relaxed">
						Emite comprobantes electrónicos autorizados por el SRI de Ecuador.
						La IA te asiste en cada paso: configuración, emisión y reportes tributarios.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<Link
							href="/registro"
							className="inline-flex items-center gap-2 px-7 py-3 bg-white text-black font-medium text-sm rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.06)] hover:shadow-[0_0_40px_rgba(255,255,255,0.10)] transition-all duration-300"
						>
							Empieza Gratis <ArrowRight className="w-4 h-4" />
						</Link>
						<Link
							href="#features"
							className="inline-flex items-center gap-2 px-7 py-3 bg-white/[0.04] text-white/50 font-medium text-sm rounded-xl border border-white/[0.06] hover:bg-white/[0.07] transition-all duration-300"
						>
							Conocer más
						</Link>
					</div>
				</div>
			</section>

			{/* Features */}
			<section id="features" className="py-24 px-4">
				<div className="max-w-5xl mx-auto">
					<p className="text-xs text-white/25 uppercase tracking-widest text-center mb-3">Funcionalidades</p>
					<h2 className="text-2xl font-semibold text-white/90 text-center mb-16">Todo lo que necesitas</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{[
							{ icon: FileText, title: 'Comprobantes Electrónicos', desc: 'Facturas, notas de crédito/débito, retenciones, guías de remisión y liquidaciones.' },
							{ icon: Brain, title: 'IA Tributaria', desc: 'Asistente inteligente que conoce la normativa del SRI y te guía en cada paso.' },
							{ icon: BarChart3, title: 'Reportes Automáticos', desc: 'Genera ATS, RDEP y pre-llenado de formularios 103/104 con un clic.' },
							{ icon: Shield, title: 'Firma Electrónica', desc: 'Firma XAdES-BES con tu certificado .p12. Comunicación directa con el SRI.' },
							{ icon: Clock, title: 'Alertas Inteligentes', desc: 'Recordatorios de vencimientos, anomalías y sugerencias de optimización.' },
							{ icon: Globe, title: 'Desde Cualquier Lugar', desc: 'Aplicación web progresiva. Factura desde computador, tablet o celular.' },
						].map((feature, i) => (
							<div key={i} className="glass p-6 hover:bg-white/[0.06] hover:border-white/[0.10] transition-all duration-300">
								<div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
									<feature.icon className="w-4 h-4 text-white/50" />
								</div>
								<h3 className="text-sm font-medium text-white/80 mb-2">{feature.title}</h3>
								<p className="text-sm text-white/25 leading-relaxed">{feature.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing */}
			<section id="pricing" className="py-24 px-4">
				<div className="max-w-4xl mx-auto">
					<p className="text-xs text-white/25 uppercase tracking-widest text-center mb-3">Precios</p>
					<h2 className="text-2xl font-semibold text-white/90 text-center mb-16">Planes simples y transparentes</h2>
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
								className={`glass p-6 relative ${plan.popular ? 'border-white/[0.15] bg-white/[0.05]' : ''}`}
							>
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[10px] font-medium uppercase tracking-wider rounded-full">
										Popular
									</div>
								)}
								<h3 className="text-sm font-medium text-white/60 mb-1">{plan.name}</h3>
								<div className="mb-5">
									<span className="text-2xl font-semibold text-white/90">{plan.price}</span>
									<span className="text-white/25 text-xs">/mes</span>
								</div>
								<ul className="space-y-2.5 mb-6">
									{plan.features.map((f) => (
										<li key={f} className="flex items-start gap-2 text-xs text-white/35">
											<Check className="w-3.5 h-3.5 text-white/50 shrink-0 mt-0.5" />
											{f}
										</li>
									))}
								</ul>
								<Link
									href="/registro"
									className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
										plan.popular
											? 'bg-white text-black hover:bg-white/90'
											: 'bg-white/[0.05] text-white/50 border border-white/[0.08] hover:bg-white/[0.08]'
									}`}
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
					<p className="text-xs text-white/25 uppercase tracking-widest text-center mb-3">Proceso</p>
					<h2 className="text-2xl font-semibold text-white/90 text-center mb-16">Cómo funciona</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{[
							{ step: '1', title: 'Regístrate', desc: 'Crea tu cuenta gratis en menos de un minuto' },
							{ step: '2', title: 'Configura', desc: 'La IA te guía para configurar tu empresa' },
							{ step: '3', title: 'Factura', desc: 'Emite comprobantes autorizados por el SRI' },
							{ step: '4', title: 'Reporta', desc: 'Genera ATS y reportes con un solo clic' },
						].map((item) => (
							<div key={item.step} className="text-center">
								<div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-white/60 font-medium text-sm mx-auto mb-4">
									{item.step}
								</div>
								<h3 className="text-sm text-white/70 font-medium mb-1">{item.title}</h3>
								<p className="text-xs text-white/25">{item.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-10 px-4 border-t border-white/[0.05]">
				<div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<div className="bg-white p-1 rounded-md">
							<Zap className="w-3 h-3 text-black" />
						</div>
						<span className="text-xs font-semibold text-white/30 tracking-tight">
							facturIA
						</span>
					</div>
					<p className="text-xs text-white/15">
						&copy; {new Date().getFullYear()} facturIA. Todos los derechos reservados.
					</p>
					<div className="flex items-center gap-6 text-xs text-white/20">
						<a href="#" className="hover:text-white/40 transition-colors duration-300">Términos</a>
						<a href="#" className="hover:text-white/40 transition-colors duration-300">Privacidad</a>
						<a href="#" className="hover:text-white/40 transition-colors duration-300">Contacto</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
