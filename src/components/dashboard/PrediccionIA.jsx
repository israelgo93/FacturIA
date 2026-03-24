'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function PrediccionIA({ mes }) {
	const [texto, setTexto] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let cancel = false;
		(async () => {
			setLoading(true);
			setError('');
			try {
				const res = await fetch(`/api/dashboard/prediccion?mes=${encodeURIComponent(mes)}`);
				const json = await res.json();
				if (!res.ok) throw new Error(json.error || 'Error al generar');
				if (!cancel) setTexto(json.insights || '');
			} catch (e) {
				if (!cancel) setError(e.message || 'Error');
			} finally {
				if (!cancel) setLoading(false);
			}
		})();
		return () => { cancel = true; };
	}, [mes]);

	return (
		<GlassCard className="p-4 sm:p-5" hover={false}>
			<div className="flex items-center gap-2 mb-3">
				<Sparkles className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
				<h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
					Prediccion e insights IA
				</h3>
			</div>
			{loading ? (
				<div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
					<Loader2 className="w-4 h-4 animate-spin" />
					Analizando metricas...
				</div>
			) : error ? (
				<p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>
			) : (
				<pre
					className="text-xs whitespace-pre-wrap font-sans leading-relaxed m-0"
					style={{ color: 'var(--text-primary)' }}
				>
					{texto || 'Sin insights.'}
				</pre>
			)}
		</GlassCard>
	);
}
