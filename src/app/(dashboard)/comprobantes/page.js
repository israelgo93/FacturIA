'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import GlassButton from '@/components/ui/GlassButton';
import ComprobanteList from '@/components/comprobantes/ComprobanteList';
import { listarComprobantes } from './actions';

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
				<Link href="/comprobantes/nuevo">
					<GlassButton icon={Plus} size="sm">
						Nueva Factura
					</GlassButton>
				</Link>
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
