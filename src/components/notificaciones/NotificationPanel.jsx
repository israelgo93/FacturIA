'use client';

import { useEffect, useState, useCallback } from 'react';
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from '@/actions/notificacion-actions';
import { toast } from 'sonner';
import NotificationCard from './NotificationCard';

export default function NotificationPanel({ open, onClose, onCountChange }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);

	const cargar = useCallback(async () => {
		setLoading(true);
		const r = await listarNotificaciones({ limite: 30 });
		setLoading(false);
		if (r.error) {
			toast.error(r.error);
			return;
		}
		setItems(r.data || []);
		onCountChange?.();
	}, [onCountChange]);

	useEffect(() => {
		if (open) {
			cargar();
		}
	}, [open, cargar]);

	const handleRead = async (id) => {
		const fd = new FormData();
		fd.set('id', id);
		const r = await marcarNotificacionLeida(fd);
		if (r.error) toast.error(r.error);
		else {
			setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leida: true } : x)));
			onCountChange?.();
		}
	};

	const handleMarcarTodas = async () => {
		const r = await marcarTodasLeidas();
		if (r.error) toast.error(r.error);
		else {
			setItems((prev) => prev.map((x) => ({ ...x, leida: true })));
			onCountChange?.();
		}
	};

	if (!open) return null;

	return (
		<>
			<button
				type="button"
				className="fixed inset-0 z-[60] bg-black/40 lg:bg-transparent"
				aria-label="Cerrar panel"
				onClick={onClose}
			/>
			<div
				className="fixed right-4 top-14 z-[70] w-[min(100vw-2rem,380px)] max-h-[min(70vh,480px)] overflow-hidden rounded-xl shadow-xl flex flex-col"
				style={{
					background: 'var(--modal-bg)',
					border: '1px solid var(--divider)',
				}}
			>
				<div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--divider)' }}>
					<span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Notificaciones</span>
					<button type="button" className="text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={handleMarcarTodas}>
						Marcar todas
					</button>
				</div>
				<div className="overflow-y-auto p-2 space-y-2 flex-1">
					{loading ? (
						<p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Cargando...</p>
					) : items.length === 0 ? (
						<p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>Sin notificaciones</p>
					) : (
						items.map((n) => (
							<NotificationCard key={n.id} n={n} onRead={handleRead} />
						))
					)}
				</div>
			</div>
		</>
	);
}
