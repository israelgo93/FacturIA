'use client';

/**
 * Página para crear Liquidación de Compra
 * Tipo de comprobante: 03
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Plus, Trash2, Send, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import { GlassAlert } from '@/components/ui/GlassAlert';
import { crearLiquidacionCompra, procesarComprobante } from '../actions';
import { TIPOS_IDENTIFICACION, FORMAS_PAGO, CODIGOS_IVA } from '@/lib/utils/sri-catalogs';

export default function LiquidacionCompraPage() {
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

	// Datos del proveedor
	const [tipoIdentificacionProveedor, setTipoIdentificacionProveedor] = useState('05');
	const [identificacionProveedor, setIdentificacionProveedor] = useState('');
	const [razonSocialProveedor, setRazonSocialProveedor] = useState('');
	const [direccionProveedor, setDireccionProveedor] = useState('');

	// Detalles
	const [detalles, setDetalles] = useState([
		{
			codigoPrincipal: '',
			descripcion: '',
			cantidad: '',
			precioUnitario: '',
			descuento: '0',
			codigoIVA: '0', // 0=0%, 2=12%, 3=14%, 4=15%, 5=5%
		},
	]);

	// Pagos
	const [pagos, setPagos] = useState([{ formaPago: '01', total: '' }]);

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
				codigoPrincipal: '',
				descripcion: '',
				cantidad: '',
				precioUnitario: '',
				descuento: '0',
				codigoIVA: '0',
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
		setDetalles(newDetalles);
	};

	// Cálculos
	const calcularSubtotal = (det) => {
		const cantidad = Number(det.cantidad) || 0;
		const precio = Number(det.precioUnitario) || 0;
		const descuento = Number(det.descuento) || 0;
		return cantidad * precio - descuento;
	};

	const getTarifaIVA = (codigoIVA) => {
		const tarifas = { '0': 0, '2': 12, '3': 14, '4': 15, '5': 5 };
		return tarifas[codigoIVA] || 0;
	};

	const calcularTotales = () => {
		let subtotal12 = 0;
		let subtotal0 = 0;
		let subtotalOtros = 0;
		let iva = 0;

		detalles.forEach((d) => {
			const sub = calcularSubtotal(d);
			const tarifa = getTarifaIVA(d.codigoIVA);

			if (tarifa === 0) {
				subtotal0 += sub;
			} else if (tarifa === 12) {
				subtotal12 += sub;
			} else {
				subtotalOtros += sub;
			}

			iva += sub * (tarifa / 100);
		});

		const totalSinImpuestos = subtotal12 + subtotal0 + subtotalOtros;
		const total = totalSinImpuestos + iva;

		return {
			subtotal12: subtotal12.toFixed(2),
			subtotal0: subtotal0.toFixed(2),
			totalSinImpuestos: totalSinImpuestos.toFixed(2),
			iva: iva.toFixed(2),
			total: total.toFixed(2),
		};
	};

	const totales = calcularTotales();

	// Actualizar total de pagos automáticamente
	useEffect(() => {
		if (pagos.length === 1) {
			setPagos([{ ...pagos[0], total: totales.total }]);
		}
	}, [detalles]);

	const handleCrearBorrador = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await crearLiquidacionCompra({
				establecimientoId,
				puntoEmisionId,
				tipoIdentificacionProveedor,
				identificacionProveedor,
				razonSocialProveedor,
				direccionProveedor,
				detalles: detalles.map((d) => ({
					codigoPrincipal: d.codigoPrincipal,
					descripcion: d.descripcion,
					cantidad: Number(d.cantidad),
					precioUnitario: Number(d.precioUnitario),
					descuento: Number(d.descuento) || 0,
					codigoIVA: d.codigoIVA,
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
				setSuccess(`Liquidación de Compra ${result.data.numeroCompleto} creada como borrador`);
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
				setSuccess('Liquidación de Compra autorizada correctamente');
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
						Nueva Liquidación de Compra
					</h1>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						Comprobante tipo 03 - Compras a personas naturales sin RUC
					</p>
				</div>
			</div>

			{/* Alertas */}
			{error && <GlassAlert type="error" className="mb-4"><AlertCircle size={16} />{error}</GlassAlert>}
			{success && <GlassAlert type="success" className="mb-4"><CheckCircle size={16} />{success}</GlassAlert>}

			{/* Step 1: Configuración y Proveedor */}
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

					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
							<ShoppingCart size={16} /> Datos del Proveedor
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<GlassSelect
								label="Tipo Identificación"
								value={tipoIdentificacionProveedor}
								onChange={(e) => setTipoIdentificacionProveedor(e.target.value)}
								options={TIPOS_IDENTIFICACION.filter((t) => ['05', '06', '08'].includes(t.value)).map((t) => ({
									value: t.value,
									label: t.label,
								}))}
							/>
							<GlassInput
								label="Identificación"
								value={identificacionProveedor}
								onChange={(e) => setIdentificacionProveedor(e.target.value)}
								placeholder={tipoIdentificacionProveedor === '05' ? 'Cédula (10 dígitos)' : 'Número de identificación'}
							/>
							<GlassInput
								label="Razón Social / Nombre"
								value={razonSocialProveedor}
								onChange={(e) => setRazonSocialProveedor(e.target.value)}
								className="md:col-span-2"
							/>
							<GlassInput
								label="Dirección"
								value={direccionProveedor}
								onChange={(e) => setDireccionProveedor(e.target.value)}
								className="md:col-span-2"
							/>
						</div>
					</GlassCard>

					<div className="flex justify-end">
						<GlassButton
							onClick={() => setStep(2)}
							disabled={!establecimientoId || !puntoEmisionId || !identificacionProveedor || !razonSocialProveedor}
						>
							Continuar
						</GlassButton>
					</div>
				</div>
			)}

			{/* Step 2: Detalles */}
			{step === 2 && (
				<div className="space-y-4">
					<GlassCard className="p-4">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
								Detalle de Productos/Servicios
							</h3>
							<GlassButton variant="secondary" size="sm" onClick={addDetalle}>
								<Plus size={16} /> Agregar
							</GlassButton>
						</div>

						<div className="space-y-3">
							{detalles.map((d, i) => (
								<div
									key={i}
									className="p-3 rounded-lg"
									style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
								>
									<div className="grid grid-cols-12 gap-2 items-start">
										<div className="col-span-2">
											<GlassInput
												placeholder="Código"
												value={d.codigoPrincipal}
												onChange={(e) => updateDetalle(i, 'codigoPrincipal', e.target.value)}
											/>
										</div>
										<div className="col-span-4">
											<GlassInput
												placeholder="Descripción"
												value={d.descripcion}
												onChange={(e) => updateDetalle(i, 'descripcion', e.target.value)}
											/>
										</div>
										<div className="col-span-1">
											<GlassInput
												placeholder="Cant."
												type="number"
												value={d.cantidad}
												onChange={(e) => updateDetalle(i, 'cantidad', e.target.value)}
											/>
										</div>
										<div className="col-span-2">
											<GlassInput
												placeholder="P. Unit."
												type="number"
												step="0.01"
												value={d.precioUnitario}
												onChange={(e) => updateDetalle(i, 'precioUnitario', e.target.value)}
											/>
										</div>
										<div className="col-span-2">
											<GlassSelect
												value={d.codigoIVA}
												onChange={(e) => updateDetalle(i, 'codigoIVA', e.target.value)}
												options={CODIGOS_IVA.map((c) => ({ value: c.codigo, label: `${c.tarifa}%` }))}
											/>
										</div>
										<div className="col-span-1 flex items-center justify-end">
											{detalles.length > 1 && (
												<button
													onClick={() => removeDetalle(i)}
													className="p-2 hover:bg-red-500/10 rounded"
													style={{ color: '#ef4444' }}
												>
													<Trash2 size={16} />
												</button>
											)}
										</div>
									</div>
									<div className="text-right mt-2">
										<span className="text-sm" style={{ color: 'var(--text-muted)' }}>
											Subtotal: ${calcularSubtotal(d).toFixed(2)}
										</span>
									</div>
								</div>
							))}
						</div>
					</GlassCard>

					{/* Totales */}
					<GlassCard className="p-4">
						<h3 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-primary)' }}>
							Totales
						</h3>
						<div className="space-y-2 text-sm">
							<div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
								<span>Subtotal 12%</span>
								<span>${totales.subtotal12}</span>
							</div>
							<div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
								<span>Subtotal 0%</span>
								<span>${totales.subtotal0}</span>
							</div>
							<div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
								<span>Total Sin Impuestos</span>
								<span>${totales.totalSinImpuestos}</span>
							</div>
							<div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
								<span>IVA</span>
								<span>${totales.iva}</span>
							</div>
							<div className="flex justify-between text-lg font-semibold pt-2 border-t" style={{ color: 'var(--text-primary)', borderColor: 'var(--glass-border)' }}>
								<span>Total</span>
								<span>${totales.total}</span>
							</div>
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
							disabled={detalles.some((d) => !d.descripcion || !d.cantidad || !d.precioUnitario) || loading}
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
						Liquidación de Compra Creada
					</h2>
					<p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
						La liquidación de compra ha sido creada como borrador. Total: ${totales.total}
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
