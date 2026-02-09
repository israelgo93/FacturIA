'use client';

/**
 * Página para crear Nota de Débito
 * Tipo de comprobante: 05
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Trash2, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import { GlassAlert } from '@/components/ui/GlassAlert';
import { SeleccionarDocumentoSustento } from '@/components/comprobantes/SeleccionarDocumentoSustento';
import { crearNotaDebito, procesarComprobante, obtenerComprobante } from '../actions';
import { TIPOS_IDENTIFICACION, FORMAS_PAGO } from '@/lib/utils/sri-catalogs';

export default function NotaDebitoPage() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [comprobanteId, setComprobanteId] = useState(null);

	// Configuración
	const [establecimientos, setEstablecimientos] = useState([]);
	const [puntosEmision, setPuntosEmision] = useState([]);
	const [establecimientoId, setEstablecimientoId] = useState('');
	const [puntoEmisionId, setPuntoEmisionId] = useState('');

	// Documento sustento
	const [docSustento, setDocSustento] = useState(null);

	// Datos del comprador
	const [tipoIdentificacion, setTipoIdentificacion] = useState('');
	const [identificacion, setIdentificacion] = useState('');
	const [razonSocial, setRazonSocial] = useState('');
	const [direccion, setDireccion] = useState('');
	const [email, setEmail] = useState('');

	// Motivos (cargos adicionales)
	const [motivos, setMotivos] = useState([{ razon: '', valor: '' }]);

	// Pagos
	const [pagos, setPagos] = useState([{ formaPago: '20', total: '' }]);

	// Cargar establecimientos
	useEffect(() => {
		async function cargarConfig() {
			try {
				const res = await fetch('/api/empresa/config');
				const data = await res.json();
				if (data.establecimientos) {
					setEstablecimientos(data.establecimientos);
					if (data.establecimientos.length > 0) {
						setEstablecimientoId(data.establecimientos[0].id);
					}
				}
			} catch (err) {
				console.error('Error cargando configuración:', err);
			}
		}
		cargarConfig();
	}, []);

	useEffect(() => {
		if (!establecimientoId) return;
		const estab = establecimientos.find((e) => e.id === establecimientoId);
		if (estab?.puntos_emision) {
			setPuntosEmision(estab.puntos_emision);
			if (estab.puntos_emision.length > 0) {
				setPuntoEmisionId(estab.puntos_emision[0].id);
			}
		}
	}, [establecimientoId, establecimientos]);

	const handleSelectDocSustento = async (doc) => {
		setDocSustento(doc);
		try {
			const result = await obtenerComprobante(doc.id);
			if (result.data) {
				const comp = result.data;
				setTipoIdentificacion(comp.tipo_identificacion_comprador || '');
				setIdentificacion(comp.identificacion_comprador || '');
				setRazonSocial(comp.razon_social_comprador || '');
				setDireccion(comp.direccion_comprador || '');
				setEmail(comp.email_comprador || '');
			}
		} catch (err) {
			console.error('Error cargando comprobante:', err);
		}
	};

	const addMotivo = () => {
		setMotivos([...motivos, { razon: '', valor: '' }]);
	};

	const removeMotivo = (index) => {
		if (motivos.length > 1) {
			setMotivos(motivos.filter((_, i) => i !== index));
		}
	};

	const updateMotivo = (index, field, value) => {
		const newMotivos = [...motivos];
		newMotivos[index][field] = value;
		setMotivos(newMotivos);
	};

	const calcularTotal = () => {
		return motivos.reduce((sum, m) => sum + (Number(m.valor) || 0), 0).toFixed(2);
	};

	// Actualizar total de pagos automáticamente
	useEffect(() => {
		const total = calcularTotal();
		if (pagos.length === 1) {
			setPagos([{ ...pagos[0], total }]);
		}
	}, [motivos]);

	const handleCrearBorrador = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await crearNotaDebito({
				establecimientoId,
				puntoEmisionId,
				docSustentoTipo: docSustento.tipo,
				docSustentoNumero: docSustento.numero,
				docSustentoFecha: docSustento.fecha,
				comprobanteReferenciaId: docSustento.id,
				tipoIdentificacionComprador: tipoIdentificacion,
				identificacionComprador: identificacion,
				razonSocialComprador: razonSocial,
				direccionComprador: direccion,
				emailComprador: email,
				motivos: motivos.map((m) => ({
					razon: m.razon,
					valor: Number(m.valor),
				})),
				pagos: pagos.map((p) => ({
					formaPago: p.formaPago,
					total: Number(p.total),
				})),
			});

			if (result.error) {
				setError(result.error);
			} else {
				setComprobanteId(result.data.id);
				setSuccess(`Nota de Débito ${result.data.numeroCompleto} creada como borrador`);
				setStep(3);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleProcesar = async () => {
		if (!comprobanteId) return;
		setLoading(true);
		setError(null);

		try {
			const result = await procesarComprobante(comprobanteId);
			if (result.error) {
				setError(result.error);
			} else if (result.data.estado === 'AUT') {
				setSuccess('Nota de Débito autorizada correctamente');
				setTimeout(() => router.push(`/comprobantes/${comprobanteId}`), 2000);
			} else {
				setError(`Estado: ${result.data.estado}`);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 md:p-6 max-w-4xl mx-auto">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => router.back()}
					className="p-2 rounded-lg transition-colors"
					style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
				>
					<ArrowLeft size={20} style={{ color: 'var(--text-primary)' }} />
				</button>
				<div>
					<h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
						Nueva Nota de Débito
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Comprobante tipo 05 - Cargos adicionales sobre una factura
					</p>
				</div>
			</div>

		{/* Alertas */}
		{error && <GlassAlert type="error" message={error} className="mb-4" onClose={() => setError(null)} />}
		{success && <GlassAlert type="success" message={success} className="mb-4" />}

			{/* Step 1 */}
			{step === 1 && (
				<div className="space-y-4">
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Punto de Emisión
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Establecimiento"
								value={establecimientoId}
								onChange={(e) => setEstablecimientoId(e.target.value)}
								options={establecimientos.map((e) => ({ value: e.id, label: `${e.codigo} - ${e.direccion?.substring(0, 30)}...` }))}
							/>
							<GlassSelect
								label="Punto de Emisión"
								value={puntoEmisionId}
								onChange={(e) => setPuntoEmisionId(e.target.value)}
								options={puntosEmision.map((p) => ({ value: p.id, label: `${p.codigo} - ${p.descripcion || 'Principal'}` }))}
							/>
						</div>
					</GlassCard>

					<SeleccionarDocumentoSustento
						onSelect={handleSelectDocSustento}
						tipoDocumento="01"
						label="Seleccionar Factura a Modificar"
						selected={docSustento}
					/>

					{docSustento && (
						<div className="flex justify-end">
							<GlassButton onClick={() => setStep(2)} disabled={!establecimientoId || !puntoEmisionId}>
								Continuar
							</GlassButton>
						</div>
					)}
				</div>
			)}

			{/* Step 2 */}
			{step === 2 && (
				<div className="space-y-4">
					{/* Datos comprador */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Datos del Comprador
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassInput label="Identificación" value={identificacion} disabled />
							<GlassInput label="Razón Social" value={razonSocial} disabled />
						</div>
					</GlassCard>

					{/* Motivos */}
					<GlassCard className="p-4">
						<div className="flex justify-between items-center mb-3">
							<h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
								Motivos del Cargo
							</h3>
							<GlassButton variant="secondary" size="sm" onClick={addMotivo}>
								<Plus size={16} /> Agregar
							</GlassButton>
						</div>
						<div className="space-y-3">
							{motivos.map((m, i) => (
								<div key={i} className="flex gap-3 items-start">
									<div className="flex-1">
										<GlassInput
											label="Razón"
											value={m.razon}
											onChange={(e) => updateMotivo(i, 'razon', e.target.value)}
											placeholder="Ej: Intereses por mora"
										/>
									</div>
									<div className="w-32">
										<GlassInput
											label="Valor"
											type="number"
											step="0.01"
											value={m.valor}
											onChange={(e) => updateMotivo(i, 'valor', e.target.value)}
										/>
									</div>
									{motivos.length > 1 && (
										<button
											onClick={() => removeMotivo(i)}
											className="mt-8 p-2 rounded-lg hover:bg-red-500/10"
											style={{ color: '#ef4444' }}
										>
											<Trash2 size={16} />
										</button>
									)}
								</div>
							))}
						</div>
					</GlassCard>

					{/* Totales */}
					<GlassCard className="p-4">
						<div className="flex justify-between text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
							<span>Total ND</span>
							<span>${calcularTotal()}</span>
						</div>
					</GlassCard>

					{/* Pagos */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Forma de Pago
						</h3>
						<GlassSelect
							label="Forma de Pago"
							value={pagos[0].formaPago}
							onChange={(e) => setPagos([{ ...pagos[0], formaPago: e.target.value }])}
							options={FORMAS_PAGO.map((f) => ({ value: f.value, label: f.label }))}
						/>
					</GlassCard>

					<div className="flex justify-between">
						<GlassButton variant="secondary" onClick={() => setStep(1)}>Atrás</GlassButton>
						<GlassButton
							onClick={handleCrearBorrador}
							disabled={motivos.some((m) => !m.razon || !m.valor) || loading}
						>
							{loading ? 'Creando...' : 'Crear Borrador'}
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 3 */}
			{step === 3 && (
				<GlassCard className="p-6 text-center">
					<FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
					<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
						Nota de Débito Creada
					</h2>
					<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
						La nota de débito ha sido creada como borrador.
					</p>
					<div className="flex justify-center gap-4">
						<GlassButton variant="secondary" onClick={() => router.push('/comprobantes')}>
							Ir al Listado
						</GlassButton>
						<GlassButton onClick={handleProcesar} disabled={loading}>
							<Send size={16} />
							{loading ? 'Procesando...' : 'Firmar y Enviar al SRI'}
						</GlassButton>
					</div>
				</GlassCard>
			)}
		</div>
	);
}
