'use client';

// Estados diferenciados por brillo (monocromático etéreo)
const statusConfig = {
	CREADO: { label: 'Creado', brightness: 'bg-white/[0.05] text-white/40 border-white/[0.08]' },
	FIRMADO: { label: 'Firmado', brightness: 'bg-white/[0.07] text-white/50 border-white/[0.10]' },
	ENVIADO: { label: 'Enviado', brightness: 'bg-white/[0.08] text-white/60 border-white/[0.12]' },
	RECIBIDA: { label: 'Recibida', brightness: 'bg-white/[0.08] text-white/60 border-white/[0.12]' },
	AUTORIZADO: { label: 'Autorizado', brightness: 'bg-white/[0.15] text-white/90 border-white/[0.20]' },
	NO_AUTORIZADO: { label: 'No Autorizado', brightness: 'bg-white/[0.03] text-white/30 border-white/[0.06]' },
	ANULADO: { label: 'Anulado', brightness: 'bg-white/[0.02] text-white/20 border-white/[0.04] line-through' },
	PPR: { label: 'Procesando', brightness: 'bg-white/[0.06] text-white/45 border-white/[0.10]' },
	active: { label: 'Activo', brightness: 'bg-white/[0.12] text-white/80 border-white/[0.15]' },
	inactive: { label: 'Inactivo', brightness: 'bg-white/[0.03] text-white/25 border-white/[0.05]' },
	trial: { label: 'Prueba', brightness: 'bg-white/[0.06] text-white/50 border-white/[0.08]' },
	suspended: { label: 'Suspendido', brightness: 'bg-white/[0.03] text-white/25 border-white/[0.05]' },
};

const sizeClasses = {
	sm: 'px-2 py-0.5 text-[10px]',
	md: 'px-2.5 py-1 text-[10px]',
	lg: 'px-3 py-1 text-xs',
};

export default function GlassBadge({
	status,
	label,
	size = 'md',
	className = '',
}) {
	const config = statusConfig[status] || {
		label: label || status,
		brightness: 'bg-white/[0.05] text-white/40 border-white/[0.08]',
	};

	return (
		<span
			className={`
				inline-flex items-center font-medium rounded-full border
				tracking-wide uppercase
				${config.brightness}
				${sizeClasses[size] || sizeClasses.md}
				${className}
			`.trim()}
		>
			{label || config.label}
		</span>
	);
}
