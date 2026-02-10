'use client';

import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ESTADO_CONFIG = {
	AUT: { icon: CheckCircle, label: 'Autorizado', color: 'var(--color-success)', description: 'La factura fue autorizada por el SRI' },
	NAT: { icon: XCircle, label: 'No Autorizado', color: 'var(--color-danger)', description: 'El SRI rechazó la factura' },
	PPR: { icon: Clock, label: 'En Procesamiento', color: 'var(--color-warning)', description: 'El SRI está procesando la factura' },
	DEV: { icon: AlertTriangle, label: 'Devuelta', color: 'var(--color-danger)', description: 'El SRI devolvió la factura por errores' },
	ERROR_VALIDACION: { icon: XCircle, label: 'Error de Validación', color: 'var(--color-danger)', description: 'Los datos no pasaron la validación' },
};

export default function StepConfirmacion({ wizard }) {
	const router = useRouter();
	const { procesando, resultado } = wizard;

	if (procesando) {
		return (
			<div className="text-center py-12">
				<Loader2 className="w-12 h-12 mx-auto animate-spin mb-4" style={{ color: 'var(--text-muted)' }} />
				<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
					Firmando y enviando al SRI...
				</p>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Este proceso puede tomar unos segundos
				</p>
			</div>
		);
	}

	if (!resultado) {
		return (
			<div className="text-center py-8">
				<FileText className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: 'var(--text-muted)' }} />
				<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
					Revise los datos en el paso anterior y haga clic en &quot;Emitir Factura&quot;
				</p>
			</div>
		);
	}

	const config = ESTADO_CONFIG[resultado.estado] || ESTADO_CONFIG.DEV;
	const Icon = config.icon;

	return (
		<div className="text-center py-6 space-y-6">
			<div>
				<Icon className="w-16 h-16 mx-auto mb-3" style={{ color: config.color }} />
				<h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
					{config.label}
				</h3>
				<p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
					{config.description}
				</p>
			</div>

			{resultado.numeroCompleto && (
				<div className="p-4 rounded-xl border inline-block" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>Número</p>
					<p className="font-mono text-lg" style={{ color: 'var(--text-primary)' }}>{resultado.numeroCompleto}</p>
				</div>
			)}

			{resultado.claveAcceso && (
				<div className="p-3 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
					<p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Clave de Acceso</p>
					<p className="font-mono text-xs break-all" style={{ color: 'var(--text-secondary)' }}>
						{resultado.claveAcceso}
					</p>
				</div>
			)}

			{resultado.mensajes && resultado.mensajes.length > 0 && (
				<div className="text-left p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
					<p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Mensajes del SRI:</p>
					{resultado.mensajes.map((msg, i) => (
						<p key={i} className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
							{msg.tipo && <span className="font-medium">[{msg.tipo}] </span>}
							{msg.mensaje}
							{msg.informacionAdicional && ` - ${msg.informacionAdicional}`}
						</p>
					))}
				</div>
			)}

			{resultado.errores && resultado.errores.length > 0 && (
				<div className="text-left p-4 rounded-xl border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
					<p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Errores de validación:</p>
					{resultado.errores.map((err, i) => (
						<p key={i} className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>• {err}</p>
					))}
				</div>
			)}

			<div className="flex items-center justify-center gap-3 pt-2">
				<GlassButton variant="secondary" onClick={() => wizard.resetWizard()}>
					Nueva Factura
				</GlassButton>
				<GlassButton onClick={() => router.push('/comprobantes')}>
					Ir a Comprobantes
				</GlassButton>
			</div>
		</div>
	);
}
