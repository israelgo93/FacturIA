'use client';

import { useState } from 'react';
import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from './StatusBadge';
import { Search, Plus, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function ComprobanteList({ comprobantes, total, page, totalPages, onFilter }) {
	const [busqueda, setBusqueda] = useState('');
	const [filtroEstado, setFiltroEstado] = useState('');

	const handleBuscar = (valor) => {
		setBusqueda(valor);
		onFilter?.({ busqueda: valor, estado: filtroEstado, page: 1 });
	};

	const handleFiltroEstado = (valor) => {
		setFiltroEstado(valor);
		onFilter?.({ busqueda, estado: valor, page: 1 });
	};

	return (
		<div className="space-y-4">
			{/* Filtros */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="flex-1">
					<GlassInput
						icon={Search}
						placeholder="Buscar por nombre, RUC o número..."
						value={busqueda}
						onChange={(e) => handleBuscar(e.target.value)}
					/>
				</div>
				<GlassSelect
					label="Estado"
					value={filtroEstado}
					onChange={(e) => handleFiltroEstado(e.target.value)}
					className="w-full sm:w-48"
				>
					<option value="">Todos los estados</option>
					<option value="draft">Borrador</option>
					<option value="AUT">Autorizado</option>
					<option value="NAT">No Autorizado</option>
					<option value="PPR">Procesando</option>
					<option value="DEV">Devuelto</option>
					<option value="voided">Anulado</option>
				</GlassSelect>
			</div>

			{/* Tabla */}
			{comprobantes.length === 0 ? (
				<GlassCard className="p-8 text-center">
					<FileText className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						No se encontraron comprobantes
					</p>
				</GlassCard>
			) : (
				<GlassCard className="overflow-hidden" animate={false}>
					{/* Header */}
					<div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider border-b" style={{ color: 'var(--table-header-text)', borderColor: 'var(--table-divider)' }}>
						<div className="col-span-2">Número</div>
						<div className="col-span-3">Cliente</div>
						<div className="col-span-2">Fecha</div>
						<div className="col-span-2">Total</div>
						<div className="col-span-2">Estado</div>
						<div className="col-span-1"></div>
					</div>

					{/* Rows */}
					{comprobantes.map((comp) => (
						<Link
							key={comp.id}
							href={`/comprobantes/${comp.id}`}
							className="block px-4 py-3 border-b transition-colors"
							style={{ borderColor: 'var(--table-divider)' }}
							onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--table-row-hover)')}
							onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
						>
							{/* Desktop row */}
							<div className="hidden sm:grid grid-cols-12 gap-3 items-center">
								<div className="col-span-2">
									<span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
										{comp.numero_completo || comp.secuencial}
									</span>
								</div>
								<div className="col-span-3">
									<p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
										{comp.razon_social_comprador || '—'}
									</p>
									<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
										{comp.identificacion_comprador || ''}
									</p>
								</div>
								<div className="col-span-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
									{comp.fecha_emision}
								</div>
								<div className="col-span-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
									${Number(comp.importe_total).toFixed(2)}
								</div>
								<div className="col-span-2">
									<StatusBadge estado={comp.estado} />
								</div>
								<div className="col-span-1 flex justify-end">
									<Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
								</div>
							</div>

							{/* Mobile card */}
							<div className="sm:hidden space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<span className="font-mono text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
											{comp.numero_completo || comp.secuencial}
										</span>
										<StatusBadge estado={comp.estado} />
									</div>
									<span className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
										${Number(comp.importe_total).toFixed(2)}
									</span>
								</div>
								<p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
									{comp.razon_social_comprador || '—'}
								</p>
								<div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
									<span>{comp.identificacion_comprador || ''}</span>
									<span>{comp.fecha_emision}</span>
								</div>
							</div>
						</Link>
					))}
				</GlassCard>
			)}

			{/* Paginación */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
					<span>{total} comprobantes</span>
					<div className="flex items-center gap-2">
						<GlassButton
							variant="ghost"
							size="sm"
							icon={ChevronLeft}
							disabled={page <= 1}
							onClick={() => onFilter?.({ busqueda, estado: filtroEstado, page: page - 1 })}
						/>
						<span>{page} / {totalPages}</span>
						<GlassButton
							variant="ghost"
							size="sm"
							icon={ChevronRight}
							disabled={page >= totalPages}
							onClick={() => onFilter?.({ busqueda, estado: filtroEstado, page: page + 1 })}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
