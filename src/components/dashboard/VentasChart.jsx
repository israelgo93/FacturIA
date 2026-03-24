'use client';

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

export default function VentasChart({ data }) {
	if (!data?.length) {
		return (
			<div className="h-[240px] flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
				Sin datos de ventas
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={240}>
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
				<XAxis dataKey="mes" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
				<YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
				<Tooltip
					contentStyle={{
						background: 'var(--glass-bg)',
						border: '1px solid var(--glass-border)',
						borderRadius: '8px',
						color: 'var(--text-primary)',
					}}
					formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
				/>
				<Bar dataKey="ventas" fill="var(--text-secondary)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ResponsiveContainer>
	);
}
