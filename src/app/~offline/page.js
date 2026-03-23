'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
	return (
		<div
			className="min-h-screen flex items-center justify-center p-6"
			style={{ background: 'var(--bg-primary)' }}
		>
			<div
				className="max-w-sm w-full text-center p-8 rounded-2xl"
				style={{
					background: 'var(--glass-bg)',
					border: '1px solid var(--glass-border)',
				}}
			>
				<div
					className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
					style={{ background: 'var(--glass-hover)' }}
				>
					<WifiOff className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
				</div>

				<h1
					className="text-xl font-semibold mb-2"
					style={{ color: 'var(--text-primary)' }}
				>
					Sin conexión
				</h1>

				<p
					className="text-sm mb-6"
					style={{ color: 'var(--text-muted)' }}
				>
					No hay conexión a internet. Verifica tu red y vuelve a intentarlo.
				</p>

				<button
					onClick={() => window.location.reload()}
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 active:scale-95"
					style={{
						background: 'var(--btn-primary-bg)',
						color: 'var(--btn-primary-text)',
					}}
				>
					<RefreshCw className="w-4 h-4" />
					Reintentar
				</button>
			</div>
		</div>
	);
}
