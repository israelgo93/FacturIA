'use client';

import Link from 'next/link';
import { Building2, MapPin, Hash, FileKey, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const sections = [
	{
		title: 'Datos de la Empresa',
		description: 'RUC, razón social, régimen fiscal y datos generales',
		href: '/configuracion/empresa',
		icon: Building2,
	},
	{
		title: 'Establecimientos',
		description: 'Gestiona los establecimientos de tu empresa',
		href: '/configuracion/establecimientos',
		icon: MapPin,
	},
	{
		title: 'Puntos de Emisión',
		description: 'Configura los puntos de emisión por establecimiento',
		href: '/configuracion/puntos-emision',
		icon: Hash,
	},
	{
		title: 'Certificado Digital',
		description: 'Sube y gestiona tu certificado de firma electrónica .p12',
		href: '/configuracion/certificado',
		icon: FileKey,
	},
];

export default function ConfiguracionPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Configuración</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Administra los datos de tu empresa y configuración del sistema
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{sections.map((section) => (
					<Link key={section.href} href={section.href}>
						<GlassCard className="p-5 h-full">
							<div className="flex items-center gap-4">
								<div
									className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
									style={{ background: 'var(--glass-hover)' }}
								>
									<section.icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
								</div>
								<div className="flex-1">
									<h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
										{section.title}
									</h3>
									<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
										{section.description}
									</p>
								</div>
								<ChevronRight className="w-4 h-4 shrink-0 opacity-40" style={{ color: 'var(--text-muted)' }} />
							</div>
						</GlassCard>
					</Link>
				))}
			</div>
		</div>
	);
}
