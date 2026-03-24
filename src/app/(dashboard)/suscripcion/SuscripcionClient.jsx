'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PLAN_LIMITS } from '@/lib/suscripciones/plan-limits';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from '@/components/comprobantes/StatusBadge';

const PLAN_ORDER = ['starter', 'professional', 'enterprise'];

export default function SuscripcionClient({ suscripcion }) {
	const [loading, setLoading] = useState(null);

	const handleCheckout = async (planSlug) => {
		setLoading(planSlug);
		try {
			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planSlug }),
			});
			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				setLoading(null);
				return;
			}
			if (data.url) {
				window.location.href = data.url;
			}
		} catch {
			toast.error('Error al iniciar el checkout');
			setLoading(null);
		}
	};

	const handlePortal = async () => {
		setLoading('portal');
		try {
			const res = await fetch('/api/stripe/portal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			const data = await res.json();
			if (data.error) {
				toast.error(data.error);
				setLoading(null);
				return;
			}
			if (data.url) {
				window.location.href = data.url;
			}
		} catch {
			toast.error('Error al abrir portal de facturacion');
			setLoading(null);
		}
	};

	const planRel = suscripcion?.planes;
	const planRow = Array.isArray(planRel) ? planRel[0] : planRel;
	const planNombre = planRow?.nombre || '—';
	const estado = suscripcion?.estado || 'trial';
	const trialEnd = suscripcion?.trial_ends_at
		? new Date(suscripcion.trial_ends_at).toLocaleDateString('es-EC')
		: null;

	return (
		<div className="space-y-6 max-w-4xl">
			<div>
				<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Suscripcion</h1>
				<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
					Gestiona tu plan y metodo de pago
				</p>
			</div>

			<GlassCard className="p-6" hover={false}>
				<div className="flex flex-wrap items-center gap-3 justify-between">
					<div>
						<p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Plan</p>
						<p className="text-lg font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{planNombre}</p>
						{typeof planRow?.precio_mensual === 'number' && (
							<p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
								${planRow.precio_mensual.toFixed(2)} / mes
							</p>
						)}
					</div>
					<StatusBadge estado={estado} size="md" />
				</div>
			{trialEnd && estado === 'trial' && (
				<p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
					Prueba hasta: {trialEnd}
				</p>
			)}
			{suscripcion?.stripe_customer_id && (
				<div className="mt-4">
					<GlassButton
						variant="secondary"
						size="sm"
						onClick={handlePortal}
						disabled={loading === 'portal'}
					>
						{loading === 'portal' ? 'Abriendo...' : 'Gestionar facturacion'}
					</GlassButton>
				</div>
			)}
			</GlassCard>

			<div>
				<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Comparativa de planes</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{PLAN_ORDER.map((key) => {
						const p = PLAN_LIMITS[key];
						const isCurrent = planNombre === key;
						return (
							<GlassCard key={key} className="p-5 flex flex-col h-full" hover={!isCurrent}>
								<h3 className="text-sm font-medium capitalize mb-2" style={{ color: 'var(--text-primary)' }}>{key}</h3>
								<p className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
									${p.precio_mensual.toFixed(2)}
									<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/mes</span>
								</p>
								<ul className="text-xs space-y-1.5 mb-4 flex-1" style={{ color: 'var(--text-muted)' }}>
									<li>Comprobantes: {p.comprobantes_mes ?? 'Ilimitado'}</li>
									<li>Usuarios: {p.usuarios ?? 'Ilimitado'}</li>
									<li>Reportes IA: {p.reportes_ia ? 'Si' : 'No'}</li>
									<li>RDEP: {p.rdep ? 'Si' : 'No'}</li>
								</ul>
						{!isCurrent && (
							<GlassButton
								variant="secondary"
								className="w-full"
								onClick={() => suscripcion?.stripe_customer_id ? handlePortal() : handleCheckout(key)}
								disabled={loading === key || loading === 'portal'}
							>
								{(loading === key || loading === 'portal') ? 'Redirigiendo...' : suscripcion?.stripe_customer_id ? 'Cambiar plan' : 'Seleccionar'}
							</GlassButton>
						)}
								{isCurrent && (
									<p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Plan actual</p>
								)}
							</GlassCard>
						);
					})}
				</div>
			</div>
		</div>
	);
}
