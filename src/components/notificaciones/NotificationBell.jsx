'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { contarNotificacionesNoLeidas } from '@/actions/notificacion-actions';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
	const [open, setOpen] = useState(false);
	const [count, setCount] = useState(0);

	const refreshCount = useCallback(async () => {
		const r = await contarNotificacionesNoLeidas();
		setCount(r.count || 0);
	}, []);

	useEffect(() => {
		refreshCount();
		const t = setInterval(refreshCount, 60000);
		return () => clearInterval(t);
	}, [refreshCount]);

	return (
		<div className="relative">
			<button
				type="button"
				className="relative p-2.5 rounded-xl transition-colors duration-300 touch-target flex items-center justify-center"
				style={{ color: 'var(--text-muted)' }}
				onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--glass-hover)'; }}
				onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
				aria-label="Notificaciones"
				aria-expanded={open}
				onClick={() => setOpen((o) => !o)}
			>
				<Bell className="w-5 h-5" />
				{count > 0 && (
					<span
						className="absolute top-1 right-1 min-w-[18px] h-[18px] px-0.5 rounded-full text-[10px] font-semibold flex items-center justify-center"
						style={{
							background: 'var(--color-danger-muted)',
							color: 'var(--color-danger)',
						}}
					>
						{count > 99 ? '99+' : count}
					</span>
				)}
			</button>
			<NotificationPanel
				open={open}
				onClose={() => setOpen(false)}
				onCountChange={refreshCount}
			/>
		</div>
	);
}
