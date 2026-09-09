'use client';

import Link from 'next/link';
import GlassCard from '@/components/ui/GlassCard';
import GlassInput from '@/components/ui/GlassInput';
import GlassSelect from '@/components/ui/GlassSelect';
import GlassButton from '@/components/ui/GlassButton';
import StatusBadge from './StatusBadge';
import { Search, FileText, ChevronLeft, ChevronRight, Eye, RefreshCw } from 'lucide-react';

const ESTADOS_CONSULTABLES = new Set(['sent', 'PPR', 'AUT', 'NAT', 'PAN', 'ANU']);

export default function ComprobanteList({ comprobantes, total, page, totalPages, filtros, onFilter, onConsultarVisibles, consultando }) {
	const idsConsultables = comprobantes
		.filter((comp) => ESTADOS_CONSULTABLES.has(comp.estado) && comp.clave_acceso)
		.map((comp) => comp.id);

	const actualizarFiltro = (campo, valor) => onFilter?.({ [campo]: valor, page: 1 });

	return (
		<div className="space-y-4">
			<GlassCard className="p-4" animate={false}>
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
					<GlassInput icon={Search} label="Buscar" placeholder="Cliente, identificación, número o clave..." value={filtros.busqueda} onChange={(event) => actualizarFiltro('busqueda', event.target.value)} />
					<GlassSelect label="Ambiente" value={filtros.ambiente} onChange={(event) => actualizarFiltro('ambiente', event.target.value)}>
						<option value="2">Producción</option>
						<option value="1">Pruebas</option>
						<option value="todos">Todos</option>
					</GlassSelect>
					<GlassSelect label="Estado" value={filtros.estado} onChange={(event) => actualizarFiltro('estado', event.target.value)}>
						<option value="">Todos los estados</option>
						<option value="draft">Borrador</option>
						<option value="sent">Enviado</option>
						<option value="AUT">Autorizado</option>
						<option value="NAT">No autorizado</option>
						<option value="PPR">Procesando</option>
						<option value="DEV">Devuelto</option>
						<option value="PAN">Pendiente de anular</option>
						<option value="ANU">Anulado por el SRI</option>
						<option value="DESC">Descartado</option>
					</GlassSelect>
					<GlassSelect label="Estado fiscal SRI" value={filtros.estadoSRI} onChange={(event) => actualizarFiltro('estadoSRI', event.target.value)}>
						<option value="">Todos</option>
						<option value="AUTORIZADO">Autorizado</option>
						<option value="NO AUTORIZADO">No autorizado</option>
						<option value="PENDIENTE DE ANULAR">Pendiente de anular</option>
						<option value="ANULADO">Anulado</option>
					</GlassSelect>
					<GlassSelect label="Tipo" value={filtros.tipoComprobante} onChange={(event) => actualizarFiltro('tipoComprobante', event.target.value)}>
						<option value="">Todos</option>
						<option value="01">Factura</option>
						<option value="03">Liquidación de compra</option>
						<option value="04">Nota de crédito</option>
						<option value="05">Nota de débito</option>
						<option value="06">Guía de remisión</option>
						<option value="07">Retención</option>
					</GlassSelect>
					<GlassInput type="date" label="Desde" value={filtros.fechaDesde} onChange={(event) => actualizarFiltro('fechaDesde', event.target.value)} />
					<GlassInput type="date" label="Hasta" value={filtros.fechaHasta} onChange={(event) => actualizarFiltro('fechaHasta', event.target.value)} />
					<div className="flex items-end">
						<GlassButton variant="secondary" icon={RefreshCw} loading={consultando} disabled={idsConsultables.length === 0} onClick={() => onConsultarVisibles?.(idsConsultables)} className="w-full">
							Consultar visibles ({idsConsultables.length})
						</GlassButton>
					</div>
				</div>
			</GlassCard>

			{comprobantes.length === 0 ? (
				<GlassCard className="p-8 text-center">
					<FileText className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>No se encontraron comprobantes</p>
				</GlassCard>
			) : (
				<GlassCard className="overflow-hidden" animate={false}>
					<div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider border-b" style={{ color: 'var(--table-header-text)', borderColor: 'var(--table-divider)' }}>
						<div className="col-span-2">Número</div><div className="col-span-3">Cliente</div><div className="col-span-1">Fecha</div><div className="col-span-2">Total</div><div className="col-span-1">Ambiente</div><div className="col-span-2">Estado</div><div className="col-span-1" />
					</div>
					{comprobantes.map((comp) => (
						<Link key={comp.id} href={`/comprobantes/${comp.id}`} className="block px-4 py-3.5 min-h-[56px] border-b transition-colors active:bg-[var(--glass-active)] hover:bg-[var(--table-row-hover)]" style={{ borderColor: 'var(--table-divider)' }}>
							<div className="hidden sm:grid grid-cols-12 gap-3 items-center">
								<div className="col-span-2 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{comp.numero_completo || comp.secuencial}</div>
								<div className="col-span-3 min-w-0"><p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{comp.razon_social_comprador || '—'}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{comp.identificacion_comprador || ''}</p></div>
								<div className="col-span-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{comp.fecha_emision}</div>
								<div className="col-span-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>${Number(comp.importe_total).toFixed(2)}</div>
								<div className="col-span-1 text-xs" style={{ color: Number(comp.ambiente) === 2 ? 'var(--text-primary)' : 'var(--color-warning)' }}>{Number(comp.ambiente) === 2 ? 'Prod.' : 'Pruebas'}</div>
								<div className="col-span-2"><StatusBadge estado={comp.estado} /></div>
								<div className="col-span-1 flex justify-end"><Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></div>
							</div>
							<div className="sm:hidden space-y-2.5">
								<div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 min-w-0"><span className="font-mono text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{comp.numero_completo || comp.secuencial}</span><StatusBadge estado={comp.estado} /></div><span className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${Number(comp.importe_total).toFixed(2)}</span></div>
								<p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{comp.razon_social_comprador || '—'}</p>
								<div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}><span>{comp.identificacion_comprador || ''}</span><span>{Number(comp.ambiente) === 2 ? 'Producción' : 'Pruebas'} · {comp.fecha_emision}</span></div>
							</div>
						</Link>
					))}
				</GlassCard>
			)}

			{totalPages > 1 && (
				<div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
					<span>{total} comprobantes</span>
					<div className="flex items-center gap-2">
						<GlassButton variant="ghost" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onFilter?.({ page: page - 1 })} className="touch-target" />
						<span>{page} / {totalPages}</span>
						<GlassButton variant="ghost" size="sm" icon={ChevronRight} disabled={page >= totalPages} onClick={() => onFilter?.({ page: page + 1 })} className="touch-target" />
					</div>
				</div>
			)}
		</div>
	);
}
