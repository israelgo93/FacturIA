export default function AdminLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-6 w-48 rounded" style={{ background: 'var(--glass-bg)' }} />
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{[...Array(7)].map((_, i) => (
					<div key={i} className="h-20 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
				))}
			</div>
			<div className="h-64 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
		</div>
	);
}
