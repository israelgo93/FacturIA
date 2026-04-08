'use client';

import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';

export default function AuditLog() {
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/admin/audit?limit=50')
			.then((res) => res.json())
			.then((data) => {
				setLogs(data.logs || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<GlassCard className="p-6" hover={false}>
				<p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando audit log...</p>
			</GlassCard>
		);
	}

	return (
		<GlassCard className="overflow-hidden" hover={false}>
			<div className="overflow-x-auto">
				<table className="w-full text-left">
					<thead>
						<tr style={{ borderBottom: '1px solid var(--divider)' }}>
							{['Fecha', 'Accion', 'Entidad', 'Detalles'].map((h) => (
								<th key={h} className="px-4 py-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{logs.map((log) => (
							<tr key={log.id} style={{ borderBottom: '1px solid var(--divider)' }}>
								<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
									{new Date(log.created_at).toLocaleString('es-EC')}
								</td>
								<td className="px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
									{log.accion}
								</td>
								<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
									{log.entidad}
								</td>
								<td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
									{log.detalles && Object.keys(log.detalles).length > 0
										? JSON.stringify(log.detalles)
										: '—'}
								</td>
							</tr>
						))}
						{logs.length === 0 && (
							<tr>
								<td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
									Sin registros de auditoria
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</GlassCard>
	);
}
