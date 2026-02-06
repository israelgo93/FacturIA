'use client';

/**
 * Página para crear Nota de Crédito
 * Tipo de comprobante: 04
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Save, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import { GlassAlert } from '@/components/ui/GlassAlert';
import { SeleccionarDocumentoSustento } from '@/components/comprobantes/SeleccionarDocumentoSustento';
import { crearNotaCredito, procesarComprobante, obtenerComprobante } from '../actions';
import { TIPOS_IDENTIFICACION, TARIFAS_IVA, getTarifaIVA } from '@/lib/utils/sri-catalogs';

export default function NotaCreditoPage() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [comprobanteId, setComprobanteId] = useState(null);

	// Datos de configuración
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

	// Motivo y detalles
	const [motivo, setMotivo] = useState('');
	const [detalles, setDetalles] = useState([]);

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

	// Cargar puntos de emisión cuando cambia el establecimiento
	useEffect(() => {
		if (!establecimientoId) {
			setPuntosEmision([]);
			return;
		}
		const estab = establecimientos.find((e) => e.id === establecimientoId);
		if (estab?.puntos_emision) {
			setPuntosEmision(estab.puntos_emision);
			if (estab.puntos_emision.length > 0) {
				setPuntoEmisionId(estab.puntos_emision[0].id);
			}
		}
	}, [establecimientoId, establecimientos]);

	// Cuando se selecciona un documento sustento, cargar sus datos
	const handleSelectDocSustento = async (doc) => {
		setDocSustento(doc);
		setTipoIdentificacion(doc.cliente?.tipoIdentificacion || '');
		setIdentificacion(doc.cliente?.identificacion || '');
		setRazonSocial(doc.cliente?.razonSocial || '');

		// Cargar detalles del comprobante original
		try {
			const result = await obtenerComprobante(doc.id);
			if (result.data) {
				const comp = result.data;
				setTipoIdentificacion(comp.tipo_identificacion_comprador || '');
				setIdentificacion(comp.identificacion_comprador || '');
				setRazonSocial(comp.razon_social_comprador || '');
				setDireccion(comp.direccion_comprador || '');
				setEmail(comp.email_comprador || '');

				// Copiar detalles
				const dets = (comp.detalles || []).map((d) => ({
					codigoPrincipal: d.codigo_principal,
					descripcion: d.descripcion,
					cantidad: d.cantidad,
					precioUnitario: d.precio_unitario,
					descuento: d.descuento || 0,
					precioTotalSinImpuesto: d.precio_total_sin_impuesto,
					impuestos: (d.impuestos || []).map((i) => ({
						codigo: i.codigo,
						codigoPorcentaje: i.codigo_porcentaje,
						tarifa: i.tarifa,
						baseImponible: i.base_imponible,
						valor: i.valor,
					})),
					incluir: true,
					cantidadNC: d.cantidad,
				}));
				setDetalles(dets);
			}
		} catch (err) {
			console.error('Error cargando comprobante:', err);
		}
	};

	// Actualizar cantidad NC de un detalle
	const updateDetalleCantidad = (index, cantidad) => {
		const newDetalles = [...detalles];
		const det = newDetalles[index];
		det.cantidadNC = Math.min(Number(cantidad), det.cantidad);

		// Recalcular totales del detalle
		const subtotal = det.cantidadNC * det.precioUnitario;
		det.precioTotalSinImpuestoNC = subtotal;

		// Recalcular impuestos
		det.impuestosNC = det.impuestos.map((imp) => ({
			...imp,
			baseImponible: subtotal,
			valor: subtotal * (imp.tarifa / 100),
		}));

		setDetalles(newDetalles);
	};

	// Toggle incluir detalle
	const toggleDetalle = (index) => {
		const newDetalles = [...detalles];
		newDetalles[index].incluir = !newDetalles[index].incluir;
		setDetalles(newDetalles);
	};

	// Calcular totales de la NC
	const calcularTotales = () => {
		const detallesIncluidos = detalles.filter((d) => d.incluir);
		let subtotal = 0;
		let totalIva = 0;

		for (const d of detallesIncluidos) {
			const precioTotal = (d.cantidadNC || d.cantidad) * d.precioUnitario - (d.descuento || 0);
			subtotal += precioTotal;

			for (const imp of (d.impuestos || [])) {
				if (imp.codigo === '2') {
					totalIva += precioTotal * (imp.tarifa / 100);
				}
			}
		}

		return {
			subtotal: subtotal.toFixed(2),
			iva: totalIva.toFixed(2),
			total: (subtotal + totalIva).toFixed(2),
		};
	};

	const handleCrearBorrador = async () => {
		setLoading(true);
		setError(null);

		try {
			const detallesNC = detalles
				.filter((d) => d.incluir)
				.map((d) => {
					const cantidad = d.cantidadNC || d.cantidad;
					const precioTotal = cantidad * d.precioUnitario - (d.descuento || 0);

					return {
						codigoPrincipal: d.codigoPrincipal,
						descripcion: d.descripcion,
						cantidad,
						precioUnitario: d.precioUnitario,
						descuento: d.descuento || 0,
						precioTotalSinImpuesto: precioTotal,
						impuestos: (d.impuestos || []).map((imp) => ({
							codigo: imp.codigo,
							codigoPorcentaje: imp.codigoPorcentaje,
							tarifa: imp.tarifa,
							baseImponible: precioTotal,
							valor: precioTotal * (imp.tarifa / 100),
						})),
					};
				});

			const result = await crearNotaCredito({
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
				motivoModificacion: motivo,
				detalles: detallesNC,
			});

			if (result.error) {
				setError(result.error);
			} else {
				setComprobanteId(result.data.id);
				setSuccess(`Nota de Crédito ${result.data.numeroCompleto} creada como borrador`);
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
				setSuccess('Nota de Crédito autorizada correctamente');
				setTimeout(() => {
					router.push(`/comprobantes/${comprobanteId}`);
				}, 2000);
			} else {
				setError(`Estado: ${result.data.estado}. ${JSON.stringify(result.data.mensajes || '')}`);
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const totales = calcularTotales();

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
						Nueva Nota de Crédito
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Comprobante tipo 04 - Modifica una factura autorizada
					</p>
				</div>
			</div>

			{/* Steps indicator */}
			<div className="flex items-center gap-2 mb-6">
				{[1, 2, 3].map((s) => (
					<div
						key={s}
						className="flex items-center gap-2"
					>
						<div
							className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
							style={{
								background: step >= s ? 'var(--btn-primary-bg)' : 'var(--glass-bg)',
								color: step >= s ? 'var(--btn-primary-text)' : 'var(--text-muted)',
								border: `1px solid ${step >= s ? 'var(--btn-primary-bg)' : 'var(--glass-border)'}`,
							}}
						>
							{s}
						</div>
						{s < 3 && (
							<div
								className="w-12 h-0.5"
								style={{ background: step > s ? 'var(--btn-primary-bg)' : 'var(--glass-border)' }}
							/>
						)}
					</div>
				))}
			</div>

			{/* Alertas */}
			{error && (
				<GlassAlert type="error" className="mb-4">
					<AlertCircle size={16} />
					{error}
				</GlassAlert>
			)}
			{success && (
				<GlassAlert type="success" className="mb-4">
					<CheckCircle size={16} />
					{success}
				</GlassAlert>
			)}

			{/* Step 1: Seleccionar documento sustento */}
			{step === 1 && (
				<div className="space-y-4">
					{/* Establecimiento y Punto */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Punto de Emisión
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Establecimiento"
								value={establecimientoId}
								onChange={(e) => setEstablecimientoId(e.target.value)}
								options={establecimientos.map((e) => ({
									value: e.id,
									label: `${e.codigo} - ${e.direccion?.substring(0, 30)}...`,
								}))}
							/>
							<GlassSelect
								label="Punto de Emisión"
								value={puntoEmisionId}
								onChange={(e) => setPuntoEmisionId(e.target.value)}
								options={puntosEmision.map((p) => ({
									value: p.id,
									label: `${p.codigo} - ${p.descripcion || 'Principal'}`,
								}))}
							/>
						</div>
					</GlassCard>

					{/* Seleccionar factura */}
					<SeleccionarDocumentoSustento
						onSelect={handleSelectDocSustento}
						tipoDocumento="01"
						label="Seleccionar Factura a Modificar"
						selected={docSustento}
					/>

					{docSustento && (
						<div className="flex justify-end">
							<GlassButton
								onClick={() => setStep(2)}
								disabled={!establecimientoId || !puntoEmisionId}
							>
								Continuar
							</GlassButton>
						</div>
					)}
				</div>
			)}

			{/* Step 2: Configurar NC */}
			{step === 2 && (
				<div className="space-y-4">
					{/* Datos del comprador */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Datos del Comprador
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Tipo Identificación"
								value={tipoIdentificacion}
								onChange={(e) => setTipoIdentificacion(e.target.value)}
								options={TIPOS_IDENTIFICACION.map((t) => ({
									value: t.value,
									label: t.label,
								}))}
								disabled
							/>
							<GlassInput
								label="Identificación"
								value={identificacion}
								disabled
							/>
							<GlassInput
								label="Razón Social"
								value={razonSocial}
								disabled
								className="md:col-span-2"
							/>
						</div>
					</GlassCard>

					{/* Motivo */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Motivo de la Nota de Crédito
						</h3>
						<GlassInput
							label="Motivo (obligatorio)"
							value={motivo}
							onChange={(e) => setMotivo(e.target.value)}
							placeholder="Ej: Devolución de mercadería, Error en facturación, Descuento posterior..."
							required
						/>
					</GlassCard>

					{/* Detalles */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Items a Incluir en la NC
						</h3>
						<div className="space-y-3">
							{detalles.map((det, i) => (
								<div
									key={i}
									className="p-3 rounded-lg flex items-start gap-3"
									style={{
										background: det.incluir ? 'var(--glass-bg)' : 'transparent',
										border: `1px solid ${det.incluir ? 'var(--glass-border)' : 'var(--divider)'}`,
										opacity: det.incluir ? 1 : 0.5,
									}}
								>
									<input
										type="checkbox"
										checked={det.incluir}
										onChange={() => toggleDetalle(i)}
										className="mt-1"
									/>
									<div className="flex-1">
										<div className="flex justify-between">
											<span className="font-medium" style={{ color: 'var(--text-primary)' }}>
												{det.descripcion}
											</span>
											<span style={{ color: 'var(--text-secondary)' }}>
												${det.precioUnitario}
											</span>
										</div>
										<div className="flex items-center gap-4 mt-2">
											<div className="flex items-center gap-2">
												<span className="text-xs" style={{ color: 'var(--text-muted)' }}>
													Cantidad original: {det.cantidad}
												</span>
											</div>
											{det.incluir && (
												<div className="flex items-center gap-2">
													<label className="text-xs" style={{ color: 'var(--text-muted)' }}>
														Cantidad NC:
													</label>
													<input
														type="number"
														min="0.01"
														max={det.cantidad}
														step="0.01"
														value={det.cantidadNC || det.cantidad}
														onChange={(e) => updateDetalleCantidad(i, e.target.value)}
														className="w-20 px-2 py-1 rounded text-sm"
														style={{
															background: 'var(--input-bg)',
															border: '1px solid var(--input-border)',
															color: 'var(--text-primary)',
														}}
													/>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</GlassCard>

					{/* Totales */}
					<GlassCard className="p-4">
						<div className="space-y-2">
							<div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
								<span>Subtotal</span>
								<span>${totales.subtotal}</span>
							</div>
							<div className="flex justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
								<span>IVA</span>
								<span>${totales.iva}</span>
							</div>
							<div
								className="flex justify-between text-lg font-semibold pt-2"
								style={{ borderTop: '1px solid var(--divider)', color: 'var(--text-primary)' }}
							>
								<span>Total NC</span>
								<span>${totales.total}</span>
							</div>
						</div>
					</GlassCard>

					<div className="flex justify-between">
						<GlassButton variant="secondary" onClick={() => setStep(1)}>
							Atrás
						</GlassButton>
						<GlassButton
							onClick={handleCrearBorrador}
							disabled={!motivo || detalles.filter((d) => d.incluir).length === 0 || loading}
						>
							{loading ? 'Creando...' : 'Crear Borrador'}
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 3: Confirmar y procesar */}
			{step === 3 && (
				<div className="space-y-4">
					<GlassCard className="p-6 text-center">
						<FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-primary)' }} />
						<h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
							Nota de Crédito Creada
						</h2>
						<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
							La nota de crédito ha sido creada como borrador. 
							Puede procesarla ahora para firmarla y enviarla al SRI.
						</p>
						<div className="flex justify-center gap-4">
							<GlassButton
								variant="secondary"
								onClick={() => router.push('/comprobantes')}
							>
								Ir al Listado
							</GlassButton>
							<GlassButton
								onClick={handleProcesar}
								disabled={loading}
							>
								<Send size={16} />
								{loading ? 'Procesando...' : 'Firmar y Enviar al SRI'}
							</GlassButton>
						</div>
					</GlassCard>
				</div>
			)}
		</div>
	);
}
