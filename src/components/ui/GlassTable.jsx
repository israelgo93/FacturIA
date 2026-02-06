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
						<tr className="border-b border-white/[0.06]">
							{columns.map((col) => (
								<th
									key={col.key}
									className={`
										px-5 py-3.5 text-left text-[10px] font-medium
										text-white/30 uppercase tracking-widest
										${col.className || ''}
									`.trim()}
									style={col.width ? { width: col.width } : undefined}
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-white/[0.03]">
						{data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length}
									className="px-5 py-16 text-center text-white/20 text-sm"
								>
									{emptyMessage}
								</td>
							</tr>
						) : (
							data.map((row, rowIdx) => (
								<tr
									key={row.id || rowIdx}
									className="hover:bg-white/[0.02] transition-colors duration-300"
								>
									{columns.map((col) => (
										<td
											key={col.key}
											className={`px-5 py-3.5 text-sm text-white/60 ${col.cellClassName || ''}`}
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
				<div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
					<p className="text-xs text-white/25">
						{pagination.from}-{pagination.to} de {pagination.total}
					</p>
					<div className="flex items-center gap-1">
						<button
							onClick={() => onPageChange?.(pagination.page - 1)}
							disabled={pagination.page <= 1}
							className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
							aria-label="Anterior"
						>
							<ChevronLeft className="w-3.5 h-3.5 text-white/40" />
						</button>
						<span className="text-xs text-white/30 px-2">
							{pagination.page}/{pagination.totalPages}
						</span>
						<button
							onClick={() => onPageChange?.(pagination.page + 1)}
							disabled={pagination.page >= pagination.totalPages}
							className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
							aria-label="Siguiente"
						>
							<ChevronRight className="w-3.5 h-3.5 text-white/40" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
