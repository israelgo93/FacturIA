'use client';

/**
 * Página para crear Comprobante de Retención
 * Tipo de comprobante: 07
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
import { crearRetencion, procesarComprobante } from '../actions';
import {
	TIPOS_IDENTIFICACION,
	CODIGOS_RETENCION_RENTA,
	CODIGOS_RETENCION_IVA_COMPROBANTE,
	TIPOS_DOC_SUSTENTO,
} from '@/lib/utils/sri-catalogs';

export default function RetencionPage() {
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

	// Período fiscal (inicializar vacío para evitar hydration mismatch, se establece en useEffect)
	const [periodoFiscal, setPeriodoFiscal] = useState('');

	// Datos del sujeto retenido
	const [tipoIdentificacion, setTipoIdentificacion] = useState('04');
	const [identificacion, setIdentificacion] = useState('');
	const [razonSocial, setRazonSocial] = useState('');
	const [email, setEmail] = useState('');

	// Documento sustento (opcional, manual)
	const [tipoDocSustento, setTipoDocSustento] = useState('01');
	const [numDocSustento, setNumDocSustento] = useState('');
	const [fechaDocSustento, setFechaDocSustento] = useState('');

	// Detalles de retención
	const [detalles, setDetalles] = useState([
		{
			tipoImpuesto: '1', // 1=Renta, 2=IVA
			codigoRetencion: '',
			baseImponible: '',
			porcentajeRetener: '',
			valorRetenido: '',
		},
	]);

	// Establecer período fiscal en el cliente para evitar hydration mismatch con new Date()
	useEffect(() => {
		const now = new Date();
		setPeriodoFiscal(`${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`);
	}, []);

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

	const addDetalle = () => {
		setDetalles([
			...detalles,
			{
				tipoImpuesto: '1',
				codigoRetencion: '',
				baseImponible: '',
				porcentajeRetener: '',
				valorRetenido: '',
			},
		]);
	};

	const removeDetalle = (index) => {
		if (detalles.length > 1) {
			setDetalles(detalles.filter((_, i) => i !== index));
		}
	};

	const updateDetalle = (index, field, value) => {
		const newDetalles = [...detalles];
		newDetalles[index][field] = value;

		// Calcular valor retenido automáticamente
		if (field === 'baseImponible' || field === 'porcentajeRetener') {
			const base = Number(newDetalles[index].baseImponible) || 0;
			const porcentaje = Number(newDetalles[index].porcentajeRetener) || 0;
			newDetalles[index].valorRetenido = ((base * porcentaje) / 100).toFixed(2);
		}

		// Si cambia el código de retención, auto-completar porcentaje
		if (field === 'codigoRetencion') {
			const tipoImp = newDetalles[index].tipoImpuesto;
			const catalogo = tipoImp === '1' ? CODIGOS_RETENCION_RENTA : CODIGOS_RETENCION_IVA_COMPROBANTE;
			const item = catalogo.find((c) => c.value === value);
			if (item) {
				newDetalles[index].porcentajeRetener = item.porcentaje.toString();
				const base = Number(newDetalles[index].baseImponible) || 0;
				newDetalles[index].valorRetenido = ((base * item.porcentaje) / 100).toFixed(2);
			}
		}

		setDetalles(newDetalles);
	};

	const calcularTotalRetenido = () => {
		return detalles.reduce((sum, d) => sum + (Number(d.valorRetenido) || 0), 0).toFixed(2);
	};

	const getCodigosRetencion = (tipoImpuesto) => {
		if (tipoImpuesto === '1') {
			return CODIGOS_RETENCION_RENTA.map((c) => ({
				value: c.value,
				label: `${c.value} - ${c.label} (${c.porcentaje}%)`,
			}));
		}
		return CODIGOS_RETENCION_IVA_COMPROBANTE.map((c) => ({
			value: c.value,
			label: `${c.value} - ${c.label} (${c.porcentaje}%)`,
		}));
	};

	const handleCrearBorrador = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await crearRetencion({
				establecimientoId,
				puntoEmisionId,
				periodoFiscal,
				tipoIdentificacionSujetoRetenido: tipoIdentificacion,
				identificacionSujetoRetenido: identificacion,
				razonSocialSujetoRetenido: razonSocial,
				emailSujetoRetenido: email,
				docSustentoTipo: tipoDocSustento,
				docSustentoNumero: numDocSustento,
				docSustentoFecha: fechaDocSustento,
				detalles: detalles.map((d) => ({
					tipoImpuesto: d.tipoImpuesto,
					codigoRetencion: d.codigoRetencion,
					baseImponible: Number(d.baseImponible),
					porcentajeRetener: Number(d.porcentajeRetener),
					valorRetenido: Number(d.valorRetenido),
				})),
			});

			if (result.error) {
				setError(result.error);
			} else {
				setComprobanteId(result.data.id);
				setSuccess(`Retención ${result.data.numeroCompleto} creada como borrador`);
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
				setSuccess('Retención autorizada correctamente');
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
						Nuevo Comprobante de Retención
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Comprobante tipo 07 - Retenciones de impuestos
					</p>
				</div>
			</div>

			{/* Alertas */}
			{error && <GlassAlert type="error" message={error} className="mb-4" onClose={() => setError(null)} />}
			{success && <GlassAlert type="success" message={success} className="mb-4" />}

			{/* Step 1: Configuración y Sujeto */}
			{step === 1 && (
				<div className="space-y-4">
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Punto de Emisión
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
							<GlassInput
								label="Período Fiscal"
								value={periodoFiscal}
								onChange={(e) => setPeriodoFiscal(e.target.value)}
								placeholder="MM/YYYY"
							/>
						</div>
					</GlassCard>

					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Sujeto Retenido
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Tipo Identificación"
								value={tipoIdentificacion}
								onChange={(e) => setTipoIdentificacion(e.target.value)}
								options={TIPOS_IDENTIFICACION.filter((t) => ['04', '05', '06'].includes(t.value)).map((t) => ({
									value: t.value,
									label: t.label,
								}))}
							/>
							<GlassInput
								label="Identificación"
								value={identificacion}
								onChange={(e) => setIdentificacion(e.target.value)}
								placeholder={tipoIdentificacion === '04' ? 'RUC (13 dígitos)' : 'Número de identificación'}
							/>
							<GlassInput
								label="Razón Social"
								value={razonSocial}
								onChange={(e) => setRazonSocial(e.target.value)}
								className="md:col-span-2"
							/>
							<GlassInput
								label="Email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="md:col-span-2"
							/>
						</div>
					</GlassCard>

					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Documento Sustento
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<GlassSelect
								label="Tipo Documento"
								value={tipoDocSustento}
								onChange={(e) => setTipoDocSustento(e.target.value)}
								options={TIPOS_DOC_SUSTENTO.map((t) => ({ value: t.value, label: `${t.value} - ${t.label}` }))}
							/>
							<GlassInput
								label="Número (001-001-000000001)"
								value={numDocSustento}
								onChange={(e) => setNumDocSustento(e.target.value)}
								placeholder="001-001-000000001"
							/>
							<GlassInput
								label="Fecha Emisión"
								type="date"
								value={fechaDocSustento}
								onChange={(e) => setFechaDocSustento(e.target.value)}
							/>
						</div>
					</GlassCard>

					<div className="flex justify-end">
						<GlassButton
							onClick={() => setStep(2)}
							disabled={!establecimientoId || !puntoEmisionId || !identificacion || !razonSocial}
						>
							Continuar
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 2: Detalles de Retención */}
			{step === 2 && (
				<div className="space-y-4">
					<GlassCard className="p-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
								Detalles de Retención
							</h3>
							<GlassButton variant="secondary" size="sm" onClick={addDetalle}>
								<Plus size={16} /> Agregar
							</GlassButton>
						</div>

						<div className="space-y-4">
							{detalles.map((d, i) => (
								<div
									key={i}
									className="p-4 rounded-lg"
									style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
								>
									<div className="flex justify-between items-center mb-3">
										<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
											Retención #{i + 1}
										</span>
										{detalles.length > 1 && (
											<button onClick={() => removeDetalle(i)} className="p-1 rounded transition-colors" style={{ color: 'var(--color-danger)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-danger-muted)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
												<Trash2 size={16} />
											</button>
										)}
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
										<GlassSelect
											label="Tipo Impuesto"
											value={d.tipoImpuesto}
											onChange={(e) => updateDetalle(i, 'tipoImpuesto', e.target.value)}
											options={[
												{ value: '1', label: 'Renta' },
												{ value: '2', label: 'IVA' },
											]}
										/>
										<GlassSelect
											label="Código Retención"
											value={d.codigoRetencion}
											onChange={(e) => updateDetalle(i, 'codigoRetencion', e.target.value)}
											options={getCodigosRetencion(d.tipoImpuesto)}
										/>
										<GlassInput
											label="Base Imponible"
											type="number"
											step="0.01"
											value={d.baseImponible}
											onChange={(e) => updateDetalle(i, 'baseImponible', e.target.value)}
										/>
										<GlassInput
											label="% Retención"
											type="number"
											step="0.01"
											value={d.porcentajeRetener}
											onChange={(e) => updateDetalle(i, 'porcentajeRetener', e.target.value)}
										/>
									</div>
									<div className="mt-3 text-right">
										<span className="text-sm" style={{ color: 'var(--text-muted)' }}>Valor Retenido: </span>
										<span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${d.valorRetenido || '0.00'}</span>
									</div>
								</div>
							))}
						</div>
					</GlassCard>

					{/* Total */}
					<GlassCard className="p-4">
						<div className="flex justify-between text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
							<span>Total Retenido</span>
							<span>${calcularTotalRetenido()}</span>
						</div>
					</GlassCard>

					<div className="flex justify-between">
						<GlassButton variant="secondary" onClick={() => setStep(1)}>Atrás</GlassButton>
						<GlassButton
							onClick={handleCrearBorrador}
							disabled={detalles.some((d) => !d.codigoRetencion || !d.baseImponible) || loading}
						>
							{loading ? 'Creando...' : 'Crear Borrador'}
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 3: Confirmación */}
			{step === 3 && (
				<GlassCard className="p-6 text-center">
					<FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
					<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
						Comprobante de Retención Creado
					</h2>
					<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
						La retención ha sido creada como borrador. Total retenido: ${calcularTotalRetenido()}
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
