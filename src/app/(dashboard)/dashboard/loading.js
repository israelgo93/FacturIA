export default function DashboardLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
				))}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="h-64 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
				<div className="h-64 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
			</div>
		</div>
	);
}
