'use client';

import { PLAN_LIMITS } from '@/lib/suscripciones/plan-limits';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from '@/components/comprobantes/StatusBadge';

const PLAN_ORDER = ['free', 'starter', 'professional', 'enterprise'];

function getCurrentPlanKey(planNombre, hasStripeCustomer) {
	const normalized = planNombre?.toLowerCase();
	if (!normalized) return 'free';
	if (normalized === 'starter' && !hasStripeCustomer) return 'free';
	if (PLAN_LIMITS[normalized]) return normalized;
	return 'free';
}

export default function SuscripcionClient({ suscripcion }) {
	const planRel = suscripcion?.planes;
	const planRow = Array.isArray(planRel) ? planRel[0] : planRel;
	const currentPlanKey = getCurrentPlanKey(planRow?.nombre, Boolean(suscripcion?.stripe_customer_id));
	const currentPlan = PLAN_LIMITS[currentPlanKey];
	const planNombre = currentPlan?.nombre || planRow?.nombre || 'Gratuito';
	const currentDocumentsLabel = currentPlan?.comprobantes_anuales == null
		? 'Documentos ilimitados'
		: `${currentPlan.comprobantes_anuales} documentos anuales`;
	const estado = suscripcion?.estado || 'trial';
	const trialEnd = suscripcion?.trial_ends_at
		? new Date(suscripcion.trial_ends_at).toLocaleDateString('es-EC')
		: null;

	return (
		<div className="space-y-6 max-w-6xl">
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
						<p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>{planNombre}</p>
						{currentPlan && (
							<p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
								{currentDocumentsLabel}
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
				<p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
					Los pagos con Stripe estan deshabilitados temporalmente. Por ahora solo esta disponible la capa gratuita.
				</p>
			</GlassCard>

			<div>
				<h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Comparativa de planes</h2>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					{PLAN_ORDER.map((key) => {
						const p = PLAN_LIMITS[key];
						const isCurrent = currentPlanKey === key;
						const comprobantes = p.comprobantes_anuales == null ? 'Ilimitados' : p.comprobantes_anuales;
						return (
							<GlassCard key={key} className="p-5 flex flex-col h-full" hover={!isCurrent}>
								<div className="flex items-start justify-between gap-2 mb-2">
									<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.nombre}</h3>
									{!p.pagos_habilitados && (
										<span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Muy pronto</span>
									)}
								</div>
								<div className="mb-4">
									<p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
										${p.precio_mensual.toFixed(2)}
										<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/mes</span>
									</p>
									<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
										${p.precio_anual.toFixed(2)} / anio
									</p>
								</div>
								<ul className="text-xs space-y-1.5 mb-4 flex-1" style={{ color: 'var(--text-muted)' }}>
									<li>Documentos: {comprobantes} / anio</li>
									<li>Usuarios: {p.usuarios ?? 'Ilimitado'}</li>
									<li>Reportes IA: {p.reportes_ia ? 'Si' : 'No'}</li>
									<li>RDEP: {p.rdep ? 'Si' : 'No'}</li>
								</ul>
								{isCurrent && (
									<p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>Plan actual</p>
								)}
								{!isCurrent && (
									<GlassButton variant="secondary" className="w-full" disabled>
										Muy pronto
									</GlassButton>
								)}
							</GlassCard>
						);
					})}
				</div>
			</div>
		</div>
	);
}
