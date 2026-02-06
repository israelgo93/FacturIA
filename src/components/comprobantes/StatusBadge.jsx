'use client';

const ESTADOS = {
	draft: { label: 'Borrador', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
	signed: { label: 'Firmado', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
	sent: { label: 'Enviado', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
	PPR: { label: 'Procesando', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
	AUT: { label: 'Autorizado', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
	NAT: { label: 'No Autorizado', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
	DEV: { label: 'Devuelto', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
	voided: { label: 'Anulado', bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280' },
	// Legacy
	CREADO: { label: 'Borrador', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
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
