'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/comprobantes/StatusBadge';

export default function EmpresasTable() {
	const [empresas, setEmpresas] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/admin/empresas')
			.then((res) => res.json())
			.then((data) => {
				setEmpresas(Array.isArray(data) ? data : []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<GlassCard className="p-6" hover={false}>
				<p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando empresas...</p>
			</GlassCard>
		);
	}

	return (
		<GlassCard className="overflow-hidden" hover={false}>
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						<tr style={{ borderBottom: '1px solid var(--divider)' }}>
							{['Empresa', 'RUC', 'Plan', 'Estado', 'Registro'].map((h) => (
								<th key={h} className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{empresas.map((e) => (
							<tr key={e.id} style={{ borderBottom: '1px solid var(--divider)' }}>
								<td className="px-4 py-3">
									<p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
										{e.nombre_comercial || e.razon_social}
									</p>
								</td>
								<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
									{e.ruc}
								</td>
								<td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
									{e.plan}
								</td>
								<td className="px-4 py-3">
									<StatusBadge estado={e.estado_suscripcion} size="sm" />
								</td>
								<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
									{new Date(e.created_at).toLocaleDateString('es-EC')}
								</td>
							</tr>
						))}
						{empresas.length === 0 && (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
									No hay empresas registradas
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</GlassCard>
	);
}
