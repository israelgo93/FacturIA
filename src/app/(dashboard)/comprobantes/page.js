'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { Plus, FileText, ChevronDown, Receipt, CreditCard, ArrowDownLeft, Truck, ShoppingCart, FileCheck, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import ComprobanteList from '@/components/comprobantes/ComprobanteList';
import { consultarEstadosSRILote, listarComprobantes } from './actions';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

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
	const [isMobile, setIsMobile] = useState(false);
	const ref = useRef(null);
	const router = useRouter();

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 640);
		check();
		window.addEventListener('resize', check);
		return () => window.removeEventListener('resize', check);
	}, []);

	useEffect(() => {
		function handleClickOutside(e) {
			if (ref.current && !ref.current.contains(e.target)) {
				setOpen(false);
			}
		}
		if (open && !isMobile) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [open, isMobile]);

	useEffect(() => {
		if (open && isMobile) {
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open, isMobile]);

	const handleSelect = (ruta) => {
		setOpen(false);
		router.push(ruta);
	};

	const menuItems = TIPOS_COMPROBANTE.map((tipo) => {
		const Icon = tipo.icon;
		return (
			<button
				key={tipo.codigo}
				className="w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm transition-colors duration-150 active:bg-[var(--glass-active)]"
				style={{ color: 'var(--text-primary)' }}
				onMouseEnter={(e) => {
					e.currentTarget.style.background = 'var(--glass-hover)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.background = 'transparent';
				}}
				onClick={() => handleSelect(tipo.ruta)}
			>
				<Icon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
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
	});

	return (
		<>
			<div ref={ref} className="relative">
				<GlassButton
					icon={Plus}
					iconRight={ChevronDown}
					size="sm"
					onClick={() => setOpen((prev) => !prev)}
				>
					<span className="hidden sm:inline">Nuevo Comprobante</span>
					<span className="sm:hidden">Nuevo</span>
				</GlassButton>

				{/* Desktop dropdown */}
				{open && !isMobile && (
					<div
						className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden shadow-xl border z-50"
						style={{
							background: 'var(--modal-bg)',
							borderColor: 'var(--glass-border)',
							backdropFilter: 'blur(20px)',
							WebkitBackdropFilter: 'blur(20px)',
						}}
					>
						{menuItems}
					</div>
				)}
			</div>

			{/* Mobile bottom-sheet */}
			<AnimatePresence>
				{open && isMobile && (
					<div className="fixed inset-0 z-50 flex items-end">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 backdrop-blur-sm"
							style={{ background: 'var(--modal-overlay)' }}
							onClick={() => setOpen(false)}
						/>
						<motion.div
							initial={{ y: '100%' }}
							animate={{ y: 0 }}
							exit={{ y: '100%' }}
							transition={{ type: 'spring', damping: 30, stiffness: 300 }}
							className="relative w-full rounded-t-2xl overflow-hidden safe-area-bottom"
							style={{
								background: 'var(--modal-bg)',
								border: '1px solid var(--glass-border)',
								borderBottom: 'none',
								boxShadow: 'var(--shadow-glass-lg)',
							}}
						>
							{/* Drag handle */}
							<div className="flex justify-center pt-3 pb-1">
								<div className="w-10 h-1 rounded-full" style={{ background: 'var(--text-disabled)' }} />
							</div>
							<div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
								<h3 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>Nuevo Comprobante</h3>
								<button
									onClick={() => setOpen(false)}
									className="p-2.5 rounded-xl transition-colors touch-target flex items-center justify-center"
									style={{ color: 'var(--text-muted)' }}
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							<div className="py-2">
								{menuItems}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
}

function ComprobantesContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [datos, setDatos] = useState({
		comprobantes: [],
		total: 0,
		page: 1,
		pageSize: 20,
		totalPages: 0,
	});
	const [cargando, setCargando] = useState(true);
	const [consultando, setConsultando] = useState(false);
	const [filtros, setFiltros] = useState(() => ({
		busqueda: searchParams.get('busqueda') || '',
		estado: searchParams.get('estado') || '',
		estadoSRI: searchParams.get('estadoSRI') || '',
		ambiente: searchParams.get('ambiente') || '2',
		tipoComprobante: searchParams.get('tipo') || '',
		fechaDesde: searchParams.get('desde') || '',
		fechaHasta: searchParams.get('hasta') || '',
		page: Number(searchParams.get('page')) || 1,
	}));

	const cargar = useCallback(async (params) => {
		setCargando(true);
		const result = await listarComprobantes({
			page: params?.page || 1,
			busqueda: params?.busqueda || '',
			estado: params?.estado || undefined,
			estadoSRI: params?.estadoSRI || undefined,
			ambiente: params?.ambiente || '2',
			tipoComprobante: params?.tipoComprobante || undefined,
			fechaDesde: params?.fechaDesde || undefined,
			fechaHasta: params?.fechaHasta || undefined,
		});
		if (result.data) {
			setDatos(result.data);
		}
		setCargando(false);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => void cargar(filtros), 0);
		return () => clearTimeout(timer);
	}, [filtros, cargar]);

	useEffect(() => {
		const supabase = createBrowserClient();
		let recargaId;
		const channel = supabase
			.channel('comprobantes-listado')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'comprobantes' }, () => {
				window.clearTimeout(recargaId);
				recargaId = window.setTimeout(() => cargar(filtros), 250);
			})
			.subscribe();

		return () => {
			window.clearTimeout(recargaId);
			supabase.removeChannel(channel);
		};
	}, [cargar, filtros]);

	const handleFilter = (newFiltros) => {
		const siguientes = { ...filtros, ...newFiltros };
		const query = new URLSearchParams();
		if (siguientes.busqueda) query.set('busqueda', siguientes.busqueda);
		if (siguientes.estado) query.set('estado', siguientes.estado);
		if (siguientes.estadoSRI) query.set('estadoSRI', siguientes.estadoSRI);
		if (siguientes.ambiente !== '2') query.set('ambiente', siguientes.ambiente);
		if (siguientes.tipoComprobante) query.set('tipo', siguientes.tipoComprobante);
		if (siguientes.fechaDesde) query.set('desde', siguientes.fechaDesde);
		if (siguientes.fechaHasta) query.set('hasta', siguientes.fechaHasta);
		if (siguientes.page > 1) query.set('page', String(siguientes.page));
		router.replace(query.size ? `/comprobantes?${query.toString()}` : '/comprobantes', { scroll: false });
		setFiltros(siguientes);
	};

	const handleConsultarVisibles = async (ids) => {
		if (!confirm(`Se consultarán ${ids.length} comprobantes en su ambiente SRI registrado. ¿Continuar?`)) return;
		setConsultando(true);
		const result = await consultarEstadosSRILote(ids);
		if (result.error) {
			toast.error(result.error);
		} else {
			const errores = result.data.filter((item) => item.error).length;
			const inconclusas = result.data.filter((item) => item.data?.inconclusa).length;
			toast.success(`Consulta finalizada: ${result.data.length - errores - inconclusas} confirmados, ${inconclusas} inconclusos y ${errores} errores`);
			await cargar(filtros);
		}
		setConsultando(false);
	};

	return (
		<div className="space-y-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
				filtros={filtros}
				onFilter={handleFilter}
				onConsultarVisibles={handleConsultarVisibles}
				consultando={consultando || cargando}
			/>
		</div>
	);
}

export default function ComprobantesPage() {
	return (
		<Suspense fallback={<div className="h-40 animate-pulse rounded-xl" style={{ background: 'var(--glass-bg)' }} />}>
			<ComprobantesContent />
		</Suspense>
	);
}
