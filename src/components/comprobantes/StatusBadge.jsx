'use client';

const ESTADOS = {
	draft: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	signed: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	sent: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	PPR: { label: 'Procesando', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	AUT: { label: 'Autorizado', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	NAT: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	DEV: { label: 'Devuelto', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	voided: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	// Legacy
	CREADO: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
};

export default function StatusBadge({ estado, className = '' }) {
	const config = ESTADOS[estado] || ESTADOS.draft;

	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${className}`}
			style={{
				background: config.bg,
				color: config.text,
			}}
		>
			{config.label}
		</span>
	);
}

export { ESTADOS };
