'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { cambiarPlan } from '@/actions/suscripcion-actions';
import { PLAN_LIMITS } from '@/lib/suscripciones/plan-limits';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from '@/components/comprobantes/StatusBadge';

const initialState = {};

const PLAN_ORDER = ['starter', 'professional', 'enterprise'];

export default function SuscripcionClient({ suscripcion }) {
	const [state, formAction] = useFormState(cambiarPlan, initialState);

	useEffect(() => {
		if (state?.error) toast.error(state.error);
		if (state?.success) toast.success('Plan actualizado');
	}, [state]);

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
					Plan actual y cambio directo (sin pasarela de pago en esta version)
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
									<form action={formAction}>
										<input type="hidden" name="planNombre" value={key} />
										<GlassButton type="submit" variant="secondary" className="w-full">
											Seleccionar
										</GlassButton>
									</form>
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
