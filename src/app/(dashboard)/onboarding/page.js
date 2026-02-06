'use client';

import { useEffect, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Building2, MapPin, Hash, FileKey, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import {
	obtenerDatosOnboarding,
	guardarEmpresaOnboarding,
	guardarEstablecimientoOnboarding,
	guardarPuntoEmisionOnboarding,
	completarOnboarding,
} from './actions';
import { REGIMENES_FISCALES } from '@/lib/utils/sri-catalogs';
import OnboardingProgress from './components/OnboardingProgress';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [datos, setDatos] = useState(null);
	const [loading, setLoading] = useState(true);

	const [empresaState, empresaAction, empresaPending] = useActionState(guardarEmpresaOnboarding, null);
	const [estabState, estabAction, estabPending] = useActionState(guardarEstablecimientoOnboarding, null);
	const [puntoState, puntoAction, puntoPending] = useActionState(guardarPuntoEmisionOnboarding, null);

	useEffect(() => {
		obtenerDatosOnboarding().then((result) => {
			if (result.data) {
				setDatos(result.data);
				if (result.data.empresa?.onboarding_completado) {
					router.push('/');
					return;
				}
				setStep(Math.min(result.data.paso || 0, 4));
			}
			setLoading(false);
		});
	}, [router]);

	useEffect(() => {
		if (empresaState?.success) { setStep(1); toast.success('Datos de empresa guardados'); }
		if (empresaState?.error) toast.error(empresaState.error);
	}, [empresaState]);

	useEffect(() => {
		if (estabState?.success) { setStep(2); toast.success('Establecimiento guardado'); }
		if (estabState?.error) toast.error(estabState.error);
	}, [estabState]);

	useEffect(() => {
		if (puntoState?.success) { setStep(3); toast.success('Punto de emisión guardado'); }
		if (puntoState?.error) toast.error(puntoState.error);
	}, [puntoState]);

	const handleSkipCertificado = () => setStep(4);

	const handleCompletar = async () => {
		const result = await completarOnboarding();
		if (result.success) {
			toast.success('Configuración completada');
			router.push('/');
		} else {
			toast.error(result.error);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
			</div>
		);
	}

	const empresa = datos?.empresa;

	return (
		<div className="max-w-2xl mx-auto py-8">
			<div className="text-center mb-8">
				<h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
					Configura tu empresa
				</h1>
				<p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
					Completa estos pasos para empezar a facturar
				</p>
			</div>

			<OnboardingProgress currentStep={step} />

			{/* Paso 0: Datos de empresa */}
			{step === 0 && (
				<GlassCard className="p-6" hover={false}>
					<div className="flex items-center gap-3 mb-5">
						<Building2 className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
						<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Datos de la Empresa</h2>
					</div>
					{empresaState?.error && <GlassAlert type="error" message={empresaState.error} className="mb-4" />}
					<form action={empresaAction} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassInput label="RUC" name="ruc" placeholder="1790012345001" required defaultValue={empresa?.ruc || ''} error={empresaState?.errors?.ruc?.[0]} />
							<GlassSelect label="Ambiente SRI" name="ambiente" required options={[{ value: '1', label: 'Pruebas' }, { value: '2', label: 'Producción' }]} defaultValue={String(empresa?.ambiente || 1)} />
						</div>
						<GlassInput label="Razón Social" name="razon_social" placeholder="Nombre legal" required defaultValue={empresa?.razon_social || ''} error={empresaState?.errors?.razon_social?.[0]} />
						<GlassInput label="Nombre Comercial" name="nombre_comercial" placeholder="Opcional" defaultValue={empresa?.nombre_comercial || ''} />
						<GlassInput label="Dirección Matriz" name="direccion_matriz" placeholder="Dirección principal" required defaultValue={empresa?.direccion_matriz || ''} error={empresaState?.errors?.direccion_matriz?.[0]} />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect label="Régimen Fiscal" name="regimen_fiscal" required options={REGIMENES_FISCALES} defaultValue={empresa?.regimen_fiscal || 'GENERAL'} />
							<GlassSelect label="Obligado Contabilidad" name="obligado_contabilidad" required options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Sí' }]} defaultValue={empresa?.obligado_contabilidad ? 'true' : 'false'} />
						</div>
						<GlassInput label="Contribuyente Especial" name="contribuyente_especial" placeholder="Nro resolución (si aplica)" defaultValue={empresa?.contribuyente_especial || ''} />
						<GlassInput label="Agente de Retención" name="agente_retencion" placeholder="Nro resolución (si aplica)" defaultValue={empresa?.agente_retencion || ''} />
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassInput label="Email" name="email_notificaciones" type="email" placeholder="correo@empresa.com" defaultValue={empresa?.email_notificaciones || ''} />
							<GlassInput label="Teléfono" name="telefono" placeholder="0991234567" defaultValue={empresa?.telefono || ''} />
						</div>
						<div className="flex justify-end pt-2">
							<GlassButton type="submit" loading={empresaPending} iconRight={ArrowRight}>Siguiente</GlassButton>
						</div>
					</form>
				</GlassCard>
			)}

			{/* Paso 1: Establecimiento */}
			{step === 1 && (
				<GlassCard className="p-6" hover={false}>
					<div className="flex items-center gap-3 mb-5">
						<MapPin className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
						<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Establecimiento Principal</h2>
					</div>
					{estabState?.error && <GlassAlert type="error" message={estabState.error} className="mb-4" />}
					<form action={estabAction} className="space-y-4">
						<GlassInput label="Código" name="codigo" placeholder="001" required defaultValue="001" error={estabState?.errors?.codigo?.[0]} />
						<GlassInput label="Dirección" name="direccion" placeholder="Dirección del establecimiento" required defaultValue={empresa?.direccion_matriz || ''} error={estabState?.errors?.direccion?.[0]} />
						<GlassInput label="Nombre Comercial" name="nombre_comercial" placeholder="Opcional" defaultValue={empresa?.nombre_comercial || ''} />
						<div className="flex justify-between pt-2">
							<GlassButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(0)}>Anterior</GlassButton>
							<GlassButton type="submit" loading={estabPending} iconRight={ArrowRight}>Siguiente</GlassButton>
						</div>
					</form>
				</GlassCard>
			)}

			{/* Paso 2: Punto de Emisión */}
			{step === 2 && (
				<GlassCard className="p-6" hover={false}>
					<div className="flex items-center gap-3 mb-5">
						<Hash className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
						<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Punto de Emisión Principal</h2>
					</div>
					{puntoState?.error && <GlassAlert type="error" message={puntoState.error} className="mb-4" />}
					<form action={puntoAction} className="space-y-4">
						<GlassInput label="Código" name="codigo" placeholder="001" required defaultValue="001" error={puntoState?.errors?.codigo?.[0]} />
						<GlassInput label="Descripción" name="descripcion" placeholder="Caja principal (opcional)" />
						<div className="flex justify-between pt-2">
							<GlassButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Anterior</GlassButton>
							<GlassButton type="submit" loading={puntoPending} iconRight={ArrowRight}>Siguiente</GlassButton>
						</div>
					</form>
				</GlassCard>
			)}

			{/* Paso 3: Certificado (opcional) */}
			{step === 3 && (
				<GlassCard className="p-6" hover={false}>
					<div className="flex items-center gap-3 mb-5">
						<FileKey className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
						<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Certificado Digital</h2>
					</div>
					<p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
						Puedes subir tu certificado .p12 ahora o hacerlo después desde Configuración.
					</p>
					<div className="flex justify-between pt-2">
						<GlassButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(2)}>Anterior</GlassButton>
						<div className="flex gap-2">
							<GlassButton variant="secondary" onClick={handleSkipCertificado}>Omitir por ahora</GlassButton>
							<GlassButton onClick={() => {
								router.push('/configuracion/certificado');
							}} iconRight={ArrowRight}>
								Subir Certificado
							</GlassButton>
						</div>
					</div>
				</GlassCard>
			)}

			{/* Paso 4: Resumen */}
			{step === 4 && (
				<GlassCard className="p-6" hover={false}>
					<div className="flex items-center gap-3 mb-5">
						<CheckCircle className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
						<h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Resumen de Configuración</h2>
					</div>

					<div className="space-y-4">
						<div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
							<p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Empresa</p>
							<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{empresa?.razon_social || '-'}</p>
							<p className="text-xs" style={{ color: 'var(--text-secondary)' }}>RUC: {empresa?.ruc || '-'}</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
								<p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Establecimiento</p>
								<p className="text-sm" style={{ color: 'var(--text-primary)' }}>{datos?.establecimientos?.[0]?.codigo || '001'}</p>
							</div>
							<div className="p-4 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
								<p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Punto de Emisión</p>
								<p className="text-sm" style={{ color: 'var(--text-primary)' }}>{datos?.puntos?.[0]?.codigo || '001'}</p>
							</div>
						</div>
					</div>

					<div className="flex justify-between pt-6">
						<GlassButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(3)}>Anterior</GlassButton>
						<GlassButton onClick={handleCompletar} iconRight={CheckCircle} size="lg">
							Completar Configuración
						</GlassButton>
					</div>
				</GlassCard>
			)}
		</div>
	);
}
