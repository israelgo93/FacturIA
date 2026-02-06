'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function GlassTable({
	columns = [],
	data = [],
	loading = false,
	emptyMessage = 'No hay datos disponibles',
	pagination,
	onPageChange,
	className = '',
}) {
	if (loading) {
		return (
			<div className="glass rounded-2xl p-12 flex items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	return (
		<div className={`glass rounded-2xl overflow-hidden ${className}`}>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
							{columns.map((col) => (
								<th
									key={col.key}
									className={`
										px-5 py-3.5 text-left text-[10px] font-medium
										uppercase tracking-widest
										${col.className || ''}
									`.trim()}
									style={{ color: 'var(--table-header-text)', width: col.width || undefined }}
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-5 py-16 text-center text-sm"
									style={{ color: 'var(--text-muted)' }}
								>
									{emptyMessage}
								</td>
							</tr>
						) : (
							data.map((row, rowIdx) => (
								<tr
									key={row.id || rowIdx}
									className="transition-colors duration-300"
									style={{ borderBottom: '1px solid var(--table-divider)' }}
									onMouseEnter={(e) => e.currentTarget.style.background = 'var(--table-row-hover)'}
									onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
								>
									{columns.map((col) => (
										<td
											key={col.key}
											className={`px-5 py-3.5 text-sm ${col.cellClassName || ''}`}
											style={{ color: 'var(--text-secondary)' }}
										>
											{col.render ? col.render(row[col.key], row) : row[col.key]}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{pagination && (
				<div
					className="flex items-center justify-between px-5 py-3"
					style={{ borderTop: '1px solid var(--glass-border)' }}
				>
					<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
						{pagination.from}-{pagination.to} de {pagination.total}
					</p>
					<div className="flex items-center gap-1">
						<button
							onClick={() => onPageChange?.(pagination.page - 1)}
							disabled={pagination.page <= 1}
							className="p-1.5 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
							style={{ color: 'var(--text-muted)' }}
							onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
							onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
							aria-label="Anterior"
						>
							<ChevronLeft className="w-3.5 h-3.5" />
						</button>
						<span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
							{pagination.page}/{pagination.totalPages}
						</span>
						<button
							onClick={() => onPageChange?.(pagination.page + 1)}
							disabled={pagination.page >= pagination.totalPages}
							className="p-1.5 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
							style={{ color: 'var(--text-muted)' }}
							onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-hover)'}
							onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
							aria-label="Siguiente"
						>
							<ChevronRight className="w-3.5 h-3.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
