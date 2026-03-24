'use client';

/**
 * Badge unificado: estados SRI (comprobantes), genéricos CRUD y suscripción.
 * Color solo con variables semánticas de globals.css.
 */

const ESTADOS = {
	// --- Flujo interno / inglés (orquestador) ---
	draft: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	signed: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	sent: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	PPR: { label: 'Procesando', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	AUT: { label: 'Autorizado', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	NAT: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	DEV: { label: 'Devuelto', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	voided: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },

	// --- Códigos SRI 3 letras (plan Fase 6) ---
	BOR: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	FIR: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	ENV: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	REC: { label: 'Recibido', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	NAU: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ERR: { label: 'Error', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ANU: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	PROCESANDO: { label: 'Procesando', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },

	// --- Legacy mayúsculas ---
	CREADO: { label: 'Borrador', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	FIRMADO: { label: 'Firmado', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	ENVIADO: { label: 'Enviado', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	RECIBIDA: { label: 'Recibida', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	AUTORIZADO: { label: 'Autorizado', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	NO_AUTORIZADO: { label: 'No Autorizado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ANULADO: { label: 'Anulado', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },

	// --- Errores técnicos (prefijo ERROR_) ---
	ERROR_VALIDACION: { label: 'Error validación', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ERROR_XML: { label: 'Error XML', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ERROR_CERTIFICADO: { label: 'Error certificado', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ERROR_FIRMA: { label: 'Error firma', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	ERROR_CONEXION: { label: 'Error conexión', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },

	// --- Genéricos CRUD ---
	active: { label: 'Activo', bg: 'var(--badge-active-bg)', text: 'var(--badge-active-text)' },
	inactive: { label: 'Inactivo', bg: 'var(--badge-inactive-bg)', text: 'var(--badge-inactive-text)' },
	activo: { label: 'Activo', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	inactivo: { label: 'Inactivo', bg: 'var(--color-neutral-muted)', text: 'var(--color-accent-slate)' },
	pendiente: { label: 'Pendiente', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },

	// --- Suscripción (tabla suscripciones / empresas) ---
	trial: { label: 'Prueba', bg: 'var(--color-info-muted)', text: 'var(--color-info)' },
	activa: { label: 'Activa', bg: 'var(--color-success-muted)', text: 'var(--color-success)' },
	suspendida: { label: 'Suspendida', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
	cancelada: { label: 'Cancelada', bg: 'var(--color-danger-muted)', text: 'var(--color-danger)' },
	suspended: { label: 'Suspendido', bg: 'var(--color-warning-muted)', text: 'var(--color-warning)' },
};

const sizeClasses = {
	sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wider',
	md: 'px-2.5 py-1 text-xs font-medium',
};

/**
 * Normaliza clave de estado (mayúsculas/minúsculas y alias).
 * @param {string} raw
 * @returns {string}
 */
function resolveEstadoKey(raw) {
	if (raw === undefined || raw === null) return '';
	const s = String(raw).trim();
	if (!s) return '';
	if (ESTADOS[s]) return s;
	const up = s.toUpperCase();
	if (ESTADOS[up]) return up;
	const low = s.toLowerCase();
	if (ESTADOS[low]) return low;
	// Alias comunes
	if (up === 'BORRADOR' || low === 'borrador') return 'draft';
	if (up === 'ANULADO' || up === 'ANU') return 'voided';
	return s;
}

export default function StatusBadge({ estado, status, label, size = 'md', className = '' }) {
	const raw = estado !== undefined && estado !== null ? estado : status;
	const key = resolveEstadoKey(raw);
	const config = ESTADOS[key] || (typeof raw === 'string' && raw.startsWith('ERROR_') ? ESTADOS.ERROR_VALIDACION : null);

	if (!config) {
		return (
			<span
				className={`inline-flex items-center rounded-md font-medium ${sizeClasses[size] || sizeClasses.md} ${className}`}
				style={{
					background: 'var(--glass-hover)',
					color: 'var(--text-muted)',
					border: '1px solid var(--glass-border)',
				}}
			>
				{label || String(raw || '—')}
			</span>
		);
	}

	return (
		<span
			className={`inline-flex items-center rounded-md ${sizeClasses[size] || sizeClasses.md} ${className}`}
			style={{
				background: config.bg,
				color: config.text,
			}}
		>
			{label || config.label}
		</span>
	);
}

export { ESTADOS, resolveEstadoKey };
