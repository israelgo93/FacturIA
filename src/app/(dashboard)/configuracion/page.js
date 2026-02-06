'use client';

import { Building2, MapPin, Key, Mail, CreditCard, Users } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const secciones = [
	{ title: 'Empresa', desc: 'Datos del contribuyente y régimen fiscal', icon: Building2 },
	{ title: 'Establecimientos', desc: 'Establecimientos y puntos de emisión', icon: MapPin },
	{ title: 'Certificado Digital', desc: 'Administra tu certificado .p12', icon: Key },
	{ title: 'Email', desc: 'Configuración de envío de comprobantes', icon: Mail },
	{ title: 'Plan', desc: 'Tu suscripción y facturación', icon: CreditCard },
	{ title: 'Usuarios', desc: 'Gestiona los usuarios de tu empresa', icon: Users },
];

export default function ConfiguracionPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium text-white/90">Configuración</h1>
				<p className="text-white/25 text-xs mt-1">Administra tu empresa y cuenta</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{secciones.map((sec) => (
					<GlassCard key={sec.title} className="p-5 cursor-pointer">
						<div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
							<sec.icon className="w-4 h-4 text-white/35" />
						</div>
						<h3 className="text-sm text-white/70 font-medium mb-1">{sec.title}</h3>
						<p className="text-xs text-white/25">{sec.desc}</p>
					</GlassCard>
				))}
			</div>
		</div>
	);
}
