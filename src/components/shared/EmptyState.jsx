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
			<div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-5">
				<Icon className="w-8 h-8 text-white/15" />
			</div>
			<h3 className="text-base font-medium text-white/50 mb-1">{title}</h3>
			<p className="text-sm text-white/25 text-center max-w-sm mb-8">{description}</p>
			{actionLabel && onAction && (
				<GlassButton variant="secondary" onClick={onAction}>
					{actionLabel}
				</GlassButton>
			)}
		</div>
	);
}
