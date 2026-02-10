'use client';

const ESTADOS = {
	// Comprobantes SRI
	draft: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	signed: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	sent: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	PPR: { label: 'Procesando', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	AUT: { label: 'Autorizado', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	NAT: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	DEV: { label: 'Devuelto', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	voided: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	// Legacy comprobantes
	CREADO: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	FIRMADO: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	ENVIADO: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	RECIBIDA: { label: 'Recibida', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	AUTORIZADO: { label: 'Autorizado', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	NO_AUTORIZADO: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ANULADO: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	// CRUD estados
	active: { label: 'Activo', bg: 'var(--badge-active-bg)', text: 'var(--badge-active-text)' },
	inactive: { label: 'Inactivo', bg: 'var(--badge-inactive-bg)', text: 'var(--badge-inactive-text)' },
	trial: { label: 'Prueba', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	suspended: { label: 'Suspendido', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
};

const sizeClasses = {
	sm: 'px-2 py-0.5 text-[10px]',
	md: 'px-2.5 py-1 text-xs',
};

export default function StatusBadge({ estado, label, size = 'md', className = '' }) {
	const config = ESTADOS[estado] || ESTADOS.draft;

	return (
		<span
			className={`inline-flex items-center font-medium rounded-md ${sizeClasses[size] || sizeClasses.md} ${className}`}
			style={{
				background: config.bg,
				color: config.text,
			}}
		>
			{label || config.label}
		</span>
	);
}

export { ESTADOS };
