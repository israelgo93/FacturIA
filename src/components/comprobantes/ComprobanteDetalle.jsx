'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from './StatusBadge';
import ComprobanteTimeline from './ComprobanteTimeline';
import { ArrowLeft, Send, FileText, Download, Mail, Ban, Eye, RefreshCw, RotateCcw } from 'lucide-react';
import {
	consultarEstadoSRI,
	descartarComprobante,
	procesarComprobante,
	reConsultarAutorizacion,
	reenviarComprobante,
} from '@/app/(dashboard)/comprobantes/actions';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ComprobanteDetalle({ comprobante }) {
	const router = useRouter();
	const [procesando, setProcesando] = useState(false);
	const [consultandoVigencia, setConsultandoVigencia] = useState(false);
	const [enviandoEmail, setEnviandoEmail] = useState(false);
	const [actualizacion, setActualizacion] = useState(null);
	const comp = useMemo(
		() => ({ ...comprobante, ...(actualizacion || {}) }),
		[comprobante, actualizacion]
	);

	useEffect(() => {
		const supabase = createBrowserClient();
		const channel = supabase
			.channel(`comprobante-${comprobante.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'comprobantes',
					filter: `id=eq.${comprobante.id}`,
				},
				(payload) => setActualizacion((prev) => ({ ...(prev || {}), ...payload.new }))
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [comprobante.id]);

	useEffect(() => {
		if (comp.estado !== 'PPR') return undefined;

		let cancelado = false;
		let timeoutId;
		let intento = 0;
		const demoras = [5000, 10000, 30000];

		const programar = () => {
			if (cancelado || intento >= 10) return;
			const demora = demoras[Math.min(intento, demoras.length - 1)];
			timeoutId = window.setTimeout(async () => {
				if (document.hidden) {
					programar();
					return;
				}

				intento += 1;
				const result = await reConsultarAutorizacion(comprobante.id);
				if (cancelado) return;
				if (result.data && !result.data.inconclusa) {
					setActualizacion((prev) => ({ ...(prev || {}), ...result.data }));
					router.refresh();
					toast.success(`Estado actualizado automáticamente: ${result.data.estado}`);
					return;
				}
				programar();
			}, demora);
		};

		programar();
		return () => {
			cancelado = true;
			window.clearTimeout(timeoutId);
		};
	}, [comp.estado, comprobante.id, router]);

	const aplicarResultado = (data) => {
		if (data) setActualizacion((prev) => ({ ...(prev || {}), ...data }));
		router.refresh();
	};

	const handleProcesar = async () => {
		setProcesando(true);
		const result = await procesarComprobante(comp.id);
		if (result.error) toast.error(result.error);
		else {
			aplicarResultado(result.data);
			toast.success(`Estado: ${result.data?.estado}`);
		}
		setProcesando(false);
	};

	const handleDescartar = async () => {
		if (!confirm('Este comprobante se marcará como descartado localmente. Esto no ejecuta una anulación ante el SRI. ¿Continuar?')) return;
		const result = await descartarComprobante(comp.id);
		if (result.error) toast.error(result.error);
		else {
			aplicarResultado(result.data);
			toast.success('Comprobante descartado');
		}
	};

	const handleReConsultar = async () => {
		setProcesando(true);
		const result = await reConsultarAutorizacion(comp.id);
		if (result.error) toast.error(result.error);
		else if (result.data?.inconclusa) toast.info(`El SRI respondió: ${result.data.estadoRespuesta}`);
		else {
			aplicarResultado(result.data);
			toast.success(`Estado actualizado: ${result.data?.estado}`);
		}
		setProcesando(false);
	};

	const handleConsultarVigencia = async () => {
		setConsultandoVigencia(true);
		const result = await consultarEstadoSRI(comp.id);
		if (result.error) toast.error(result.error);
		else {
			aplicarResultado(result.data);
			if (result.data?.inconclusa) toast.warning(result.data.estado_sri_error_mensaje);
			else toast.success(`Estado fiscal confirmado: ${result.data?.estado_sri}`);
		}
		setConsultandoVigencia(false);
	};

	const handleReenviar = async () => {
		if (!confirm('El comprobante fue rechazado. Se corregirá y procesará nuevamente con una nueva clave. ¿Continuar?')) return;
		setProcesando(true);
		const result = await reenviarComprobante(comp.id);
		if (result.error) toast.error(result.error);
		else {
			aplicarResultado(result.data);
			toast.success(`Estado: ${result.data?.estado}`);
		}
		setProcesando(false);
	};

	const handleVerRIDE = () => {
		window.open(`/api/comprobantes/ride?id=${comp.id}`, '_blank');
	};

	const handleDescargarXML = () => {
		const xml = comp.xml_autorizado || comp.xml_firmado;
		if (!xml) {
			toast.error('No hay XML disponible');
			return;
		}
		const blob = new Blob([xml], { type: 'application/xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${comp.numero_completo || comp.clave_acceso || 'comprobante'}.xml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleEnviarEmail = async () => {
		const email = comp.email_comprador;
		if (!email) {
			toast.error('El comprador no tiene email registrado');
			return;
		}
		setEnviandoEmail(true);
		try {
			const res = await fetch('/api/comprobantes/email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ comprobanteId: comp.id, emailDestino: email }),
			});
			const data = await res.json();
			if (data.error) toast.error(data.error);
			else toast.success(`Email enviado a ${email}`);
		} catch {
			toast.error('Error al enviar email');
		}
		setEnviandoEmail(false);
	};

	const tieneXML = Boolean(comp.xml_autorizado || comp.xml_firmado);
	const estaAutorizado = comp.estado === 'AUT';
	const puedeConsultarVigencia = ['sent', 'PPR', 'AUT', 'NAT', 'PAN', 'ANU'].includes(comp.estado);

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Link href="/comprobantes">
						<GlassButton variant="ghost" size="sm" icon={ArrowLeft} />
					</Link>
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-base sm:text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
								{{ '01': 'Factura', '03': 'Liquidación de Compra', '04': 'Nota de Crédito', '05': 'Nota de Débito', '06': 'Guía de Remisión', '07': 'Retención' }[comp.tipo_comprobante] || 'Comprobante'} {comp.numero_completo || comp.secuencial}
							</h1>
							<StatusBadge estado={comp.estado} />
						</div>
						<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
							{comp.fecha_emision}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 pl-10 sm:pl-0">
					{comp.estado === 'draft' && (
						<GlassButton size="sm" icon={Send} onClick={handleProcesar} loading={procesando}>
							Procesar
						</GlassButton>
					)}
				{comp.estado === 'PPR' && (
					<>
						<GlassButton size="sm" icon={RefreshCw} onClick={handleReConsultar} loading={procesando}>
							Re-consultar SRI
						</GlassButton>
					</>
				)}
				{puedeConsultarVigencia && (
					<GlassButton size="sm" variant="secondary" icon={FileText} onClick={handleConsultarVigencia} loading={consultandoVigencia}>
						Consultar estado SRI
					</GlassButton>
				)}
				{['NAT', 'DEV'].includes(comp.estado) && (
					<GlassButton size="sm" variant="secondary" icon={RotateCcw} onClick={handleReenviar} loading={procesando}>
						Re-enviar al SRI
					</GlassButton>
				)}
					{(comp.estado === 'draft' || comp.estado === 'NAT' || comp.estado === 'DEV') && (
						<GlassButton variant="ghost" size="sm" icon={Ban} onClick={handleDescartar}>
							Descartar
						</GlassButton>
					)}
				</div>
			</div>

			{/* Acciones del documento: RIDE, XML, Email */}
			{(estaAutorizado || tieneXML) && (
				<GlassCard className="p-3" animate={false}>
					<div className="flex items-center gap-2 flex-wrap">
						{estaAutorizado && (
							<GlassButton size="sm" icon={Eye} onClick={handleVerRIDE}>
								Ver RIDE PDF
							</GlassButton>
						)}
						{tieneXML && (
							<GlassButton variant="secondary" size="sm" icon={Download} onClick={handleDescargarXML}>
								Descargar XML
							</GlassButton>
						)}
						{estaAutorizado && comp.email_comprador && (
							<GlassButton variant="secondary" size="sm" icon={Mail} onClick={handleEnviarEmail} loading={enviandoEmail}>
								Enviar por Email
							</GlassButton>
						)}
					</div>
				</GlassCard>
			)}

			{/* Timeline */}
			<ComprobanteTimeline estado={comp.estado} fechaAutorizacion={comp.fecha_autorizacion} />

			<GlassCard className="p-4" animate={false}>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Vigencia fiscal</p>
						<p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
							{comp.estado_sri || 'Sin verificación de vigencia'}
						</p>
						{comp.estado_sri_consultado_at && (
							<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
								Última consulta: {new Date(comp.estado_sri_consultado_at).toLocaleString('es-EC')}
							</p>
						)}
					</div>
					<span className="text-xs px-2 py-1 rounded-md" style={{ background: 'var(--glass-hover)', color: 'var(--text-secondary)' }}>
						Ambiente: {Number(comp.ambiente) === 2 ? 'Producción' : 'Pruebas'}
					</span>
				</div>
				{comp.estado_sri_error_mensaje && (
					<p className="text-xs mt-3" style={{ color: 'var(--color-warning)' }}>
						Última consulta inconclusa ({comp.estado_sri_error_codigo}): {comp.estado_sri_error_mensaje}
					</p>
				)}
			</GlassCard>

			{/* Clave de acceso */}
			{comp.clave_acceso && (
				<GlassCard className="p-4" animate={false}>
					<p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Clave de Acceso</p>
					<p className="font-mono text-xs break-all" style={{ color: 'var(--text-secondary)' }}>
						{comp.clave_acceso}
					</p>
				</GlassCard>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Emisor */}
				<GlassCard className="p-4" animate={false}>
					<p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Emisor</p>
					<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{comp.empresa?.razon_social}</p>
					<p className="text-xs" style={{ color: 'var(--text-secondary)' }}>RUC: {comp.empresa?.ruc}</p>
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{comp.empresa?.direccion_matriz}</p>
				</GlassCard>

				{/* Comprador */}
				<GlassCard className="p-4" animate={false}>
					<p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Comprador</p>
					<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{comp.razon_social_comprador}</p>
					<p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{comp.identificacion_comprador}</p>
					{comp.email_comprador && (
						<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{comp.email_comprador}</p>
					)}
				</GlassCard>
			</div>

			{/* Detalles */}
			<GlassCard className="p-4" animate={false}>
				<p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Detalle</p>
				<div className="space-y-2">
					{(comp.detalles || []).map((det, i) => (
						<div key={i} className="flex items-center justify-between text-sm py-1.5 border-b" style={{ borderColor: 'var(--table-divider)' }}>
							<div className="flex-1">
								<span style={{ color: 'var(--text-primary)' }}>{det.descripcion}</span>
								<span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
									{Number(det.cantidad)} x ${Number(det.precio_unitario).toFixed(2)}
								</span>
							</div>
							<span className="font-mono" style={{ color: 'var(--text-primary)' }}>
								${Number(det.precio_total_sin_impuesto).toFixed(2)}
							</span>
						</div>
					))}
				</div>

				{/* Totales */}
				<div className="mt-4 pt-3 border-t space-y-1.5" style={{ borderColor: 'var(--glass-border)' }}>
					<div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
						<span>Subtotal</span>
						<span className="font-mono">${Number(comp.subtotal_sin_impuestos).toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
						<span>IVA</span>
						<span className="font-mono">${Number(comp.valor_iva).toFixed(2)}</span>
					</div>
					<div className="flex justify-between font-medium text-base pt-2 border-t" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}>
						<span>TOTAL</span>
						<span className="font-mono">${Number(comp.importe_total).toFixed(2)}</span>
					</div>
				</div>
			</GlassCard>
		</div>
	);
}
