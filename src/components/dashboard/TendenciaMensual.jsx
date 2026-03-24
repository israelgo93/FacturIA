'use client';

import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

export default function TendenciaMensual({ data }) {
	if (!data?.length) {
		return (
			<div className="h-[200px] flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
				Sin datos
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={200}>
			<AreaChart data={data}>
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
				<Area
					type="monotone"
					dataKey="ventas"
					stroke="var(--text-secondary)"
					fill="var(--glass-hover)"
					strokeWidth={2}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}
