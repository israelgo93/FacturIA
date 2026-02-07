'use client';

import { useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from './StatusBadge';
import ComprobanteTimeline from './ComprobanteTimeline';
import { ArrowLeft, Send, FileText, Download, Mail, Ban, Eye } from 'lucide-react';
import { procesarComprobante, anularComprobante } from '@/app/(dashboard)/comprobantes/actions';
import { toast } from 'sonner';

export default function ComprobanteDetalle({ comprobante }) {
	const [procesando, setProcesando] = useState(false);
	const [enviandoEmail, setEnviandoEmail] = useState(false);
	const comp = comprobante;

	const handleProcesar = async () => {
		setProcesando(true);
		const result = await procesarComprobante(comp.id);
		if (result.error) toast.error(result.error);
		else toast.success(`Estado: ${result.data?.estado}`);
		setProcesando(false);
	};

	const handleAnular = async () => {
		const result = await anularComprobante(comp.id);
		if (result.error) toast.error(result.error);
		else toast.success('Comprobante anulado');
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

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/comprobantes">
						<GlassButton variant="ghost" size="sm" icon={ArrowLeft} />
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
								Factura {comp.numero_completo || comp.secuencial}
							</h1>
							<StatusBadge estado={comp.estado} />
						</div>
						<p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
							{comp.fecha_emision}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{comp.estado === 'draft' && (
						<GlassButton size="sm" icon={Send} onClick={handleProcesar} loading={procesando}>
							Procesar
						</GlassButton>
					)}
					{(comp.estado === 'draft' || comp.estado === 'NAT' || comp.estado === 'DEV') && (
						<GlassButton variant="ghost" size="sm" icon={Ban} onClick={handleAnular}>
							Anular
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
							<GlassButton variant="outline" size="sm" icon={Download} onClick={handleDescargarXML}>
								Descargar XML
							</GlassButton>
						)}
						{estaAutorizado && comp.email_comprador && (
							<GlassButton variant="outline" size="sm" icon={Mail} onClick={handleEnviarEmail} loading={enviandoEmail}>
								Enviar por Email
							</GlassButton>
						)}
					</div>
				</GlassCard>
			)}

			{/* Timeline */}
			<ComprobanteTimeline estado={comp.estado} fechaAutorizacion={comp.fecha_autorizacion} />

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
