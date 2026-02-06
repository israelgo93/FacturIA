'use client';

import { useEffect, useState, useActionState } from 'react';
import { ArrowLeft, Upload, FileKey, ShieldCheck, AlertTriangle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { obtenerCertificado, subirCertificado, eliminarCertificado } from './actions';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassButton from '@/components/ui/GlassButton';
import GlassAlert from '@/components/ui/GlassAlert';

export default function CertificadoPage() {
	const [certificado, setCertificado] = useState(null);
	const [loading, setLoading] = useState(true);
	const [state, formAction, isPending] = useActionState(subirCertificado, null);

	const cargarDatos = async () => {
		setLoading(true);
		const result = await obtenerCertificado();
		if (result.data) setCertificado(result.data);
		else setCertificado(null);
		setLoading(false);
	};

	useEffect(() => { cargarDatos(); }, []);

	useEffect(() => {
		if (state?.success) {
			toast.success('Certificado subido exitosamente');
			cargarDatos();
		}
		if (state?.error) toast.error(state.error);
	}, [state]);

	const handleEliminar = async () => {
		if (!certificado) return;
		const result = await eliminarCertificado(certificado.id);
		if (result.success) {
			toast.success('Certificado desactivado');
			setCertificado(null);
		}
	};

	// Verificar si está por vencer (30 días)
	const diasParaVencer = certificado?.fecha_expiracion
		? Math.ceil((new Date(certificado.fecha_expiracion) - new Date()) / (1000 * 60 * 60 * 24))
		: null;

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<div className="flex items-center gap-3">
				<Link href="/configuracion" className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}>
					<ArrowLeft className="w-5 h-5" />
				</Link>
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>Certificado Digital</h1>
					<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
						Firma electrónica para comprobantes del SRI
					</p>
				</div>
			</div>

			{/* Certificado actual */}
			{certificado && (
				<GlassCard className="p-6" hover={false} animate={false}>
					<div className="flex items-start justify-between">
						<div className="flex items-start gap-4">
							<div
								className="w-10 h-10 rounded-xl flex items-center justify-center"
								style={{ background: 'var(--glass-hover)' }}
							>
								<ShieldCheck className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
							</div>
							<div>
								<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									{certificado.nombre_archivo}
								</h3>
								<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
									Emitido por: {certificado.emitido_por || 'N/A'}
								</p>
								<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
									Válido hasta: {certificado.fecha_expiracion
										? new Date(certificado.fecha_expiracion).toLocaleDateString('es-EC')
										: 'N/A'
									}
								</p>
							</div>
						</div>
						<GlassButton variant="ghost" size="sm" icon={Trash2} onClick={handleEliminar}>
							Desactivar
						</GlassButton>
					</div>

					{diasParaVencer !== null && diasParaVencer <= 30 && (
						<GlassAlert
							type="warning"
							title="Certificado próximo a vencer"
							message={`Tu certificado vence en ${diasParaVencer} días. Renuévalo para evitar interrupciones.`}
							className="mt-4"
						/>
					)}
				</GlassCard>
			)}

			{/* Formulario de subida */}
			<GlassCard className="p-6" hover={false} animate={false}>
				<div className="flex items-center gap-3 mb-5">
					<FileKey className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
					<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
						{certificado ? 'Reemplazar Certificado' : 'Subir Certificado'}
					</h3>
				</div>

				{state?.error && <GlassAlert type="error" message={state.error} className="mb-4" />}

				<form action={formAction} className="space-y-4">
					<div>
						<label
							className="block text-xs font-medium uppercase tracking-wider mb-2"
							style={{ color: 'var(--text-muted)' }}
						>
							Archivo .p12 *
						</label>
						<input
							type="file"
							name="certificado"
							accept=".p12,.pfx"
							required
							className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:cursor-pointer"
							style={{
								color: 'var(--text-secondary)',
							}}
						/>
					</div>

					<GlassInput
						label="Contraseña del certificado"
						type="password"
						name="password"
						placeholder="Ingresa la contraseña"
						required
					/>

					<GlassButton type="submit" loading={isPending} icon={Upload} size="lg" className="w-full">
						Subir Certificado
					</GlassButton>
				</form>
			</GlassCard>
		</div>
	);
}
