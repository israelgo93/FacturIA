'use client';

import { Inbox } from 'lucide-react';
import GlassButton from '@/components/ui/GlassButton';

export default function EmptyState({
	icon: Icon = Inbox,
	title = 'No hay datos',
	description = 'Aún no hay información para mostrar.',
	actionLabel,
	onAction,
	className = '',
}) {
	return (
		<div className={`flex flex-col items-center justify-center py-20 px-4 ${className}`}>
			<div
				className="p-5 rounded-2xl mb-5"
				style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
			>
				<Icon className="w-8 h-8" style={{ color: 'var(--text-disabled)' }} />
			</div>
			<h3 className="text-base font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
			<p className="text-sm text-center max-w-sm mb-8" style={{ color: 'var(--text-muted)' }}>{description}</p>
			{actionLabel && onAction && (
				<GlassButton variant="secondary" onClick={onAction}>
					{actionLabel}
				</GlassButton>
			)}
		</div>
	);
}
