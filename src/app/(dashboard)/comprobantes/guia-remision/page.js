'use client';

/**
 * Página para crear Guía de Remisión
 * Tipo de comprobante: 06
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Trash2, Send, AlertCircle, CheckCircle, Truck, MapPin, Package } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import { GlassAlert } from '@/components/ui/GlassAlert';
import { crearGuiaRemision, procesarComprobante } from '../actions';
import { TIPOS_IDENTIFICACION, MOTIVOS_TRASLADO, TIPOS_DOC_SUSTENTO } from '@/lib/utils/sri-catalogs';

export default function GuiaRemisionPage() {
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

	// Datos del transportista
	const [tipoIdentificacionTransportista, setTipoIdentificacionTransportista] = useState('04');
	const [rucTransportista, setRucTransportista] = useState('');
	const [razonSocialTransportista, setRazonSocialTransportista] = useState('');
	const [placa, setPlaca] = useState('');

	// Datos del traslado
	const [dirPartida, setDirPartida] = useState('');
	const [fechaInicioTransporte, setFechaInicioTransporte] = useState('');
	const [fechaFinTransporte, setFechaFinTransporte] = useState('');

	// Destinatarios
	const [destinatarios, setDestinatarios] = useState([
		{
			tipoIdentificacion: '04',
			identificacion: '',
			razonSocial: '',
			dirDestinatario: '',
			motivoTraslado: '01',
			docAduaneroUnico: '',
			codEstabDestino: '',
			ruta: '',
			docSustentoTipo: '01',
			docSustentoNumero: '',
			docSustentoFecha: '',
			detalles: [
				{
					codigoPrincipal: '',
					descripcion: '',
					cantidad: '',
				},
			],
		},
	]);

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
						// Usar dirección del establecimiento como dirección de partida
						setDirPartida(data.establecimientos[0].direccion || '');
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
			setDirPartida(estab.direccion || '');
		}
	}, [establecimientoId, establecimientos]);

	const addDestinatario = () => {
		setDestinatarios([
			...destinatarios,
			{
				tipoIdentificacion: '04',
				identificacion: '',
				razonSocial: '',
				dirDestinatario: '',
				motivoTraslado: '01',
				docAduaneroUnico: '',
				codEstabDestino: '',
				ruta: '',
				docSustentoTipo: '01',
				docSustentoNumero: '',
				docSustentoFecha: '',
				detalles: [{ codigoPrincipal: '', descripcion: '', cantidad: '' }],
			},
		]);
	};

	const removeDestinatario = (index) => {
		if (destinatarios.length > 1) {
			setDestinatarios(destinatarios.filter((_, i) => i !== index));
		}
	};

	const updateDestinatario = (index, field, value) => {
		const newDest = [...destinatarios];
		newDest[index][field] = value;
		setDestinatarios(newDest);
	};

	const addDetalle = (destIndex) => {
		const newDest = [...destinatarios];
		newDest[destIndex].detalles.push({ codigoPrincipal: '', descripcion: '', cantidad: '' });
		setDestinatarios(newDest);
	};

	const removeDetalle = (destIndex, detIndex) => {
		const newDest = [...destinatarios];
		if (newDest[destIndex].detalles.length > 1) {
			newDest[destIndex].detalles = newDest[destIndex].detalles.filter((_, i) => i !== detIndex);
			setDestinatarios(newDest);
		}
	};

	const updateDetalle = (destIndex, detIndex, field, value) => {
		const newDest = [...destinatarios];
		newDest[destIndex].detalles[detIndex][field] = value;
		setDestinatarios(newDest);
	};

	const handleCrearBorrador = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await crearGuiaRemision({
				establecimientoId,
				puntoEmisionId,
				dirPartida,
				fechaInicioTransporte,
				fechaFinTransporte,
				tipoIdentificacionTransportista,
				rucTransportista,
				razonSocialTransportista,
				placa,
				destinatarios: destinatarios.map((d) => ({
					tipoIdentificacion: d.tipoIdentificacion,
					identificacion: d.identificacion,
					razonSocial: d.razonSocial,
					dirDestinatario: d.dirDestinatario,
					motivoTraslado: d.motivoTraslado,
					docAduaneroUnico: d.docAduaneroUnico || null,
					codEstabDestino: d.codEstabDestino || null,
					ruta: d.ruta || null,
					docSustentoTipo: d.docSustentoTipo,
					docSustentoNumero: d.docSustentoNumero,
					docSustentoFecha: d.docSustentoFecha,
					detalles: d.detalles.map((det) => ({
						codigoPrincipal: det.codigoPrincipal,
						descripcion: det.descripcion,
						cantidad: Number(det.cantidad),
					})),
				})),
			});

			if (result.error) {
				setError(result.error);
			} else {
				setComprobanteId(result.data.id);
				setSuccess(`Guía de Remisión ${result.data.numeroCompleto} creada como borrador`);
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
				setSuccess('Guía de Remisión autorizada correctamente');
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
		<div className="p-4 md:p-6 max-w-5xl mx-auto">
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
						Nueva Guía de Remisión
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Comprobante tipo 06 - Traslado de mercadería
					</p>
				</div>
			</div>

			{/* Alertas */}
		{error && <GlassAlert type="error" message={error} className="mb-4" onClose={() => setError(null)} />}
		{success && <GlassAlert type="success" message={success} className="mb-4" />}

			{/* Step 1: Configuración y Transportista */}
			{step === 1 && (
				<div className="space-y-4">
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
							<MapPin size={16} /> Punto de Emisión y Origen
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
							<GlassInput
								label="Dirección de Partida"
								value={dirPartida}
								onChange={(e) => setDirPartida(e.target.value)}
								className="md:col-span-2"
							/>
						</div>
					</GlassCard>

					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
							<Truck size={16} /> Datos del Transportista
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Tipo Identificación"
								value={tipoIdentificacionTransportista}
								onChange={(e) => setTipoIdentificacionTransportista(e.target.value)}
								options={TIPOS_IDENTIFICACION.filter((t) => ['04', '05'].includes(t.value)).map((t) => ({
									value: t.value,
									label: t.label,
								}))}
							/>
							<GlassInput
								label="RUC/Identificación Transportista"
								value={rucTransportista}
								onChange={(e) => setRucTransportista(e.target.value)}
								placeholder="1234567890001"
							/>
							<GlassInput
								label="Razón Social Transportista"
								value={razonSocialTransportista}
								onChange={(e) => setRazonSocialTransportista(e.target.value)}
							/>
							<GlassInput
								label="Placa del Vehículo"
								value={placa}
								onChange={(e) => setPlaca(e.target.value.toUpperCase())}
								placeholder="ABC-1234"
							/>
						</div>
					</GlassCard>

					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Fechas de Transporte
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassInput
								label="Fecha Inicio Transporte"
								type="date"
								value={fechaInicioTransporte}
								onChange={(e) => setFechaInicioTransporte(e.target.value)}
							/>
							<GlassInput
								label="Fecha Fin Transporte"
								type="date"
								value={fechaFinTransporte}
								onChange={(e) => setFechaFinTransporte(e.target.value)}
							/>
						</div>
					</GlassCard>

					<div className="flex justify-end">
						<GlassButton
							onClick={() => setStep(2)}
							disabled={!establecimientoId || !puntoEmisionId || !rucTransportista || !placa || !fechaInicioTransporte}
						>
							Continuar
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 2: Destinatarios */}
			{step === 2 && (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<h3 className="text-sm font-medium uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
							<Package size={16} /> Destinatarios
						</h3>
						<GlassButton variant="secondary" size="sm" onClick={addDestinatario}>
							<Plus size={16} /> Agregar Destinatario
						</GlassButton>
					</div>

					{destinatarios.map((dest, di) => (
						<GlassCard key={di} className="p-4">
							<div className="flex justify-between items-center mb-4">
								<span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
									Destinatario #{di + 1}
								</span>
								{destinatarios.length > 1 && (
									<button onClick={() => removeDestinatario(di)} className="p-1 hover:bg-red-500/10 rounded" style={{ color: '#ef4444' }}>
										<Trash2 size={16} />
									</button>
								)}
							</div>

							{/* Datos del destinatario */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
								<GlassSelect
									label="Tipo Identificación"
									value={dest.tipoIdentificacion}
									onChange={(e) => updateDestinatario(di, 'tipoIdentificacion', e.target.value)}
									options={TIPOS_IDENTIFICACION.map((t) => ({ value: t.value, label: t.label }))}
								/>
								<GlassInput
									label="Identificación"
									value={dest.identificacion}
									onChange={(e) => updateDestinatario(di, 'identificacion', e.target.value)}
								/>
								<GlassInput
									label="Razón Social"
									value={dest.razonSocial}
									onChange={(e) => updateDestinatario(di, 'razonSocial', e.target.value)}
								/>
								<GlassInput
									label="Dirección Destino"
									value={dest.dirDestinatario}
									onChange={(e) => updateDestinatario(di, 'dirDestinatario', e.target.value)}
									className="lg:col-span-2"
								/>
								<GlassSelect
									label="Motivo Traslado"
									value={dest.motivoTraslado}
									onChange={(e) => updateDestinatario(di, 'motivoTraslado', e.target.value)}
									options={MOTIVOS_TRASLADO.map((m) => ({ value: m.value, label: `${m.value} - ${m.label}` }))}
								/>
							</div>

							{/* Documento Sustento */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
								<GlassSelect
									label="Tipo Doc. Sustento"
									value={dest.docSustentoTipo}
									onChange={(e) => updateDestinatario(di, 'docSustentoTipo', e.target.value)}
									options={TIPOS_DOC_SUSTENTO.slice(0, 5).map((t) => ({ value: t.value, label: `${t.value} - ${t.label}` }))}
								/>
								<GlassInput
									label="Número Doc. Sustento"
									value={dest.docSustentoNumero}
									onChange={(e) => updateDestinatario(di, 'docSustentoNumero', e.target.value)}
									placeholder="001-001-000000001"
								/>
								<GlassInput
									label="Fecha Doc. Sustento"
									type="date"
									value={dest.docSustentoFecha}
									onChange={(e) => updateDestinatario(di, 'docSustentoFecha', e.target.value)}
								/>
							</div>

							{/* Detalles del destinatario */}
							<div className="border-t pt-3" style={{ borderColor: 'var(--glass-border)' }}>
								<div className="flex justify-between items-center mb-2">
									<span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
										Ítems a transportar
									</span>
									<button
										onClick={() => addDetalle(di)}
										className="text-xs flex items-center gap-1 hover:underline"
										style={{ color: 'var(--accent-color)' }}
									>
										<Plus size={12} /> Agregar ítem
									</button>
								</div>
								{dest.detalles.map((det, deti) => (
									<div key={deti} className="flex gap-2 items-start mb-2">
										<GlassInput
											placeholder="Código"
											value={det.codigoPrincipal}
											onChange={(e) => updateDetalle(di, deti, 'codigoPrincipal', e.target.value)}
											className="w-24"
										/>
										<GlassInput
											placeholder="Descripción"
											value={det.descripcion}
											onChange={(e) => updateDetalle(di, deti, 'descripcion', e.target.value)}
											className="flex-1"
										/>
										<GlassInput
											placeholder="Cant."
											type="number"
											value={det.cantidad}
											onChange={(e) => updateDetalle(di, deti, 'cantidad', e.target.value)}
											className="w-20"
										/>
										{dest.detalles.length > 1 && (
											<button
												onClick={() => removeDetalle(di, deti)}
												className="p-2 hover:bg-red-500/10 rounded"
												style={{ color: '#ef4444' }}
											>
												<Trash2 size={14} />
											</button>
										)}
									</div>
								))}
							</div>
						</GlassCard>
					))}

					<div className="flex justify-between">
						<GlassButton variant="secondary" onClick={() => setStep(1)}>Atrás</GlassButton>
						<GlassButton
							onClick={handleCrearBorrador}
							disabled={
								destinatarios.some(
									(d) =>
										!d.identificacion ||
										!d.razonSocial ||
										!d.dirDestinatario ||
										d.detalles.some((det) => !det.descripcion || !det.cantidad)
								) || loading
							}
						>
							{loading ? 'Creando...' : 'Crear Borrador'}
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 3: Confirmación */}
			{step === 3 && (
				<GlassCard className="p-6 text-center">
					<Truck size={48} className="mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
					<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
						Guía de Remisión Creada
					</h2>
					<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
						La guía de remisión ha sido creada como borrador con {destinatarios.length} destinatario(s).
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
