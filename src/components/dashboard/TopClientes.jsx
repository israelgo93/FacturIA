'use client';

export default function TopClientes({ items }) {
	const list = Array.isArray(items) ? items : [];

	if (!list.length) {
		return (
			<p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
				Sin ventas a clientes identificados en el mes
			</p>
		);
	}

	return (
		<ul className="space-y-2 list-none p-0 m-0">
			{list.map((row, i) => (
				<li
					key={`${row.razon_social}-${i}`}
					className="flex justify-between items-center gap-3 text-xs py-2 border-b last:border-0"
					style={{ borderColor: 'var(--glass-border)' }}
				>
					<span className="truncate min-w-0" style={{ color: 'var(--text-primary)' }}>
						{i + 1}. {row.razon_social || '—'}
					</span>
					<span className="tabular-nums shrink-0" style={{ color: 'var(--text-secondary)' }}>
						${parseFloat(row.total_ventas || 0).toFixed(2)}
					</span>
				</li>
			))}
		</ul>
	);
}
