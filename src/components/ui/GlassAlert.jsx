'use client';

import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const typeConfig = {
	success: { icon: CheckCircle, opacity: '0.90' },
	error: { icon: AlertCircle, opacity: '0.60' },
	warning: { icon: AlertTriangle, opacity: '0.50' },
	info: { icon: Info, opacity: '0.40' },
};

export default function GlassAlert({
	type = 'info',
	message,
	title,
	onClose,
	className = '',
}) {
	const config = typeConfig[type] || typeConfig.info;
	const Icon = config.icon;

	return (
		<div
			className={`
				flex items-start gap-3 p-4 rounded-xl
				bg-white/[0.03] border border-white/[0.08]
				backdrop-blur-sm
				${className}
			`.trim()}
			role="alert"
		>
			<Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ opacity: config.opacity }} />
			<div className="flex-1 min-w-0">
				{title && <p className="text-sm font-medium text-white/80 mb-0.5">{title}</p>}
				<p className="text-sm text-white/50">{message}</p>
			</div>
			{onClose && (
				<button
					onClick={onClose}
					className="shrink-0 p-1 rounded-lg hover:bg-white/[0.06] transition-colors duration-300"
					aria-label="Cerrar alerta"
				>
					<X className="w-3.5 h-3.5 text-white/25" />
				</button>
			)}
		</div>
	);
}
