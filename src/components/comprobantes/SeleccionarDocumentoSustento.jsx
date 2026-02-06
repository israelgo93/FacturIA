'use client';

/**
 * Componente para seleccionar un documento sustento (factura autorizada)
 * Usado por: Nota de Crédito, Nota de Débito, Retención
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Calendar, User, DollarSign, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassInput } from '@/components/ui/GlassInput';
import { buscarComprobantesAutorizados } from '@/app/(dashboard)/comprobantes/actions';

export function SeleccionarDocumentoSustento({
	onSelect,
	tipoDocumento = '01',
	label = 'Seleccionar Documento de Referencia',
	placeholder = 'Buscar por número o cliente...',
	selected = null,
}) {
	const [busqueda, setBusqueda] = useState('');
	const [comprobantes, setComprobantes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const buscar = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await buscarComprobantesAutorizados({
				busqueda,
				tipoComprobante: tipoDocumento,
				limit: 10,
			});
			if (result.error) {
				setError(result.error);
			} else {
				setComprobantes(result.data || []);
			}
		} catch (err) {
			setError('Error al buscar comprobantes');
		} finally {
			setLoading(false);
		}
	}, [busqueda, tipoDocumento]);

	useEffect(() => {
		buscar();
	}, [buscar]);

	const formatDate = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('es-EC', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatCurrency = (amount) => {
		return new Intl.NumberFormat('es-EC', {
			style: 'currency',
			currency: 'USD',
		}).format(amount || 0);
	};

	const handleSelect = (comprobante) => {
		onSelect({
			id: comprobante.id,
			tipo: comprobante.tipo_comprobante,
			numero: comprobante.numero_completo,
			fecha: comprobante.fecha_emision,
			claveAcceso: comprobante.clave_acceso,
			autorizacion: comprobante.numero_autorizacion,
			cliente: {
				identificacion: comprobante.identificacion_comprador,
				razonSocial: comprobante.razon_social_comprador,
			},
			total: comprobante.importe_total,
		});
	};

	return (
		<GlassCard className="p-4">
			<h3
				className="text-sm font-medium uppercase tracking-wider mb-3"
				style={{ color: 'var(--text-primary)' }}
			>
				{label}
			</h3>

			<div className="mb-4">
				<GlassInput
					label=""
					icon={Search}
					value={busqueda}
					onChange={(e) => setBusqueda(e.target.value)}
					placeholder={placeholder}
				/>
			</div>

			{error && (
				<div
					className="mb-4 p-3 rounded-lg text-sm"
					style={{
						background: 'rgba(239, 68, 68, 0.1)',
						color: '#ef4444',
						border: '1px solid rgba(239, 68, 68, 0.2)',
					}}
				>
					{error}
				</div>
			)}

			{loading ? (
				<div className="flex items-center justify-center py-8">
					<div
						className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
						style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }}
					/>
				</div>
			) : comprobantes.length === 0 ? (
				<div
					className="text-center py-8 text-sm"
					style={{ color: 'var(--text-muted)' }}
				>
					No se encontraron comprobantes autorizados
				</div>
			) : (
				<div className="space-y-2 max-h-80 overflow-y-auto">
					{comprobantes.map((comp) => {
						const isSelected = selected?.id === comp.id;
						return (
							<button
								key={comp.id}
								type="button"
								onClick={() => handleSelect(comp)}
								className="w-full text-left p-3 rounded-xl transition-all duration-200"
								style={{
									background: isSelected ? 'var(--btn-primary-bg)' : 'var(--glass-bg)',
									border: `1px solid ${isSelected ? 'var(--btn-primary-bg)' : 'var(--glass-border)'}`,
									color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
								}}
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<FileText size={16} style={{ opacity: 0.7 }} />
											<span className="font-medium">
												{comp.numero_completo}
											</span>
											{isSelected && (
												<Check size={16} className="ml-auto" />
											)}
										</div>
										<div className="flex items-center gap-4 text-xs" style={{ opacity: 0.7 }}>
											<span className="flex items-center gap-1">
												<Calendar size={12} />
												{formatDate(comp.fecha_emision)}
											</span>
											<span className="flex items-center gap-1">
												<DollarSign size={12} />
												{formatCurrency(comp.importe_total)}
											</span>
										</div>
										<div
											className="flex items-center gap-1 mt-1 text-xs truncate"
											style={{ opacity: 0.7 }}
										>
											<User size={12} />
											{comp.razon_social_comprador}
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			)}

			{selected && (
				<div
					className="mt-4 p-3 rounded-lg"
					style={{
						background: 'rgba(34, 197, 94, 0.1)',
						border: '1px solid rgba(34, 197, 94, 0.2)',
					}}
				>
					<div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#22c55e' }}>
						<Check size={16} />
						Documento seleccionado: {selected.numero}
					</div>
				</div>
			)}
		</GlassCard>
	);
}
