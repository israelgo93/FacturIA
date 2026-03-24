'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationCard({ n, onRead }) {
	const timeAgo = n.created_at
		? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })
		: '';

	return (
		<div
			className={`px-3 py-2.5 rounded-lg border transition-colors ${n.leida ? 'opacity-70' : ''}`}
			style={{
				background: 'var(--glass-bg)',
				borderColor: 'var(--glass-border)',
			}}
		>
			<div className="flex justify-between gap-2 items-start">
				<div className="min-w-0 flex-1">
					<p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{n.titulo}</p>
					<p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{n.mensaje}</p>
					<p className="text-[10px] mt-1" style={{ color: 'var(--text-disabled)' }}>{timeAgo}</p>
				</div>
				<div className="flex flex-col gap-1 items-end shrink-0">
					{n.accion_url && (
						<Link href={n.accion_url} className="text-[10px] underline" style={{ color: 'var(--text-secondary)' }}>
							Abrir
						</Link>
					)}
					{!n.leida && (
						<button
							type="button"
							className="text-[10px]"
							style={{ color: 'var(--text-muted)' }}
							onClick={() => onRead(n.id)}
						>
							Marcar leida
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
