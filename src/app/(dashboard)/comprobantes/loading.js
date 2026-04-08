export default function ComprobantesLoading() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="flex justify-between items-center">
				<div className="h-6 w-40 rounded" style={{ background: 'var(--glass-bg)' }} />
				<div className="h-9 w-32 rounded-xl" style={{ background: 'var(--glass-bg)' }} />
			</div>
			<div className="h-96 rounded-2xl" style={{ background: 'var(--glass-bg)' }} />
		</div>
	);
}
