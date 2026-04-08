export default function ReportesLoading() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-6 w-32 rounded" style={{ background: 'var(--glass-bg)' }} />
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				{[...Array(6)].map((_, i) => (
					<div key={i} className="h-32 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
				))}
			</div>
		</div>
	);
}
