'use client';

// Estados diferenciados por brillo (adaptable a tema)
const statusConfig = {
	CREADO: { label: 'Creado', level: 'low' },
	FIRMADO: { label: 'Firmado', level: 'medium-low' },
	ENVIADO: { label: 'Enviado', level: 'medium' },
	RECIBIDA: { label: 'Recibida', level: 'medium' },
	AUTORIZADO: { label: 'Autorizado', level: 'high' },
	NO_AUTORIZADO: { label: 'No Autorizado', level: 'very-low' },
	ANULADO: { label: 'Anulado', level: 'minimal' },
	PPR: { label: 'Procesando', level: 'medium-low' },
	active: { label: 'Activo', level: 'active' },
	inactive: { label: 'Inactivo', level: 'inactive' },
	trial: { label: 'Prueba', level: 'medium-low' },
	suspended: { label: 'Suspendido', level: 'very-low' },
};

// Clases por nivel de brillo que funcionan en ambos temas
const levelClasses = {
	'minimal': 'opacity-40',
	'very-low': 'opacity-50',
	'low': 'opacity-60',
	'medium-low': 'opacity-70',
	'medium': 'opacity-80',
	'high': 'opacity-100 font-semibold',
	'active': '',
	'inactive': '',
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
		level: 'low',
	};

	const isActive = config.level === 'active';
	const isInactive = config.level === 'inactive';

	return (
		<span
			className={`
				inline-flex items-center font-medium rounded-full border
				tracking-wide uppercase
				${levelClasses[config.level] || ''}
				${sizeClasses[size] || sizeClasses.md}
				${className}
			`.trim()}
			style={{
				background: isActive ? 'var(--badge-active-bg)' : isInactive ? 'var(--badge-inactive-bg)' : 'var(--glass-bg)',
				color: isActive ? 'var(--badge-active-text)' : isInactive ? 'var(--badge-inactive-text)' : 'var(--text-secondary)',
				borderColor: isActive ? 'var(--badge-active-border)' : isInactive ? 'var(--badge-inactive-border)' : 'var(--glass-border)',
				textDecoration: status === 'ANULADO' ? 'line-through' : 'none',
			}}
		>
			{label || config.label}
		</span>
	);
}
