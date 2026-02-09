'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, FileText, ChevronDown, Receipt, CreditCard, ArrowDownLeft, Truck, ShoppingCart, FileCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';
import ComprobanteList from '@/components/comprobantes/ComprobanteList';
import { listarComprobantes } from './actions';

const TIPOS_COMPROBANTE = [
	{ codigo: '01', nombre: 'Factura', ruta: '/comprobantes/nuevo', icon: FileText },
	{ codigo: '03', nombre: 'Liquidación de Compra', ruta: '/comprobantes/liquidacion', icon: ShoppingCart },
	{ codigo: '04', nombre: 'Nota de Crédito', ruta: '/comprobantes/nota-credito', icon: CreditCard },
	{ codigo: '05', nombre: 'Nota de Débito', ruta: '/comprobantes/nota-debito', icon: ArrowDownLeft },
	{ codigo: '06', nombre: 'Guía de Remisión', ruta: '/comprobantes/guia-remision', icon: Truck },
	{ codigo: '07', nombre: 'Comprobante de Retención', ruta: '/comprobantes/retencion', icon: FileCheck },
];

function NuevoComprobanteDropdown() {
	const [open, setOpen] = useState(false);
	const ref = useRef(null);
	const router = useRouter();

	useEffect(() => {
		function handleClickOutside(e) {
			if (ref.current && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		}
		if (open) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [open]);

	return (
		<div ref={ref} className="relative">
			<GlassButton
				icon={Plus}
				iconRight={ChevronDown}
				size="sm"
				onClick={() => setOpen((prev) => !prev)}
			>
				Nuevo Comprobante
			</GlassButton>

			{open && (
				<div
					className="absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden shadow-xl border z-50"
					style={{
						background: 'var(--glass-bg)',
						borderColor: 'var(--glass-border)',
						backdropFilter: 'blur(20px)',
						WebkitBackdropFilter: 'blur(20px)',
					}}
				>
					{TIPOS_COMPROBANTE.map((tipo) => {
						const Icon = tipo.icon;
						return (
							<button
								key={tipo.codigo}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150"
								style={{ color: 'var(--text-primary)' }}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = 'var(--glass-hover)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = 'transparent';
								}}
								onClick={() => {
									setOpen(false);
									router.push(tipo.ruta);
								}}
							>
								<Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
								<span className="flex-1">{tipo.nombre}</span>
								<span
									className="text-[10px] font-mono px-1.5 py-0.5 rounded"
									style={{
										background: 'var(--glass-active)',
										color: 'var(--text-muted)',
									}}
								>
									{tipo.codigo}
								</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default function ComprobantesPage() {
	const [datos, setDatos] = useState({
		comprobantes: [],
		total: 0,
		page: 1,
		pageSize: 20,
		totalPages: 0,
	});
	const [cargando, setCargando] = useState(true);
	const [filtros, setFiltros] = useState({ busqueda: '', estado: '', page: 1 });

	const cargar = useCallback(async (params) => {
		setCargando(true);
		const result = await listarComprobantes({
			page: params?.page || 1,
			busqueda: params?.busqueda || '',
			estado: params?.estado || undefined,
		});
		if (result.data) {
			setDatos(result.data);
		}
		setCargando(false);
	}, []);

	useEffect(() => {
		cargar(filtros);
	}, [filtros, cargar]);

	const handleFilter = (newFiltros) => {
		setFiltros((prev) => ({ ...prev, ...newFiltros }));
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
						Comprobantes
					</h1>
					<p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
						Gestiona tus comprobantes electrónicos
					</p>
				</div>
				<NuevoComprobanteDropdown />
			</div>

			<ComprobanteList
				comprobantes={datos.comprobantes}
				total={datos.total}
				page={datos.page}
				totalPages={datos.totalPages}
				onFilter={handleFilter}
			/>
		</div>
	);
}
