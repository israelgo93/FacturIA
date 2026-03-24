'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
	'var(--text-secondary)',
	'var(--text-muted)',
	'var(--color-accent-slate)',
	'var(--text-disabled)',
	'var(--glass-border)',
	'var(--text-primary)',
];

export default function ComprobantesPieChart({ porTipo }) {
	const raw = porTipo && typeof porTipo === 'object' ? porTipo : {};
	const data = Object.entries(raw).map(([name, value]) => ({
		name: `Tipo ${name}`,
		value: Number(value) || 0,
	}));

	if (!data.length || data.every((d) => d.value === 0)) {
		return (
			<div className="h-[220px] flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
				Sin comprobantes en el periodo
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={220}>
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					outerRadius={72}
					stroke="var(--glass-border)"
					strokeWidth={1}
				>
					{data.map((_, i) => (
						<Cell key={i} fill={COLORS[i % COLORS.length]} />
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						background: 'var(--glass-bg)',
						border: '1px solid var(--glass-border)',
						borderRadius: '8px',
						color: 'var(--text-primary)',
					}}
				/>
				<Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
			</PieChart>
		</ResponsiveContainer>
	);
}
