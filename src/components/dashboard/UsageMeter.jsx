'use client';

export default function UsageMeter({ usados, limite, planNombre }) {
	const u = Number(usados) || 0;
	const lim = limite == null ? null : Number(limite);
	const pct = lim != null && lim > 0 ? Math.min(100, (u / lim) * 100) : 0;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
				<span>Uso de comprobantes</span>
				<span style={{ color: 'var(--text-secondary)' }}>{planNombre || '—'}</span>
			</div>
			<div
				className="h-2 rounded-full overflow-hidden"
				style={{ background: 'var(--glass-hover)', border: '1px solid var(--glass-border)' }}
			>
				<div
					className="h-full rounded-full transition-all"
					style={{
						width: `${lim != null ? pct : 0}%`,
						background:
							pct >= 95
								? 'var(--color-danger)'
								: pct >= 80
									? 'var(--color-warning)'
									: 'var(--text-secondary)',
					}}
				/>
			</div>
			<p className="text-xs" style={{ color: 'var(--text-muted)' }}>
				{lim == null ? `${u} emitidos (plan ilimitado)` : `${u} / ${lim} este mes`}
			</p>
		</div>
	);
}
